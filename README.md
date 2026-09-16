# ChangeDeploy AI

ChangeDeploy AI is an AI-assisted Change and Release Management platform that simulates an enterprise deployment workflow.

The application allows users to create deployment requests using natural language commands, route them through an approval process, schedule production deployments, monitor deployment pipelines, execute rollback scenarios, and maintain a complete audit trail.

---

## Features

### Deployment Request Creation

Create deployment requests using natural language commands.

Examples:

Deploy inventory-api 1.2.0 to Production

Deploy payment-api 2.1.0 to D0

Deploy frontend-ui 3.1.0 to U0

---

### Build Validation

Before creating a deployment request, the system validates whether the requested build version exists.

Example:

✅ Deploy inventory-api 1.2.0 to Production

❌ Deploy inventory-api 9.9.9 to Production

Result:

Build version not found

---

### Approval Workflow

Deployment requests are routed through an approval workflow.

Actions:

- Approve
- Reject

All approval actions are stored in the audit trail.

---

### Environment Support

Supported deployment environments:

- D0 (Development)
- I0 (Integration)
- U0 (User Acceptance Testing)
- P0 (Production)

---

### Production Scheduling

Production deployments require scheduling.

Users can:

- Select deployment date
- Select deployment time
- Schedule production deployments

Deployment starts automatically when the scheduled time is reached.

---

### Deployment Pipeline

Jenkins-style deployment simulation including:

- Checkout
- Build
- Test
- Deploy
- Health Check

Real-time pipeline progress is displayed in Deployment Monitor.

---

### Failure Simulation

Users can simulate deployment failures.

Failure scenario:

Checkout ✅

Build ✅

Test ✅

Deploy ✅

Health Check ❌

Rollback ✅

---

### Auto Rollback

If Health Check fails:

- Deployment is marked Failed
- Automatic rollback is triggered
- Rollback status is updated
- Audit trail entries are recorded

---

### Deployment Monitor

Track:

- Pending
- Approved
- Scheduled
- Deploying
- Completed
- Failed
- Rolled Back

Real-time progress is displayed using Jenkins-style pipeline stages.

---

### Audit Trail

Provides complete deployment visibility.

Events tracked:

- NLP Created
- Approved
- Scheduled
- Deployment Started
- Deployment Completed
- Rollback Executed

---

### Dashboard

Overview of:

- Total Changes
- Approved Requests
- Pending Requests
- High Risk Changes
- Rollbacks

Data is loaded from the backend database.

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express.js

### Database

- SQLite

### NLP Layer

- Local NLP Parser
- OpenAI Ready Architecture

### Deployment Engine

- Jenkins-style Pipeline Simulator
- Automatic Rollback Engine

---

## Project Workflow

User Command
↓
NLP Parsing
↓
Build Validation
↓
Change Request
↓
Approval
↓
Production Scheduling (P0 only)
↓
Deployment Pipeline
↓
Health Check
↓
Success OR Failure
↓
Rollback
↓
Audit Trail

---

## Quick Start

Install dependencies:

npm install

Start application:

npm run dev

Frontend:

http://localhost:3000

Backend:

http://localhost:4000

---

## Environment Variables

Create:

apps/backend/.env

Example:

PORT=4000

OPENAI_API_KEY=your_openai_key

If OpenAI is not enabled, the application automatically falls back to the local NLP parser.

---

## Current Implementation Status

### Real Components

- Deployment Request Creation
- Build Validation
- Approval Workflow
- Production Scheduling
- Deployment Monitor
- Audit Trail
- Dashboard
- SQLite Persistence

### Simulated Components

- Jenkins Pipeline
- Deployment Execution
- Build Repository
- Rollback Execution

The simulation layer is used to demonstrate enterprise deployment workflows without requiring real Jenkins or ServiceNow integrations.

---

## Future Enhancements

- ServiceNow Integration
- Jenkins API Integration
- Artifact Repository Integration
- AI Risk Assessment
- AI Deployment Recommendations
- AI Root Cause Analysis
- Teams / Email Notifications
- CAB Approval Automation
