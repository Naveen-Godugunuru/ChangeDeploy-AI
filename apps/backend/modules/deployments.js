const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db');

const startDeployment = (changeId, callback) => {
  const db = getDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  const mockSteps = ['Initializing Jenkins pipeline', 'Running smoke tests', 'Promoting artifact', 'Verifying production health'];

  db.run(
    `INSERT INTO deployment_logs (id, change_id, status, jenkins_url, pipeline_steps, started_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, changeId, 'Running', 'https://jenkins.example.com/job/deploy', JSON.stringify(mockSteps), now, now],
    (err) => {
      if (err) {
        callback(err, null);
      } else {
        // Update change request status
        db.run(
          'UPDATE change_requests SET status = ?, deployment_status = ?, updated_at = ? WHERE id = ?',
          ['In Progress', 'Deploying', now, changeId],
          (updateErr) => {
            callback(updateErr, {
              id,
              change_id: changeId,
              status: 'Running',
              pipeline_steps: mockSteps,
              started_at: now,
              created_at: now,
            });
          }
        );
      }
    }
  );
};

const completeDeployment = (changeId, callback) => {
  const db = getDB();
  const now = new Date().toISOString();

  db.run(
    'UPDATE deployment_logs SET status = ?, completed_at = ? WHERE change_id = ? ORDER BY created_at DESC LIMIT 1',
    ['Completed', now, changeId],
    (err) => {
      if (err) {
        callback(err, null);
      } else {
        db.run(
          'UPDATE change_requests SET status = ?, deployment_status = ?, updated_at = ? WHERE id = ?',
          ['Deployed', 'Completed', now, changeId],
          (updateErr) => {
            callback(updateErr, { status: 'Completed' });
          }
        );
      }
    }
  );
};

const rollbackDeployment = (changeId, callback) => {
  const db = getDB();
  const now = new Date().toISOString();

  // Update the latest deployment as rolled back
  db.run(
    'UPDATE deployment_logs SET status = ?, completed_at = ? WHERE change_id = ? ORDER BY created_at DESC LIMIT 1',
    ['Rolled Back', now, changeId],
    (err) => {
      if (err) {
        callback(err, null);
      } else {
        // Update change request status
        db.run(
          'UPDATE change_requests SET status = ?, deployment_status = ?, rollback_status = ?, updated_at = ? WHERE id = ?',
          ['Rolled Back', 'Rolled Back', 'Executed', now, changeId],
          (updateErr) => {
            callback(updateErr, { status: 'Rolled Back', deployment_status: 'Rolled Back', rollback_status: 'Executed' });
          }
        );
      }
    }
  );
};

const getDeployments = (changeId, callback) => {
  const db = getDB();
  db.all('SELECT * FROM deployment_logs WHERE change_id = ? ORDER BY created_at DESC', [changeId], (err, rows) => {
    if (rows) {
      rows = rows.map((row) => ({
        ...row,
        pipeline_steps: row.pipeline_steps ? JSON.parse(row.pipeline_steps) : [],
      }));
    }
    callback(err, rows);
  });
};

module.exports = {
  startDeployment,
  completeDeployment,
  rollbackDeployment,
  getDeployments,
};
