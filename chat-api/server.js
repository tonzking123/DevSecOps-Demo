const express = require('express');
const path = require('path');
const { AzureOpenAI } = require('openai');
const { DefaultAzureCredential, getBearerTokenProvider } = require('@azure/identity');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Azure OpenAI config — using workload identity (managed identity)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://aoai-cnapp-lab.openai.azure.com/';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

// BAD: Hardcoded fallback API key — MDC AISPM and secret scanning will flag this
const AZURE_OPENAI_API_KEY_FALLBACK = 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

// BAD: Hardcoded database credentials (for SAST demo)
const DB_CONNECTION = 'Server=sql-cnapp-bad.database.windows.net;Database=appdb;User=adminuser;Password=P@ssw0rd123!';

let openaiClient;

async function getOpenAIClient() {
  if (openaiClient) return openaiClient;

  try {
    // Primary: use workload identity (managed identity)
    const credential = new DefaultAzureCredential();
    const scope = 'https://cognitiveservices.azure.com/.default';
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);

    openaiClient = new AzureOpenAI({
      azureADTokenProvider,
      endpoint: AZURE_OPENAI_ENDPOINT,
      deployment: AZURE_OPENAI_DEPLOYMENT,
      apiVersion: AZURE_OPENAI_API_VERSION,
    });

    console.log('Using workload identity for Azure OpenAI');
    return openaiClient;
  } catch (err) {
    console.warn('Workload identity failed, falling back to API key:', err.message);
    // BAD: fallback to hardcoded key
    openaiClient = new AzureOpenAI({
      apiKey: AZURE_OPENAI_API_KEY_FALLBACK,
      endpoint: AZURE_OPENAI_ENDPOINT,
      deployment: AZURE_OPENAI_DEPLOYMENT,
      apiVersion: AZURE_OPENAI_API_VERSION,
    });
    return openaiClient;
  }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const client = await getOpenAIClient();
    const response = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: 'You are a helpful assistant for a CNAPP security demo. Keep answers concise.' },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    res.json({
      reply: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
    });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ error: 'AI service error: ' + err.message });
  }
});

// BAD: SQL injection pattern — user input directly in query string (SAST demo)
app.get('/api/users', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  console.log('Query:', query);
  res.json({ query: query, note: 'SQL injection demo — not connected to real DB' });
});

// BAD: Command injection (SAST demo)
app.get('/api/ping', (req, res) => {
  const host = req.query.host;
  const { exec } = require('child_process');
  exec('ping -c 1 ' + host, (err, stdout) => {
    res.send(stdout || err?.message || 'error');
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    endpoint: AZURE_OPENAI_ENDPOINT,
    deployment: AZURE_OPENAI_DEPLOYMENT,
    auth: 'workload-identity',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chat API running on port ${PORT}`);
  console.log(`Azure OpenAI endpoint: ${AZURE_OPENAI_ENDPOINT}`);
});
