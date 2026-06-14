const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Developer Info
const DEVELOPER_INFO = {
  developer: "TNEH GROUP BD",
  telegram: "@tneh_owner",
  website: "https://tnehchatbot.onrender.com",
  api_version: "1.0.0",
  purpose: "Ethical Hacking & Cybersecurity Education"
};

// API Keys storage
const validKeys = new Map();

// Generate API Key
function generateApiKey() {
  return 'TNEH-HACK-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Check if key is valid
function isKeyValid(key) {
  if (!validKeys.has(key)) return false;
  const expiryDate = validKeys.get(key);
  return new Date() < expiryDate;
}

// AI Chat function
async function getAIResponse(question) {
  try {
    const response = await axios.get(`https://dark-ai.lmnx9.workers.dev?sukhi=${encodeURIComponent(question)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    return {
      success: true,
      response: response.data
    };
  } catch (error) {
    console.error('AI API Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============= CORRECTED ENDPOINTS =============

// 1. Create API Key
app.get('/api/createkey', (req, res) => {
  const apiKey = generateApiKey();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  
  validKeys.set(apiKey, expiryDate);
  
  res.json({
    success: true,
    api_key: apiKey,
    expiry_date: expiryDate.toISOString(),
    valid_days: 365,
    developer: DEVELOPER_INFO,
    message: "API key generated successfully. Valid for 1 year."
  });
});

// 2. Chat with AI (Fixed endpoint)
app.get('/api/key', async (req, res) => {
  const { key, asking } = req.query;
  
  console.log('Request received:', { key: key ? key.substring(0, 20) + '...' : null, asking });
  
  if (!key || !asking) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters. Use: /api/key?key=YOUR_KEY&asking=YOUR_QUESTION',
      developer: DEVELOPER_INFO
    });
  }
  
  if (!isKeyValid(key)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired API key',
      developer: DEVELOPER_INFO
    });
  }
  
  const result = await getAIResponse(asking);
  
  res.json({
    success: result.success,
    developer: DEVELOPER_INFO,
    question: asking,
    answer: result.success ? result.response : null,
    error: result.success ? null : result.error,
    timestamp: new Date().toISOString()
  });
});

// 3. Check API Key (Fixed endpoint)
app.get('/api/check', (req, res) => {
  const { key } = req.query;
  
  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'Missing API key parameter. Use: /api/check?key=YOUR_KEY',
      developer: DEVELOPER_INFO
    });
  }
  
  const isValid = isKeyValid(key);
  const expiryDate = validKeys.get(key);
  
  res.json({
    success: true,
    valid: isValid,
    api_key: key,
    expiry_date: expiryDate ? expiryDate.toISOString() : null,
    status: isValid ? 'active' : 'invalid or expired',
    developer: DEVELOPER_INFO
  });
});

// 4. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'active',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    developer: DEVELOPER_INFO,
    endpoints: {
      create_key: '/api/createkey',
      chat: '/api/key?key=YOUR_KEY&asking=YOUR_QUESTION',
      check_key: '/api/check?key=YOUR_KEY',
      health: '/api/health'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    developer: DEVELOPER_INFO,
    available_endpoints: {
      create_key: 'GET /api/createkey',
      chat: 'GET /api/key?key=YOUR_KEY&asking=YOUR_QUESTION',
      check_key: 'GET /api/check?key=YOUR_KEY',
      health: 'GET /api/health'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    developer: DEVELOPER_INFO
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TNEH Ethical Hacker AI Chatbot running on port ${PORT}`);
  console.log(`🌐 Website URL: https://tnehchatbot.onrender.com`);
  console.log(`📡 API URL: https://tnehchatbot.onrender.com/api/health`);
  console.log(`\n📌 Correct API Usage:`);
  console.log(`   Generate Key: GET /api/createkey`);
  console.log(`   Chat: GET /api/key?key=YOUR_KEY&asking=YOUR_QUESTION`);
  console.log(`   Check Key: GET /api/check?key=YOUR_KEY`);
});
