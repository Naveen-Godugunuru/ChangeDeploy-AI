const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db');

const createAuditLog = (changeId, action, details, user, callback) => {
  try {
    const db = getDB();

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_logs
      (id, change_id, action, details, user, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      changeId,
      action,
      details,
      user || 'System',
      now
    );

    if (callback) {
      callback(null, {
        id,
        change_id: changeId,
        action,
        details,
        user: user || 'System',
        created_at: now
      });
    }
  } catch (err) {
    if (callback) {
      callback(err, null);
    } else {
      throw err;
    }
  }
};

const getAuditLogs = (changeId, callback) => {
  try {
    const db = getDB();

    const rows = db.prepare(`
      SELECT *
      FROM audit_logs
      WHERE change_id = ?
      ORDER BY created_at DESC
    `).all(changeId);

    callback(null, rows);
  } catch (err) {
    callback(err, null);
  }
};

const getAllAuditLogs = (callback) => {
  try {
    const db = getDB();

    const rows = db.prepare(`
      SELECT *
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    callback(null, rows);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAllAuditLogs,
};