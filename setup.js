#!/usr/bin/env node

/**
 * Next Level Real Estate - Interactive Setup CLI
 *
 * This script helps you configure the platform by:
 * - Creating .env files from templates
 * - Prompting for API keys
 * - Validating configuration
 * - Testing connections
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('═'.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('═'.repeat(60), 'cyan');
  console.log('');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify question
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Generate random secret
function generateSecret(length = 32) {
  return require('crypto').randomBytes(length).toString('base64');
}

// Check if command exists
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Test MongoDB connection
async function testMongoDB(uri) {
  try {
    // Simple check - try to connect
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri);
    await client.connect();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

// Test Redis connection
async function testRedis(url) {
  try {
    const redis = require('redis');
    const client = redis.createClient({ url });
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch {
    return false;
  }
}

// Environment configurations
const envConfigs = [
  {
    name: 'Root Configuration',
    path: '.env',
    template: '.env.example',
  },
  {
    name: 'API Gateway',
    path: 'services/api-gateway/.env',
    template: 'services/api-gateway/.env.example',
  },
  {
    name: 'Lead Service',
    path: 'services/lead-service/.env',
    template: 'services/lead-service/.env.example',
  },
  {
    name: 'Calling Service',
    path: 'services/calling-service/.env',
    template: 'services/calling-service/.env.example',
  },
  {
    name: 'AI Agents',
    path: 'agents/.env',
    template: 'agents/.env.example',
  },
  {
    name: 'Admin Dashboard',
    path: 'admin-dashboard/.env.local',
    template: 'admin-dashboard/.env.local.example',
  },
];

// Main setup flow
async function main() {
  header('Next Level Real Estate - Setup Wizard');

  log('Welcome! This wizard will help you set up the platform.\n', 'bright');
  log('We\'ll configure environment variables, test connections, and prepare your system.\n');

  const mode = await question(
    'Select setup mode:\n' +
    '  1) Quick Start (minimal config, use defaults)\n' +
    '  2) Full Setup (configure all options)\n' +
    '  3) Development Only (local development)\n' +
    '  4) Production Deployment (all production settings)\n' +
    'Enter choice (1-4): '
  );

  console.log('');

  const config = {};

  if (mode === '1') {
    await quickStart(config);
  } else if (mode === '2') {
    await fullSetup(config);
  } else if (mode === '3') {
    await devSetup(config);
  } else if (mode === '4') {
    await prodSetup(config);
  } else {
    error('Invalid choice. Exiting.');
    rl.close();
    process.exit(1);
  }

  // Generate .env files
  await generateEnvFiles(config);

  // Test connections
  if (await question('\nTest database connections? (y/n): ') === 'y') {
    await testConnections(config);
  }

  // Install dependencies
  if (await question('\nInstall dependencies for all services? (y/n): ') === 'y') {
    await installDependencies();
  }

  // Initialize databases
  if (await question('\nInitialize databases (MongoDB, Qdrant)? (y/n): ') === 'y') {
    await initializeDatabases();
  }

  console.log('');
  header('Setup Complete!');

  log('Next steps:', 'bright');
  log('  1. Review the generated .env files');
  log('  2. Start Docker services: docker compose up -d');
  log('  3. Start development servers:');
  log('     - cd services/api-gateway && npm run dev');
  log('     - cd services/lead-service && npm run dev');
  log('     - cd services/calling-service && npm run dev');
  log('  4. Open admin dashboard: cd admin-dashboard && npm run dev');
  console.log('');
  log('For more information, see:', 'dim');
  log('  - README.md - Project overview');
  log('  - ENVIRONMENT_VARIABLES.md - All environment variables');
  log('  - SYSTEM_ARCHITECTURE.md - System architecture');
  console.log('');

  rl.close();
}

// Quick start setup
async function quickStart(config) {
  header('Quick Start Setup');

  info('This will set up the system with minimal configuration.');
  info('You can always reconfigure later.\n');

  // Essential keys only
  config.ANTHROPIC_API_KEY = await question('Enter Anthropic API key (required): ');
  config.OPENAI_API_KEY = await question('Enter OpenAI API key (required): ');

  // Optional
  const useElevenLabs = await question('Do you have ElevenLabs API key? (y/n): ');
  if (useElevenLabs === 'y') {
    config.ELEVENLABS_API_KEY = await question('Enter ElevenLabs API key: ');
  }

  const useTwilio = await question('Do you have Twilio credentials? (y/n): ');
  if (useTwilio === 'y') {
    config.TWILIO_ACCOUNT_SID = await question('Enter Twilio Account SID: ');
    config.TWILIO_AUTH_TOKEN = await question('Enter Twilio Auth Token: ');
    config.TWILIO_PHONE_NUMBER = await question('Enter Twilio Phone Number (+1...): ');
  }

  // Generate secrets
  config.JWT_SECRET = generateSecret(32);
  config.API_KEY_SALT = generateSecret(16);
  config.NEXTAUTH_SECRET = generateSecret(32);

  // Use defaults
  config.MONGODB_URI = 'mongodb://localhost:27017/next_level_real_estate';
  config.REDIS_URL = 'redis://localhost:6379';
  config.QDRANT_URL = 'http://localhost:6333';
  config.KAFKA_BROKERS = 'localhost:9092';
  config.NODE_ENV = 'development';
  config.LOG_LEVEL = 'debug';

  success('Quick start configuration complete!');
}

// Full setup
async function fullSetup(config) {
  header('Full Setup');

  info('We\'ll configure all available options.\n');

  // AI Services
  log('AI Services:', 'bright');
  config.ANTHROPIC_API_KEY = await question('  Anthropic API key (required): ');
  config.OPENAI_API_KEY = await question('  OpenAI API key (required): ');
  config.ELEVENLABS_API_KEY = await question('  ElevenLabs API key (optional): ') || '';
  console.log('');

  // Twilio
  log('Twilio Configuration:', 'bright');
  config.TWILIO_ACCOUNT_SID = await question('  Account SID (optional): ') || '';
  config.TWILIO_AUTH_TOKEN = await question('  Auth Token (optional): ') || '';
  config.TWILIO_PHONE_NUMBER = await question('  Phone Number (optional): ') || '';
  console.log('');

  // Lead Sources
  log('Lead Sources (all optional):', 'bright');
  if (await question('  Configure Google Ads? (y/n): ') === 'y') {
    config.GOOGLE_ADS_CLIENT_ID = await question('    Client ID: ');
    config.GOOGLE_ADS_CLIENT_SECRET = await question('    Client Secret: ');
    config.GOOGLE_ADS_DEVELOPER_TOKEN = await question('    Developer Token: ');
    config.GOOGLE_ADS_REFRESH_TOKEN = await question('    Refresh Token: ');
    config.GOOGLE_ADS_CUSTOMER_ID = await question('    Customer ID: ');
  }

  if (await question('  Configure Zillow? (y/n): ') === 'y') {
    config.ZILLOW_API_KEY = await question('    API Key: ');
    config.ZILLOW_WEBHOOK_SECRET = await question('    Webhook Secret: ');
  }

  if (await question('  Configure RealGeeks? (y/n): ') === 'y') {
    config.REALGEEKS_API_USERNAME = await question('    Username: ');
    config.REALGEEKS_API_PASSWORD = await question('    Password: ');
  }
  console.log('');

  // Infrastructure
  log('Infrastructure:', 'bright');
  const useLocal = await question('  Use local infrastructure (Docker)? (y/n): ') === 'y';

  if (useLocal) {
    config.MONGODB_URI = 'mongodb://localhost:27017/next_level_real_estate';
    config.REDIS_URL = 'redis://localhost:6379';
    config.QDRANT_URL = 'http://localhost:6333';
    config.KAFKA_BROKERS = 'localhost:9092';
  } else {
    config.MONGODB_URI = await question('  MongoDB URI: ');
    config.REDIS_URL = await question('  Redis URL: ');
    config.QDRANT_URL = await question('  Qdrant URL: ');
    config.KAFKA_BROKERS = await question('  Kafka Brokers: ');
  }
  console.log('');

  // Security
  log('Security:', 'bright');
  const generateSecrets = await question('  Generate secrets automatically? (y/n): ') === 'y';

  if (generateSecrets) {
    config.JWT_SECRET = generateSecret(32);
    config.API_KEY_SALT = generateSecret(16);
    config.NEXTAUTH_SECRET = generateSecret(32);
    success('  Secrets generated!');
  } else {
    config.JWT_SECRET = await question('  JWT Secret: ');
    config.API_KEY_SALT = await question('  API Key Salt: ');
    config.NEXTAUTH_SECRET = await question('  NextAuth Secret: ');
  }
  console.log('');

  // Environment
  config.NODE_ENV = await question('Environment (development/staging/production): ') || 'development';
  config.LOG_LEVEL = await question('Log level (debug/info/warn/error): ') || 'debug';

  success('Full configuration complete!');
}

// Development setup
async function devSetup(config) {
  header('Development Setup');

  info('Setting up for local development...\n');

  // Just the essentials
  config.ANTHROPIC_API_KEY = await question('Anthropic API key: ');
  config.OPENAI_API_KEY = await question('OpenAI API key: ');

  // Generate secrets
  config.JWT_SECRET = generateSecret(32);
  config.API_KEY_SALT = generateSecret(16);
  config.NEXTAUTH_SECRET = generateSecret(32);

  // Development defaults
  config.MONGODB_URI = 'mongodb://localhost:27017/next_level_real_estate';
  config.REDIS_URL = 'redis://localhost:6379';
  config.QDRANT_URL = 'http://localhost:6333';
  config.KAFKA_BROKERS = 'localhost:9092';
  config.NODE_ENV = 'development';
  config.LOG_LEVEL = 'debug';

  // Optional testing APIs
  const useTestAPIs = await question('\nAdd test API keys for Twilio/ElevenLabs? (y/n): ');
  if (useTestAPIs === 'y') {
    config.ELEVENLABS_API_KEY = await question('ElevenLabs API key: ') || '';
    config.TWILIO_ACCOUNT_SID = await question('Twilio Account SID: ') || '';
    config.TWILIO_AUTH_TOKEN = await question('Twilio Auth Token: ') || '';
    config.TWILIO_PHONE_NUMBER = await question('Twilio Phone Number: ') || '';
  }

  success('Development setup complete!');
}

// Production setup
async function prodSetup(config) {
  header('Production Deployment Setup');

  warning('Production setup requires all services and API keys.\n');

  // All required services
  log('AI Services (required):', 'bright');
  config.ANTHROPIC_API_KEY = await question('  Anthropic API key: ');
  config.OPENAI_API_KEY = await question('  OpenAI API key: ');
  config.ELEVENLABS_API_KEY = await question('  ElevenLabs API key: ');
  console.log('');

  log('Twilio (required for calling):', 'bright');
  config.TWILIO_ACCOUNT_SID = await question('  Account SID: ');
  config.TWILIO_AUTH_TOKEN = await question('  Auth Token: ');
  config.TWILIO_PHONE_NUMBER = await question('  Phone Number: ');
  console.log('');

  log('Production Infrastructure:', 'bright');
  config.MONGODB_URI = await question('  MongoDB URI (Atlas): ');
  config.REDIS_URL = await question('  Redis URL (ElastiCache): ');
  config.QDRANT_URL = await question('  Qdrant URL (Cloud): ');
  config.KAFKA_BROKERS = await question('  Kafka Brokers (MSK): ');
  console.log('');

  // Security
  log('Security (auto-generating):', 'bright');
  config.JWT_SECRET = generateSecret(32);
  config.API_KEY_SALT = generateSecret(16);
  config.NEXTAUTH_SECRET = generateSecret(32);
  success('  Secrets generated!');
  console.log('');

  // Production settings
  config.NODE_ENV = 'production';
  config.LOG_LEVEL = 'warn';

  success('Production configuration complete!');
}

// Generate .env files
async function generateEnvFiles(config) {
  header('Generating Environment Files');

  for (const envConfig of envConfigs) {
    const templatePath = path.join(__dirname, envConfig.template);
    const targetPath = path.join(__dirname, envConfig.path);

    if (!fs.existsSync(templatePath)) {
      warning(`Template not found: ${envConfig.template}`);
      continue;
    }

    // Read template
    let content = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    for (const [key, value] of Object.entries(config)) {
      if (value) {
        // Replace placeholder values
        content = content.replace(
          new RegExp(`${key}=.*`, 'g'),
          `${key}=${value}`
        );
      }
    }

    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(targetPath, content);
    success(`Created: ${envConfig.path}`);
  }

  console.log('');
}

// Test connections
async function testConnections(config) {
  header('Testing Connections');

  // MongoDB
  try {
    info('Testing MongoDB connection...');
    const connected = await testMongoDB(config.MONGODB_URI || 'mongodb://localhost:27017/next_level_real_estate');
    if (connected) {
      success('MongoDB connection successful!');
    } else {
      error('MongoDB connection failed!');
    }
  } catch (err) {
    error(`MongoDB test error: ${err.message}`);
  }

  // Redis
  try {
    info('Testing Redis connection...');
    const connected = await testRedis(config.REDIS_URL || 'redis://localhost:6379');
    if (connected) {
      success('Redis connection successful!');
    } else {
      error('Redis connection failed!');
    }
  } catch (err) {
    error(`Redis test error: ${err.message}`);
  }

  console.log('');
}

// Install dependencies
async function installDependencies() {
  header('Installing Dependencies');

  const services = [
    'services/api-gateway',
    'services/lead-service',
    'services/calling-service',
    'agents/shared',
    'agents/architect',
    'agents/conversation',
    'agents/sales',
    'agents/realty',
    'admin-dashboard',
  ];

  for (const service of services) {
    const servicePath = path.join(__dirname, service);
    if (fs.existsSync(path.join(servicePath, 'package.json'))) {
      info(`Installing: ${service}...`);
      try {
        execSync('npm install', { cwd: servicePath, stdio: 'inherit' });
        success(`Installed: ${service}`);
      } catch (err) {
        error(`Failed to install: ${service}`);
      }
    }
  }

  console.log('');
}

// Initialize databases
async function initializeDatabases() {
  header('Initializing Databases');

  try {
    info('Initializing MongoDB collections and indexes...');
    execSync('node scripts/mongo-init.js', { stdio: 'inherit' });
    success('MongoDB initialized!');
  } catch (err) {
    error('MongoDB initialization failed!');
  }

  try {
    info('Initializing Qdrant vector collections...');
    execSync('npx ts-node scripts/qdrant-init.ts', { stdio: 'inherit' });
    success('Qdrant initialized!');
  } catch (err) {
    error('Qdrant initialization failed!');
  }

  console.log('');
}

// Run main
main().catch((err) => {
  error(`Setup failed: ${err.message}`);
  rl.close();
  process.exit(1);
});
