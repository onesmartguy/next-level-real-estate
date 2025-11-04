/**
 * Global Test Teardown
 *
 * Runs once after all test suites complete.
 * Used for:
 * - Stopping test containers
 * - Cleaning up test data
 * - Releasing resources
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export default async function globalTeardown() {
  console.log('\n🧹 Starting global test teardown...\n');

  // Stop and remove test containers
  const containerInfoPath = path.join(__dirname, 'test-containers.json');
  if (fs.existsSync(containerInfoPath)) {
    try {
      const containerInfo = JSON.parse(fs.readFileSync(containerInfoPath, 'utf-8'));

      // Stop MongoDB container
      if (containerInfo.mongo) {
        await stopContainer(containerInfo.mongo);
        console.log('✅ MongoDB test container stopped');
      }

      // Stop Redis container
      if (containerInfo.redis) {
        await stopContainer(containerInfo.redis);
        console.log('✅ Redis test container stopped');
      }

      // Remove container info file
      fs.unlinkSync(containerInfoPath);
    } catch (error) {
      console.error('❌ Failed to stop test containers:', error);
    }
  }

  // Clean up any temporary test files
  const tempTestDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempTestDir)) {
    try {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
      console.log('✅ Temporary test files cleaned up');
    } catch (error) {
      console.error('❌ Failed to clean up temp files:', error);
    }
  }

  console.log('\n✨ Global test teardown completed\n');
}

/**
 * Stop and remove a Docker container
 */
async function stopContainer(containerId: string) {
  try {
    await execAsync(`docker stop ${containerId}`);
    await execAsync(`docker rm ${containerId}`);
  } catch (error) {
    console.error(`Failed to stop container ${containerId}:`, error);
  }
}
