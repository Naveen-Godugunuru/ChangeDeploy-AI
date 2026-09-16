# OpenAI Integration Guide

## Natural Language Deployment Command Parsing

The ChangeDeploy AI system now includes AI-powered natural language parsing to extract deployment information from user commands.

### Features

- **Natural Language Input**: Users can type deployment commands in plain English
- **AI Extraction**: OpenAI's GPT-4o-mini model extracts:
  - `application`: The service/application name
  - `version`: The version to deploy
  - `environment`: The target environment (QA, Staging, Production, etc.)
- **Automatic Change Creation**: Parsed data automatically creates a change request
- **Fallback Parsing**: If OpenAI is unavailable, uses regex-based local parsing
- **Audit Trail**: All parsed commands are logged for compliance

### Setup

#### 1. Get an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key

#### 2. Configure Backend

1. Navigate to `apps/backend/`
2. Create or edit `.env` file:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

3. Or set environment variable:

```bash
export OPENAI_API_KEY=sk-your-actual-key-here
```

#### 3. Install Dependencies

```bash
cd ChangeDeploy-AI
npm install
```

The `openai` package (v4.41.0) is already in `package.json`.

### Usage

#### Via Frontend

1. Navigate to **Create Deployment** page
2. Enter a command in the text area:
   - Example: `Deploy inventory-api 1.2.0 to QA`
   - Example: `Deploy payment-service 2.3.1 to Staging`
   - Example: `Deploy frontend 3.0.0 to Production`
3. Click **Parse & Create Deployment**
4. System extracts fields and creates a change request
5. Change appears in **Approval Center** for review

#### Via API

**Endpoint**: `POST /api/parse-deployment-command`

**Request**:
```json
{
  "command": "Deploy inventory-api 1.2.0 to QA",
  "user": "john.doe@company.com"
}
```

**Response** (Success):
```json
{
  "success": true,
  "parseSource": "openai",
  "parsed": {
    "application": "inventory-api",
    "version": "1.2.0",
    "environment": "QA"
  },
  "changeRequest": {
    "id": "CR-1234567890",
    "title": "Deploy inventory-api v1.2.0 to QA",
    "status": "Pending Approval",
    "created_at": "2026-09-14T10:30:00Z"
  }
}
```

**Response** (Error):
```json
{
  "error": "Could not extract all required fields from command"
}
```

### Supported Formats

The system accepts flexible natural language formats:

- `Deploy <app> <version> to <environment>`
- `Deploy <app> version <version> to <environment>`
- `<environment> deployment of <app> v<version>`
- And many other variations

### Fallback Behavior

If OpenAI API is unavailable or encounters an error:

1. System automatically falls back to regex-based local parsing
2. Pattern: `/deploy\s+([a-z0-9\-]+)/i` for application name
3. Pattern: `/(\d+\.\d+\.\d+|\d+\.\d+)/` for version
4. Pattern: `/to\s+([a-z]+)/i` for environment
5. `parseSource` field will be `"local"` instead of `"openai"`

### Automatic Risk Assessment

When a deployment request is created:

- **Production deployments** → Risk Score: 70, Severity: High
- **Non-production deployments** → Risk Score: 45, Severity: Medium

### Audit Logging

All parsed commands are logged with:
- User who initiated the parse
- Original command text
- Extracted fields
- Parsing source (OpenAI or local)
- Timestamp

Access audit logs in the **Audit Trail** dashboard.

### Cost Considerations

- Uses OpenAI's `gpt-4o-mini` model (most cost-effective)
- Typical cost: ~$0.001-0.003 per command parse
- No usage limits set by default
- Monitor usage in OpenAI dashboard

### Troubleshooting

#### "No OpenAI API key found"

- Check `.env` file in `apps/backend/`
- Verify `OPENAI_API_KEY` is set correctly
- Restart backend server after setting key
- System will fall back to local parsing automatically

#### "Could not extract all required fields"

- Command is ambiguous or missing required info
- Try more explicit format: `Deploy <app> <version> to <environment>`
- Examples:
  - ✓ Good: "Deploy inventory-api 1.2.0 to QA"
  - ✓ Good: "Deploy payment-service v2.3.1 to Production"
  - ✗ Bad: "Deploy the new version" (missing app and version)
  - ✗ Bad: "inventory-api to QA" (missing version)

#### Slow Response Times

- First request takes longer (API initialization)
- Subsequent requests are faster
- Check internet connection
- Verify API key is valid and has available credits

### Model Selection

Current model: **gpt-4o-mini**

- Optimized for speed and cost
- Excellent at structured data extraction
- Fallback to local parsing if API fails

To change model, edit `apps/backend/modules/nlpParser.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo', // Change this line
  // ... rest of config
});
```

Available options:
- `gpt-4o-mini` - Fast, cost-effective (recommended)
- `gpt-4-turbo` - More capable, higher cost
- `gpt-3.5-turbo` - Legacy, older model

### Security Notes

- Never commit `.env` file with real API keys
- Use `.env.example` for template
- Rotate API keys periodically
- Monitor API usage for unusual activity
- All commands are logged for audit purposes
