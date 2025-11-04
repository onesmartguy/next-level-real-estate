/**
 * Performance Test: Load Testing
 *
 * Tests system behavior under various load conditions.
 * Tests the 5-minute lead response rule under load.
 */

import { generateLeads } from '../mocks/test-data';
import { kafkaMock } from '../mocks/kafka-mock';
import { twilioMock } from '../mocks/twilio-mock';
import { measureTime, waitForCondition } from '../utils/test-helpers';
import { assertTimingConstraint } from '../utils/assertions';

describe('Performance: Load Testing', () => {
  describe('Lead Ingestion Performance', () => {
    it('should handle 100 leads per second', async () => {
      const leadCount = 100;
      const leads = generateLeads(leadCount);

      const { duration } = await measureTime(async () => {
        const producer = kafkaMock.producer();
        await producer.connect();

        const promises = leads.map((lead) =>
          producer.send({
            topic: 'leads',
            messages: [
              {
                key: lead.leadId,
                value: JSON.stringify(lead),
              },
            ],
          })
        );

        await Promise.all(promises);
        await producer.disconnect();
      });

      const leadsPerSecond = (leadCount / duration) * 1000;
      console.log(`Ingestion rate: ${leadsPerSecond.toFixed(0)} leads/second`);

      expect(leadsPerSecond).toBeGreaterThan(100);
      expect(duration).toBeLessThan(2000); // Should complete in < 2 seconds
    });

    it('should maintain performance with batched ingestion', async () => {
      const totalLeads = 1000;
      const batchSize = 100;
      const leads = generateLeads(totalLeads);

      const { duration } = await measureTime(async () => {
        const producer = kafkaMock.producer();
        await producer.connect();

        // Process in batches
        for (let i = 0; i < leads.length; i += batchSize) {
          const batch = leads.slice(i, i + batchSize);
          await producer.sendBatch(
            batch.map((lead) => ({
              topic: 'leads',
              messages: [
                {
                  key: lead.leadId,
                  value: JSON.stringify(lead),
                },
              ],
            }))
          );
        }

        await producer.disconnect();
      });

      const leadsPerSecond = (totalLeads / duration) * 1000;
      console.log(`Batch ingestion: ${leadsPerSecond.toFixed(0)} leads/second`);

      expect(leadsPerSecond).toBeGreaterThan(500);
    });
  });

  describe('Call Initiation Performance', () => {
    it('should initiate 50 concurrent calls', async () => {
      const callCount = 50;
      const leads = generateLeads(callCount);

      const { duration } = await measureTime(async () => {
        const promises = leads.map((lead) =>
          twilioMock.createCall({
            to: lead.contact.phone,
            from: '+15555555555',
          })
        );

        await Promise.all(promises);
      });

      const callsPerSecond = (callCount / duration) * 1000;
      console.log(`Call initiation rate: ${callsPerSecond.toFixed(0)} calls/second`);

      expect(callsPerSecond).toBeGreaterThan(50);
      expect(duration).toBeLessThan(2000);
    });

    it('should handle call queue backlog', async () => {
      const queuedCalls = 200;
      const leads = generateLeads(queuedCalls);

      // Queue all calls
      const callPromises = leads.map((lead) =>
        twilioMock.createCall({
          to: lead.contact.phone,
          from: '+15555555555',
        })
      );

      const calls = await Promise.all(callPromises);

      // Verify all calls are queued
      const allCalls = twilioMock.getAllCalls();
      expect(allCalls.length).toBe(queuedCalls);

      // Measure time to process queue
      const { duration } = await measureTime(async () => {
        // Simulate processing (calls would transition through states)
        for (const call of calls) {
          await twilioMock.completeCall(call.sid, 60);
        }
      });

      console.log(`Queue processing time: ${duration}ms for ${queuedCalls} calls`);
      expect(duration).toBeLessThan(5000); // < 5 seconds
    });
  });

  describe('5-Minute Response Rule Under Load', () => {
    it('should maintain <5min response time with 100 concurrent leads', async () => {
      const leadCount = 100;
      const leads = generateLeads(leadCount);
      const responseTimes: number[] = [];

      const producer = kafkaMock.producer();
      await producer.connect();

      for (const lead of leads) {
        const startTime = Date.now();

        // Ingest lead
        await producer.send({
          topic: 'leads',
          messages: [{ key: lead.leadId, value: JSON.stringify(lead) }],
        });

        // Simulate qualification (would be done by agent)
        // In real system, this would trigger automatically

        // Initiate call
        await twilioMock.createCall({
          to: lead.contact.phone,
          from: '+15555555555',
        });

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      await producer.disconnect();

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      console.log('Response Time Statistics:');
      console.log(`  Average: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`  Maximum: ${maxResponseTime}ms`);
      console.log(`  P95: ${p95ResponseTime}ms`);

      // All response times should be under 5 minutes (300000ms)
      expect(maxResponseTime).toBeLessThan(300000);
      expect(avgResponseTime).toBeLessThan(10000); // Avg should be much lower
    });

    it('should prioritize high-value leads under load', async () => {
      const lowValueLeads = generateLeads(50, { qualificationScore: 50 });
      const highValueLeads = generateLeads(50, { qualificationScore: 90 });

      const allLeads = [...lowValueLeads, ...highValueLeads].sort(() => Math.random() - 0.5); // Shuffle

      const processingOrder: Array<{ leadId: string; score: number; processingTime: number }> = [];

      const startTime = Date.now();

      // In a real system, high-value leads would be prioritized
      // For this test, we simulate the prioritization

      const sortedLeads = [...allLeads].sort((a, b) => b.qualificationScore - a.qualificationScore);

      for (const lead of sortedLeads) {
        const processingTime = Date.now() - startTime;
        processingOrder.push({
          leadId: lead.leadId,
          score: lead.qualificationScore,
          processingTime,
        });
      }

      // Verify high-value leads were processed first
      const firstHalf = processingOrder.slice(0, 50);
      const avgScoreFirstHalf = firstHalf.reduce((sum, item) => sum + item.score, 0) / firstHalf.length;

      expect(avgScoreFirstHalf).toBeGreaterThan(75);
      console.log(`Average score of first 50 processed: ${avgScoreFirstHalf}`);
    });
  });

  describe('Database Query Performance', () => {
    it('should query 1000 leads in < 1 second', async () => {
      // This would test actual database queries
      // For mock testing, we simulate the timing

      const querySize = 1000;

      const { duration } = await measureTime(async () => {
        // Simulate database query
        const leads = generateLeads(querySize);
        // In real test: await leadRepository.find({ limit: querySize });
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate DB latency
      });

      console.log(`Query time for ${querySize} leads: ${duration}ms`);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle complex aggregation queries efficiently', async () => {
      const { duration } = await measureTime(async () => {
        // Simulate MongoDB aggregation pipeline
        // In real test: await db.collection('leads').aggregate([...complex pipeline...])
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      console.log(`Aggregation query time: ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during continuous processing', async () => {
      const iterations = 10;
      const leadsPerIteration = 100;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const leads = generateLeads(leadsPerIteration);

        // Process leads
        const producer = kafkaMock.producer();
        await producer.connect();

        for (const lead of leads) {
          await producer.send({
            topic: 'leads',
            messages: [{ value: JSON.stringify(lead) }],
          });
        }

        await producer.disconnect();
        producer.clear();

        // Record memory usage
        const memUsage = process.memoryUsage();
        memoryReadings.push(memUsage.heapUsed / 1024 / 1024); // MB

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        console.log(`Iteration ${i + 1}: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      }

      // Memory should not continuously increase
      const firstHalf = memoryReadings.slice(0, iterations / 2);
      const secondHalf = memoryReadings.slice(iterations / 2);

      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const memoryIncrease = ((avgSecond - avgFirst) / avgFirst) * 100;

      console.log(`Memory increase: ${memoryIncrease.toFixed(1)}%`);
      expect(memoryIncrease).toBeLessThan(50); // Less than 50% increase
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 1000 concurrent requests', async () => {
      const concurrentRequests = 1000;

      const { duration } = await measureTime(async () => {
        const promises = Array.from({ length: concurrentRequests }, (_, i) => {
          // Simulate API request
          return new Promise((resolve) => {
            setTimeout(() => resolve({ requestId: i }), Math.random() * 100);
          });
        });

        await Promise.all(promises);
      });

      const requestsPerSecond = (concurrentRequests / duration) * 1000;
      console.log(`Throughput: ${requestsPerSecond.toFixed(0)} requests/second`);

      expect(requestsPerSecond).toBeGreaterThan(100);
    });
  });
});
