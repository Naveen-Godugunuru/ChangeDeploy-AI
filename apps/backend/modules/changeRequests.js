const createChangeRequest = (data, callback) => {
  try {
    const db = require('../db').getDB();

    const id = `CR-${Date.now()}`;
    const now = new Date().toISOString();

    const {
      title,
      description,
      environment,
      severity,
      risk_score,
      owner,
      approver,
      scheduled_date,
      scheduled_time
    } = data;

    db.prepare(`
      INSERT INTO change_requests
      (
        id, title, description, environment,
        severity, risk_score, owner, approver,
        status, created_at, updated_at,
        deployment_status, rollback_status, scheduled_date, scheduled_time, scheduled_deployment_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description,
      environment,
      severity,
      risk_score,
      owner,
      approver || 'Pending',
      'Pending Approval',
      now,
      now,
      environment === 'P0'
  ? 'Scheduled'
  : 'Not Started',

'Ready',

scheduled_date || null,

scheduled_time || null,

scheduled_date && scheduled_time
  ? `${scheduled_date}T${scheduled_time}`
  : null
    );

    callback(null, {
      id,
      ...data,
      status: 'Pending Approval'
    });

  } catch (err) {
    callback(err, null);
  }
};

const getChangeRequest = (id, callback) => {
  try {
    const db = require('../db').getDB();

    const row = db
      .prepare('SELECT * FROM change_requests WHERE id = ?')
      .get(id);

    callback(null, row);
  } catch (err) {
    callback(err, null);
  }
};


const getAllChangeRequests = (callback) => {
  try {
    const db = require('../db').getDB();

    const rows = db
      .prepare('SELECT * FROM change_requests ORDER BY created_at DESC')
      .all();

    callback(null, rows);
  } catch (err) {
    callback(err, null);
  }
};

const updateChangeRequestStatus = (id, status, callback) => {
  try {
    const db = require('../db').getDB();

    db.prepare(`
      UPDATE change_requests
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(status, new Date().toISOString(), id);

    callback(null);
  } catch (err) {
    callback(err);
  }
};

const updateChangeRequestSummary = (id, summary, callback) => {
  try {
    const db = require('../db').getDB();

    db.prepare(`
      UPDATE change_requests
      SET summary = ?, updated_at = ?
      WHERE id = ?
    `).run(summary, new Date().toISOString(), id);

    callback(null);
  } catch (err) {
    callback(err);
  }
};

module.exports = {
  createChangeRequest,
  getChangeRequest,
  getAllChangeRequests,
  updateChangeRequestStatus,
  updateChangeRequestSummary,
};