const STAGES = [
  { name: 'Checkout', duration: 5000 },
  { name: 'Build', duration: 8000 },
  { name: 'Test', duration: 10000 },
  { name: 'Deploy', duration: 12000 },
  { name: 'Health Check', duration: 5000 },
];



const TOTAL_DURATION = STAGES.reduce((sum, stage) => sum + stage.duration, 0);

// Active deployments in memory
const activeDeployments = new Map();
const deploymentIdByChangeId = new Map();

const startDeploymentSimulation = (
  deploymentId,
  changeId,
  callback,
  simulateFailure = false
  ) => {
    console.log(
    'SIMULATE FAILURE VALUE =',
    simulateFailure
    );
    const deployment = {
    id: deploymentId,
    change_id: changeId,
    startTime: Date.now(),
    currentStageIndex: 0,
    status: 'Running',
    completedAt: null,
    simulateFailure,
    stages: STAGES.map((s) => ({
      name: s.name,
      status: 'Pending',
      progress: 0,
    })),
  };

  activeDeployments.set(deploymentId, deployment);
  deploymentIdByChangeId.set(changeId, deploymentId);

  simulateDeploymentStage(deployment);

  callback(null, {
    id: deploymentId,
    change_id: changeId,
    status: 'Running',
    stages: deployment.stages,
    progress: 0,
  });
};

// NEW: look up the latest deployment for a change, then reuse getDeploymentStatus
const getDeploymentStatusByChangeId = (changeId, callback) => {
  const deploymentId = deploymentIdByChangeId.get(changeId);
  if (!deploymentId) {
    return callback(new Error('No deployment found for this change'), null);
  }
  return getDeploymentStatus(deploymentId, callback);
};

const simulateDeploymentStage = (deployment) => {
  const intervalId = setInterval(() => {
    const elapsed = Date.now() - deployment.startTime;

    let accumulated = 0;

    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i];

      if (elapsed < accumulated + stage.duration) {
        const stageElapsed = elapsed - accumulated;
        const stageProgress = Math.min(
          100,
          Math.round((stageElapsed / stage.duration) * 100)
        );
        if (stage.name === 'Health Check') {
          console.log(
          'HEALTH CHECK:',
          stage.name,
          );
          }
        deployment.stages.forEach((s, index) => {
          if (index < i) {
            s.status = 'Completed';
            s.progress = 100;
          } else if (index === i) {
            if (
              deployment.simulateFailure &&
              stage.name === 'Health Check'
            ) {
            
              console.log('FAILURE TRIGGERED');
            
              s.status = 'Failed';
              s.progress = 100;
            
              deployment.status = 'Failed';
              deployment.completedAt = new Date().toISOString();
            
              clearInterval(intervalId);
            
              try {
                const db = require('../db').getDB();
            
                db.prepare(`
                  UPDATE change_requests
                  SET status = ?,
                      deployment_status = ?,
                      updated_at = ?
                  WHERE id = ?
                `).run(
                  'Failed',
                  'Failed',
                  new Date().toISOString(),
                  deployment.change_id
                );
              } catch (err) {
                console.error(err);
              }
            
              setTimeout(() => {
            
                deployment.status = 'Rolled Back';
            
                try {
                  const db = require('../db').getDB();
            
                  db.prepare(`
                    UPDATE change_requests
                    SET status = ?,
                        deployment_status = ?,
                        rollback_status = ?,
                        updated_at = ?
                    WHERE id = ?
                  `).run(
                    'Rolled Back',
                    'Rolled Back',
                    'Executed',
                    new Date().toISOString(),
                    deployment.change_id
                  );
            
                  console.log('AUTO ROLLBACK COMPLETED');
            
                } catch (err) {
                  console.error(err);
                }
            
              }, 2000);
            
              return;
            }

            s.status = 'Running';
            s.progress = stageProgress;
          } else {
            s.status = 'Pending';
            s.progress = 0;
          }
        });

        break;
      }

      accumulated += stage.duration;
    }
    if (
      deployment.status === 'Failed' ||
      deployment.status === 'Rolled Back'
      ) {
      return;
      }

    if (elapsed >= TOTAL_DURATION) {
      deployment.stages.forEach((s) => {
        s.status = 'Completed';
        s.progress = 100;
      });

      deployment.status = 'Completed';
      const auditLogs =
  require('./auditLogs');

auditLogs.createAuditLog(
  deployment.change_id,
  'Deployment Completed',
  'Production deployment completed successfully',
  'System'
);
      deployment.completedAt = new Date().toISOString();
try {
  const db = require('../db').getDB();

  db.prepare(`
    UPDATE change_requests
    SET status = ?, deployment_status = ?, updated_at = ?
    WHERE id = ?
  `).run(
    'Deployed',
    'Completed',
    new Date().toISOString(),
    deployment.change_id
  );
} catch (err) {
  console.error(err);
}

      clearInterval(intervalId);
    }
  }, 1000);

  deployment.intervalId = intervalId;
};

const getDeploymentStatus = (deploymentId, callback) => {
  const deployment = activeDeployments.get(deploymentId);

  if (!deployment) {
    return callback(new Error('Deployment not found'), null);
  }

  const elapsed = Date.now() - deployment.startTime;
  const progress = Math.min(
    100,
    Math.round((elapsed / TOTAL_DURATION) * 100)
  );

  callback(null, {
    id: deployment.id,
    change_id: deployment.change_id,
    status: deployment.status,
    stages: deployment.stages,
    progress,
    completedAt: deployment.completedAt,
  });
};

const cancelDeployment = (deploymentId, callback) => {
  const deployment = activeDeployments.get(deploymentId);

  if (!deployment) {
    return callback(
      new Error('Deployment not found'),
      null
    );
  }

  if (deployment.intervalId) {
    clearInterval(deployment.intervalId);
  }

  deployment.status = 'Cancelled';
  deployment.completedAt = new Date().toISOString();

  callback(null, {
    status: 'Cancelled',
  });
};

module.exports = {
  startDeploymentSimulation,
  getDeploymentStatus,
   getDeploymentStatusByChangeId, // NEW
  cancelDeployment,
  STAGES,
};