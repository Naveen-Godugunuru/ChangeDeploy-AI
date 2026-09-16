const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import database and modules
const { getDB, initializeSchema, seedData, closeDB } = require('./db');
const changeRequests = require('./modules/changeRequests');
const approvals = require('./modules/approvals');
const deployments = require('./modules/deployments');
const auditLogs = require('./modules/auditLogs');
const deploymentSimulator = require('./modules/deploymentSimulator');
const nlpParser = require('./modules/nlpParser');
const scheduler =
  require('./modules/scheduler');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize database on startup
let dbReady = false;
initializeSchema(() => {
  seedData(() => {
    dbReady = true;
    console.log('Database ready');
  });
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', service: 'changedeploy-ai-backend', db_ready: dbReady });
});

// ============ Change Requests ============
app.post('/api/changes', (req, res) => {
  const { title, description, environment, severity, risk_score, owner, approver } = req.body;

  if (!title || !environment || !severity || !risk_score || !owner) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  changeRequests.createChangeRequest(
    { title, description, environment, severity, risk_score, owner, approver },
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create change request', message: err.message });
      }
      auditLogs.createAuditLog(result.id, 'Created', `Change request "${title}" created by ${owner}`, owner);
      res.json({ success: true, data: result });
    }
  );
});

app.get('/api/changes', (_, res) => {
  changeRequests.getAllChangeRequests((err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch change requests' });
    }
    res.json(rows);
  });
});

app.get('/api/changes/:id', (req, res) => {
  const { id } = req.params;
  changeRequests.getChangeRequest(id, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch change request' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Change request not found' });
    }
    res.json(row);
  });
});
app.post('/api/changes/:id/schedule', (req, res) => {

  const { id } = req.params;

  const {
    scheduled_date,
    scheduled_time
  } = req.body;

  try {

    const db = getDB();

    db.prepare(`
      UPDATE change_requests
      SET
        scheduled_date = ?,
        scheduled_time = ?,
        scheduled_deployment_at = ?,
        deployment_status = 'Scheduled'
      WHERE id = ?
    `).run(
      scheduled_date,
      scheduled_time,
      `${scheduled_date}T${scheduled_time}`,
      id
    );
    auditLogs.createAuditLog(
      id,
      'Scheduled',
      `Deployment scheduled for ${scheduled_date} ${scheduled_time}`,
      'Scheduler'
    );
    
    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});
app.get('/api/changes/:changeId/deployment-status', (req, res) => {
  deploymentSimulator.getDeploymentStatusByChangeId(
    req.params.changeId,
    (err, result) => {
      if (err) {
        return res.status(404).json({
          error: err.message,
        });
      }

      res.json(result);
    }
  );
});

// ============ Approvals ============
app.post('/api/changes/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approver, comments } = req.body;

  if (!approver) {
    return res.status(400).json({ error: 'Approver is required' });
  }

  approvals.approveChangeRequest(id, approver, comments, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to approve change request', message: err.message });
    }
    auditLogs.createAuditLog(id, 'Approved', `Change approved by ${approver}`, approver);
    res.json({ success: true, data: result });
  });
});

app.post('/api/changes/:id/reject', (req, res) => {
  const { id } = req.params;
  const { approver, comments } = req.body;

  if (!approver) {
    return res.status(400).json({ error: 'Approver is required' });
  }

  approvals.rejectChangeRequest(id, approver, comments, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to reject change request', message: err.message });
    }
    auditLogs.createAuditLog(id, 'Rejected', `Change rejected by ${approver}`, approver);
    res.json({ success: true, data: result });
  });
});

app.get('/api/changes/:id/approvals', (req, res) => {
  const { id } = req.params;
  approvals.getApprovals(id, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch approvals' });
    }
    res.json(rows || []);
  });
});

app.get('/api/approvals', (_, res) => {
  approvals.getAllApprovals((err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch approvals' });
    }
    res.json(rows);
  });
});

// ============ Deployments ============
app.post('/api/changes/:id/deploy', (req, res) => {
  const { id } = req.params;
  const { user } = req.body;

  deployments.startDeployment(id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to start deployment', message: err.message });
    }
    auditLogs.createAuditLog(id, 'Deployment', 'Deployment started', user || 'System');
    res.json({ success: true, data: result });
  });
});

app.post('/api/changes/:id/rollback', (req, res) => {
  const { id } = req.params;
  const { user } = req.body;

  deployments.rollbackDeployment(id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to rollback deployment', message: err.message });
    }
    auditLogs.createAuditLog(id, 'Rollback', 'Deployment rolled back', user || 'System');
    res.json({ success: true, data: result });
  });
});

