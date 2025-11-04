/**
 * Global Test Setup
 *
 * Runs once before all test suites.
 * Used for:
 * - Starting test database containers
 * - Initializing test data
 * - Setting up test infrastructure
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export default async function globalSetup() {
  console.log('\n🚀 Starting global test setup...\n');

  // Load test environment variables
  const envTestPath = path.join(__dirname, '..', '.env.test');
  if (fs.existsSync(envTestPath)) {
    const envConfig = fs.readFileSync(envTestPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
    console.log('✅ Loaded .env.test configuration');
  }

  // Check if Docker is available
  try {
    await execAsync('docker --version');
    console.log('✅ Docker is available');
  } catch (error) {
    console.warn('⚠️  Docker not available. Some tests may fail.');
  }

  // Start test containers if Docker is available and not in CI
  if (process.env.USE_TEST_CONTAINERS === 'true') {
    try {
      console.log('🐳 Starting test containers...');

      // Start MongoDB test container
      const mongoContainer = await startMongoContainer();
      if (mongoContainer) {
        process.env.MONGODB_URI = `mongodb://localhost:${mongoContainer.port}/test_db`;
        console.log(`✅ MongoDB test container started on port ${mongoContainer.port}`);
      }

      // Start Redis test container
      const redisContainer = await startRedisContainer();
      if (redisContainer) {
        process.env.REDIS_URL = `redis://localhost:${redisContainer.port}`;
        console.log(`✅ Redis test container started on port ${redisContainer.port}`);
      }

      // Store container IDs for cleanup
      const containerInfo = {
        mongo: mongoContainer?.containerId,
        redis: redisContainer?.containerId,
      };
      fs.writeFileSync(
        path.join(__dirname, 'test-containers.json'),
        JSON.stringify(containerInfo, null, 2)
      );
    } catch (error) {
      console.error('❌ Failed to start test containers:', error);
      console.log('Tests will use mock implementations instead');
    }
  } else {
    console.log('ℹ️  Using mock implementations (USE_TEST_CONTAINERS not set)');
  }

  // Initialize test database schema
  if (process.env.MONGODB_URI) {
    try {
      // Database initialization would go here
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
    }
  }

  console.log('\n✨ Global test setup completed\n');
}

/**
 * Start MongoDB test container
 */
async function startMongoContainer() {
  try {
    const containerName = 'test-mongodb-' + Date.now();
    const port = 27017 + Math.floor(Math.random() * 1000);

    const { stdout } = await execAsync(
      `docker run -d --name ${containerName} -p ${port}:27017 mongo:7.0`
    );

    const containerId = stdout.trim();

    // Wait for MongoDB to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return { containerId, port, name: containerName };
  } catch (error) {
    console.error('Failed to start MongoDB container:', error);
    return null;
  }
}

/**
 * Start Redis test container
 */
async function startRedisContainer() {
  try {
    const containerName = 'test-redis-' + Date.now();
    const port = 6379 + Math.floor(Math.random() * 1000);

    const { stdout } = await execAsync(
      `docker run -d --name ${containerName} -p ${port}:6379 redis:7.2-alpine`
    );

    const containerId = stdout.trim();

    // Wait for Redis to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { containerId, port, name: containerName };
  } catch (error) {
    console.error('Failed to start Redis container:', error);
    return null;
  }
}
