const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const builds = require('./buildRepository');

const parseDeploymentCommand = async (userInput, callback) => {
  // Fallback to regex-based parsing if no OpenAI key
  console.log('Using local parser');
const localResult = parseDeploymentCommandLocal(userInput);
callback(null, localResult);
return;

  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a deployment command parser. Extract deployment information from the user's natural language command.

User input: "${userInput}"

Extract and return a JSON object with exactly these fields:
- application: The application/service name
- version: The version to deploy
- environment: The target environment (e.g., Dev, Staging, Production)

If any field cannot be determined, set it to null.
Return ONLY valid JSON, no additional text.

Example:
Input: "Deploy inventory-api 1.2.0 to Dev"
Output: {"application":"inventory-api","version":"1.2.0","environment":"Dev"}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON parser. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let parsed;

    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse OpenAI response:', responseText);
      parsed = parseDeploymentCommandLocal(userInput);
    }

    // Validate parsed result
    if (parsed.application && parsed.version && parsed.environment) {
      callback(null, {
        success: true,
        data: {
          application: parsed.application,
          version: parsed.version,
          environment: parsed.environment,
        },
        source: 'openai',
      });
    } else {
      callback(new Error('Could not extract all required fields from command'), null);
    }
  } catch (error) {
    console.error('OpenAI parsing error:', error.message);
    // Fallback to local parsing
    const localResult = parseDeploymentCommandLocal(userInput);
    callback(null, localResult);
  }
};

const parseDeploymentCommandLocal = (userInput) => {
  // Regex patterns for extraction
  const appMatch = userInput.match(/deploy\s+([a-z0-9\-]+)/i);
  const versionMatch = userInput.match(/(\d+\.\d+\.\d+|\d+\.\d+)/);
  const envMatch = userInput.match(/to\s+([a-z]+)/i) || userInput.match(/(qa|staging|production|dev|development|test)/i);

  const application = appMatch ? appMatch[1].trim() : null;
  const version = versionMatch ? versionMatch[1].trim() : null;
  const environment = envMatch ? envMatch[1].trim() : null;

  if (application && version && environment) {

    const appBuilds = builds[application];
  
    if (
      !appBuilds ||
      !appBuilds.includes(version)
    ) {
      return {
        success: false,
        data: null,
        error: `Build version ${version} not found for ${application}`,
        source: 'local',
      };
    }
  
    return {
      success: true,
      data: {
        application,
        version,
        environment,
      },
      source: 'local',
    };
  }else {
    return {
      success: false,
      data: null,
      error: 'Could not parse deployment command. Please use format: "Deploy <app> <version> to <environment>"',
      source: 'local',
    };
  }
};

module.exports = {
  parseDeploymentCommand,
};