app.get('/api/changes/:id/deployments', (req, res) => {
  const { id } = req.params;
  deployments.getDeployments(id, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch deployments' });
    }
    res.json(rows || []);
  });
});

// ============ Deployment Simulator ============
app.post('/api/changes/:id/simulate-deploy', (req, res) => {
  const { id } = req.params;
  const { user, simulateFailure } = req.body;
  const { v4: uuidv4 } = require('uuid');
  const deploymentId = uuidv4();

  deploymentSimulator.startDeploymentSimulation(deploymentId, id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to start deployment simulation', message: err.message });
    }
    const auditAction = simulateFailure ? 'Deployment Simulation (Failure Mode)' : 'Deployment Simulation';
    const auditDetails = simulateFailure 
      ? 'Deployment simulation started with failure on Health Check stage, auto-rollback enabled'
      : 'Deployment simulation started with 5 stages';
    auditLogs.createAuditLog(id, auditAction, auditDetails, user || 'System');
    res.json({ success: true, data: result });
  }, simulateFailure || false);
});

app.get('/api/deployments/:deploymentId/status', (req, res) => {
  const { deploymentId } = req.params;

  deploymentSimulator.getDeploymentStatus(deploymentId, (err, result) => {
    if (err) {
      return res.status(404).json({ error: 'Deployment not found', message: err.message });
    }
    res.json(result);
  });
});

app.post('/api/deployments/:deploymentId/cancel', (req, res) => {
  const { deploymentId } = req.params;
  const { user } = req.body;

  deploymentSimulator.cancelDeployment(deploymentId, (err, result) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to cancel deployment', message: err.message });
    }
    res.json({ success: true, data: result });
  });
});

// ============ Audit Logs ============
app.get('/api/audit', (_, res) => {
  auditLogs.getAllAuditLogs((err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
    res.json(rows);
  });
});

app.get('/api/changes/:id/audit', (req, res) => {
  const { id } = req.params;
  auditLogs.getAuditLogs(id, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
    res.json(rows || []);
  });
});

// ============ Dashboard ============
app.get('/api/dashboard', (_, res) => {
  changeRequests.getAllChangeRequests((err, changes) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
    auditLogs.getAllAuditLogs((auditErr, auditLogsData) => {
      if (auditErr) {
        return res.status(500).json({ error: 'Failed to fetch audit logs' });
      }
      res.json({ changes, auditLogs: auditLogsData });
    });
  });
});

// ============ Natural Language Parsing ============
app.post('/api/parse-deployment-command', (req, res) => {
  const { command, user } = req.body;

  if (!command || command.trim().length === 0) {
    return res.status(400).json({ error: 'Command is required' });
  }

  nlpParser.parseDeploymentCommand(command, (err, parseResult) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error, source: parseResult.source });
    }

    const { application, version, environment } = parseResult.data;

    // Create change request automatically
    const changeData = {
      title: `Deploy ${application} v${version} to ${environment}`,
      description: `Automated deployment of ${application} version ${version} to ${environment} environment. Created from natural language command: "${command}"`,
      environment: environment,
      severity:
  environment === 'P0'
    ? 'High'
    : 'Medium',

risk_score:
  environment === 'P0'
    ? 70
    : environment === 'U0'
    ? 50
    : 30,
      owner: user || 'NLP System',
      approver: 'Pending',
    };

    changeRequests.createChangeRequest(changeData, (createErr, result) => {
      if (createErr) {
        return res.status(500).json({ error: 'Failed to create change request', message: createErr.message });
      }

      auditLogs.createAuditLog(result.id, 'NLP Created', `Change created from natural language command: "${command}"`, user || 'System');

      res.json({
        success: true,
        parseSource: parseResult.source,
        parsed: parseResult.data,
        changeRequest: result,
      });
    });
  });
});

// Server startup
app.listen(PORT, () => {
  console.log(`ChangeDeploy AI backend running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  GET  /api/changes - List all change requests');
  console.log('  POST /api/changes - Create new change request');
  console.log('  GET  /api/changes/:id - Get specific change request');
  console.log('  POST /api/changes/:id/approve - Approve a change');
  console.log('  POST /api/changes/:id/reject - Reject a change');
  console.log('  POST /api/changes/:id/deploy - Start deployment');
  console.log('  POST /api/changes/:id/simulate-deploy - Start deployment simulation (5 stages)');
  console.log('  GET  /api/deployments/:deploymentId/status - Get deployment simulation status');
  console.log('  POST /api/deployments/:deploymentId/cancel - Cancel a deployment');
  console.log('  POST /api/changes/:id/rollback - Rollback deployment');
  console.log('  GET  /api/dashboard - Get dashboard data');
  console.log('  GET  /api/audit - Get audit logs');
});
scheduler.startScheduler();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  closeDB();
  process.exit(0);
});
