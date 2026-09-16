const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db');

const approveChangeRequest = (changeId, approver, comments, callback) => {
  try {
    const db = getDB();

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO approvals
      (id, change_id, approver, decision, comments, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      changeId,
      approver,
      'Approved',
      comments || 'Approved via workflow.',
      now
    );

    const row = db.prepare(`
  SELECT *
  FROM change_requests
  WHERE id = ?
`).get(changeId);

const deploymentStatus =
  row.deployment_status === 'Scheduled'
    ? 'Scheduled'
    : 'Queued';

db.prepare(`
  UPDATE change_requests
  SET status = ?, deployment_status = ?, updated_at = ?
  WHERE id = ?
`).run(
  'Approved',
  deploymentStatus,
  now,
  changeId
);

    callback(null, {
      id,
      change_id: changeId,
      approver,
      decision: 'Approved',
      comments,
      created_at: now
    });
  } catch (err) {
    callback(err, null);
  }
};

const rejectChangeRequest = (changeId, approver, comments, callback) => {
  try {
    const db = getDB();

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO approvals
      (id, change_id, approver, decision, comments, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      changeId,
      approver,
      'Rejected',
      comments || 'Rejected after review.',
      now
    );

    db.prepare(`
      UPDATE change_requests
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      'Rejected',
      now,
      changeId
    );

    callback(null, {
      id,
      change_id: changeId,
      approver,
      decision: 'Rejected',
      comments,
      created_at: now
    });
  } catch (err) {
    callback(err, null);
  }
};

const getApprovals = (changeId, callback) => {
  try {
    const db = getDB();

    const rows = db.prepare(`
      SELECT *
      FROM approvals
      WHERE change_id = ?
      ORDER BY created_at DESC
    `).all(changeId);

    callback(null, rows);
  } catch (err) {
    callback(err, null);
  }
};

const getAllApprovals = (callback) => {
  try {
    const db = getDB();

    const rows = db.prepare(`
      SELECT *
      FROM approvals
      ORDER BY created_at DESC
    `).all();

    callback(null, rows);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = {
  approveChangeRequest,
  rejectChangeRequest,
  getApprovals,
  getAllApprovals,
};