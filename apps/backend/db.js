const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'changedeploy.db');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

const getDB = () => {
  if (!db) {
    db = new Database(dbPath);
    console.log('Connected to SQLite database');
  }
  return db;
};

const initializeSchema = (callback) => {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS change_requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      environment TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Approval',
      risk_score INTEGER NOT NULL,
      owner TEXT NOT NULL,
      approver TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deployment_status TEXT DEFAULT 'Not Started',
      rollback_status TEXT DEFAULT 'Ready',
      summary TEXT,
      scheduled_date TEXT,
      scheduled_time TEXT,
      scheduled_deployment_at TEXT
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      change_id TEXT NOT NULL,
      approver TEXT NOT NULL,
      decision TEXT NOT NULL,
      comments TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deployment_logs (
      id TEXT PRIMARY KEY,
      change_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Queued',
      jenkins_url TEXT,
      pipeline_steps TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      change_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      user TEXT,
      created_at TEXT NOT NULL
    );
  `);

  console.log('Database schema initialized successfully');

  if (callback) callback();
};

const seedData = (callback) => {
  if (callback) callback();
};

const closeDB = () => {
  if (db) {
    db.close();
  }
};

module.exports = {
  getDB,
  initializeSchema,
  seedData,
  closeDB,
};