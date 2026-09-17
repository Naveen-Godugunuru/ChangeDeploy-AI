const { getDB } = require('../db');
const deploymentSimulator = require('./deploymentSimulator');
const { v4: uuidv4 } = require('uuid');

const startScheduler = () => {

  setInterval(() => {
    console.log('Scheduler running...');
    try {

      const db = getDB();

      const rows = db.prepare(`
        SELECT *
        FROM change_requests
        WHERE deployment_status = 'Scheduled'
      `).all();

      rows.forEach((row) => {
        if (!row.scheduled_deployment_at) {
          return;
        }

        const now = new Date();
        const scheduled = new Date(
          row.scheduled_deployment_at
        );

        if (now >= scheduled) {

          const deploymentId = uuidv4();

          deploymentSimulator.startDeploymentSimulation(
            deploymentId,
            row.id,
            () => {},
            false
          );

          db.prepare(`
            UPDATE change_requests
            SET deployment_status = ?
            WHERE id = ?
          `).run(
            'Deploying',
            row.id
          );

          console.log(
            'Scheduled deployment started:',
            row.id
          );
          const auditLogs =
  require('./auditLogs');

auditLogs.createAuditLog(
  row.id,
  'Deployment Started',
  'Scheduled production deployment started',
  'Scheduler'
);
        }

      });

    } catch (err) {
      console.error(err);
    }

  }, 10000);

};

module.exports = {
  startScheduler
};