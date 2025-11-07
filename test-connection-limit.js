#!/usr/bin/env node

/**
 * Test Connection Limit Enforcement
 * Simulates multiple concurrent calls to test the 10-connection limit
 */

require('dotenv').config();
const http = require('http');

const NGROK_URL = 'https://landlordly-uriah-scorchingly.ngrok-free.dev';
const WEBHOOK_URL = `${NGROK_URL}/voice/incoming`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(color, msg) {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function testConnectionLimit() {
  log('cyan', '\n╔═══════════════════════════════════════════════════╗');
  log('cyan', '║   Testing Connection Limit (Max: 10)             ║');
  log('cyan', '╚═══════════════════════════════════════════════════╝\n');

  const testCalls = [];
  const results = [];

  log('blue', '📊 Sending 15 concurrent webhook requests...\n');

  for (let i = 1; i <= 15; i++) {
    const callData = new URLSearchParams({
      CallSid: `CA_TEST_${i.toString().padStart(2, '0')}`,
      From: '+12147305642',
      To: '+19723363907',
      CallStatus: 'initiated'
    });

    const promise = new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/voice/incoming',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': callData.toString().length
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const isRejected = data.includes('maximum capacity') || data.includes('Hangup');
          results.push({
            callNum: i,
            status: isRejected ? '❌ REJECTED' : '✅ ACCEPTED',
            capacity: res.headers['x-capacity'] || 'N/A'
          });
          resolve();
        });
      });

      req.on('error', (error) => {
        results.push({
          callNum: i,
          status: '❌ ERROR',
          error: error.message
        });
        resolve();
      });

      req.write(callData.toString());
      req.end();
    });

    testCalls.push(promise);
  }

  // Wait for all requests
  await Promise.all(testCalls);

  // Sort by call number and display results
  log('yellow', '\n📋 Test Results:\n');
  results.sort((a, b) => a.callNum - b.callNum).forEach(result => {
    const icon = result.status.includes('ACCEPTED') ? '✅' : '❌';
    console.log(`   Call ${result.callNum.toString().padStart(2)} : ${result.status}`);
  });

  // Summary
  const accepted = results.filter(r => r.status.includes('ACCEPTED')).length;
  const rejected = results.filter(r => r.status.includes('REJECTED')).length;

  log('cyan', '\n╔═══════════════════════════════════════════════════╗');
  log('cyan', '║                    SUMMARY                        ║');
  log('cyan', '╚═══════════════════════════════════════════════════╝');
  console.log(`\n   Total Requests: 15`);
  log('green', `   ✅ Accepted: ${accepted}`);
  log('red', `   ❌ Rejected: ${rejected}`);
  console.log(`\n   Expected: ~10 accepted, ~5 rejected`);

  if (accepted <= 10 && rejected >= 4) {
    log('green', '\n✅ Connection limit enforcement is working correctly!\n');
  } else {
    log('yellow', '\n⚠️  Connection limit test result differs from expected\n');
  }

  // Check capacity via health endpoint
  log('blue', '\n📊 Current capacity via health endpoint:');
  await new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log(`   Active Connections: ${health.activeConnections}/${health.maxConnections}`);
          console.log(`   Capacity: ${health.capacityPercent}%`);
        } catch (e) {
          console.log('   (Could not parse health response)');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   Error: ${error.message}`);
      resolve();
    });

    req.end();
  });

  console.log('');
}

testConnectionLimit().catch(console.error);
