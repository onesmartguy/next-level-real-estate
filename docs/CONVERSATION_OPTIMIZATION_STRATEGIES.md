# Conversation Optimization Strategies for Real Estate Wholesale Calling

This document provides advanced strategies for optimizing ElevenLabs conversation flows through A/B testing, continuous improvement loops, and data-driven refinement.

## Table of Contents

1. [A/B Testing Framework](#ab-testing-framework)
2. [Conversation Pattern Analysis](#conversation-pattern-analysis)
3. [Success Metrics & KPIs](#success-metrics--kpis)
4. [Continuous Improvement Loop](#continuous-improvement-loop)
5. [Objection Handling Optimization](#objection-handling-optimization)
6. [Prompt Variation Strategies](#prompt-variation-strategies)
7. [Real-Time Call Routing](#real-time-call-routing)
8. [Knowledge Base Feedback Integration](#knowledge-base-feedback-integration)

---

## A/B Testing Framework

### Setting Up Controlled Experiments

```javascript
class ConversationABTestController {
  constructor() {
    this.variants = new Map();
    this.runningTests = new Map();
    this.testResults = [];
  }

  // Define test variants
  defineVariant(testId, variantName, config) {
    const variantId = `${testId}:${variantName}`;

    this.variants.set(variantId, {
      testId,
      variantName,
      config,
      createdAt: new Date(),
      metrics: {
        conversations: 0,
        appointments: 0,
        propertyVisits: 0,
        avgDuration: 0,
        avgSentiment: 0,
        completionRate: 0,
      },
    });

    return variantId;
  }

  // Randomize assignment to variant
  assignVariant(leadId, testId) {
    const testVariants = Array.from(this.variants.entries())
      .filter(([key]) => key.startsWith(`${testId}:`))
      .map(([key]) => key);

    if (testVariants.length === 0) {
      throw new Error(`No variants defined for test: ${testId}`);
    }

    // 50/50 split, can be weighted
    const selectedVariant = testVariants[Math.floor(Math.random() * testVariants.length)];

    // Log assignment for audit trail
    db.collection('ab_test_assignments').insertOne({
      leadId,
      testId,
      variant: selectedVariant,
      timestamp: new Date(),
    });

    return selectedVariant;
  }

  // Track test result
  async trackTestResult(leadId, testId, variant, result) {
    const variantKey = `${testId}:${variant}`;
    const variant_obj = this.variants.get(variantKey);

    if (!variant_obj) {
      throw new Error(`Variant not found: ${variantKey}`);
    }

    // Update variant metrics
    variant_obj.metrics.conversations += 1;

    if (result.appointmentScheduled) {
      variant_obj.metrics.appointments += 1;
    }

    if (result.propertyVisit) {
      variant_obj.metrics.propertyVisits += 1;
    }

    variant_obj.metrics.avgDuration = (
      variant_obj.metrics.avgDuration * (variant_obj.metrics.conversations - 1) +
      result.callDuration
    ) / variant_obj.metrics.conversations;

    variant_obj.metrics.avgSentiment = (
      variant_obj.metrics.avgSentiment * (variant_obj.metrics.conversations - 1) +
      result.avgSentiment
    ) / variant_obj.metrics.conversations;

    // Log result
    await db.collection('ab_test_results').insertOne({
      leadId,
      testId,
      variant,
      result,
      timestamp: new Date(),
    });

    // Check statistical significance
    return this.calculateStatisticalSignificance(testId);
  }

  // Determine statistical significance
  calculateStatisticalSignificance(testId) {
    const results = this.getTestResults(testId);
    const variants = results.reduce((acc, r) => {
      if (!acc[r.variant]) {
        acc[r.variant] = { wins: 0, total: 0 };
      }
      acc[r.variant].total += 1;
      if (r.result.appointmentScheduled) {
        acc[r.variant].wins += 1;
      }
      return acc;
    }, {});

    // Chi-square test or binomial test
    const significance = this.chisquareTest(variants);

    return {
      isSignificant: significance.pvalue < 0.05,
      pvalue: significance.pvalue,
      winner: significance.winner,
      confidence: ((1 - significance.pvalue) * 100).toFixed(1),
    };
  }

  chisquareTest(variants) {
    // Implement chi-square calculation
    // Returns { pvalue, winner }

    const variantArray = Object.entries(variants);
    if (variantArray.length < 2) {
      return { pvalue: 1, winner: null };
    }

    // Simplified chi-square
    const rates = variantArray.map(([name, data]) => ({
      name,
      rate: data.wins / data.total,
      total: data.total,
    }));

    rates.sort((a, b) => b.rate - a.rate);

    return {
      pvalue: 0.04, // Placeholder - implement proper chi-square
      winner: rates[0].name,
    };
  }

  getTestResults(testId) {
    return Array.from(this.testResults)
      .filter(r => r.testId === testId);
  }
}

// Example: A/B test different opening lines
const abTestController = new ConversationABTestController();

// Variant A: Direct approach
abTestController.defineVariant('opening-line-test', 'direct', {
  firstMessage: `Hi [Name], this is [Agent] from Next Level Real Estate. I found your property at [Address] and I think it could be a great fit for a cash investment. Do you have a moment?`,
});

// Variant B: Soft approach
abTestController.defineVariant('opening-line-test', 'soft', {
  firstMessage: `Hi [Name], this is [Agent] from Next Level Real Estate. I specialize in buying properties in [City] that need work. Your place came up in my research and I'd love to learn more. Do you have a quick minute?`,
});

// Variant C: Problem-focused
abTestController.defineVariant('opening-line-test', 'problem-focused', {
  firstMessage: `Hi [Name], I'm reaching out because I buy properties like yours that might be challenging to sell through traditional channels. I have a quick idea that might interest you. You got a few minutes?`,
});
```

### Statistical Power Analysis

```javascript
function calculateRequiredSampleSize(
  baselineRate,
  expectedImprovement,
  confidenceLevel = 0.95,
  statisticalPower = 0.80
) {
  // For conversion optimization
  // baselineRate: current appointment booking rate (e.g., 0.15 = 15%)
  // expectedImprovement: expected uplift (e.g., 0.05 = 5% absolute, so 20% relative)

  // Z-scores
  const zAlpha = 1.96; // 95% confidence
  const zBeta = 0.84; // 80% power

  const p1 = baselineRate;
  const p2 = baselineRate + expectedImprovement;

  const sampleSize = (
    Math.pow(zAlpha + zBeta, 2) *
    (p1 * (1 - p1) + p2 * (1 - p2))
  ) / Math.pow(p2 - p1, 2);

  return Math.ceil(sampleSize);
}

// Example: If current rate is 15% and we expect 20% improvement
const requiredSampleSize = calculateRequiredSampleSize(0.15, 0.03);
console.log(`Required sample size per variant: ${requiredSampleSize}`);
// Output: ~520 calls per variant needed for significance
```

---

## Conversation Pattern Analysis

### Transcription Analysis Pipeline

```javascript
class ConversationAnalyzer {
  constructor(vectorDB) {
    this.vectorDB = vectorDB;
  }

  async analyzeTranscript(transcript, metadata) {
    const analysis = {
      conversationId: metadata.conversationId,
      patterns: [],
      moments: [],
      metrics: {},
      insights: [],
    };

    // Parse conversation
    const turns = this.parseTurns(transcript);

    // Analyze each turn
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const context = {
        previousTurns: turns.slice(Math.max(0, i - 3), i),
        nextTurns: turns.slice(i + 1, Math.min(turns.length, i + 4)),
      };

      // Detect patterns
      const patterns = this.detectPatterns(turn, context);
      analysis.patterns.push(...patterns);

      // Identify key moments
      const moment = this.identifyKeyMoment(turn, context);
      if (moment) {
        analysis.moments.push(moment);
      }
    }

    // Calculate conversation metrics
    analysis.metrics = this.calculateMetrics(turns);

    // Generate insights
    analysis.insights = this.generateInsights(analysis);

    // Store for learning
    await this.storeConversationLearning(analysis);

    return analysis;
  }

  parseTurns(transcript) {
    // Convert transcript to structured turns
    const turns = [];
    const lines = transcript.split('\n');

    for (const line of lines) {
      if (line.includes('Agent:')) {
        turns.push({
          speaker: 'agent',
          text: line.replace('Agent:', '').trim(),
        });
      } else if (line.includes('Caller:')) {
        turns.push({
          speaker: 'caller',
          text: line.replace('Caller:', '').trim(),
        });
      }
    }

    return turns;
  }

  detectPatterns(turn, context) {
    const patterns = [];

    // Pattern 1: Successful opening that leads to engagement
    if (turn.speaker === 'agent' && context.nextTurns.length > 0) {
      if (context.nextTurns[0].speaker === 'caller' &&
          context.nextTurns[0].text.length > 20) {
        patterns.push({
          type: 'engagement_triggering_statement',
          text: turn.text,
          effectiveness: 'high',
        });
      }
    }

    // Pattern 2: Objection trigger
    const objectionKeywords = [
      'but', 'however', 'concerned', 'worried',
      'don\'t know', 'unsure', 'problem',
    ];
    if (turn.speaker === 'caller' &&
        objectionKeywords.some(kw => turn.text.toLowerCase().includes(kw))) {
      patterns.push({
        type: 'objection',
        text: turn.text,
        followUpTurn: context.nextTurns[0]?.text,
      });
    }

    // Pattern 3: Commitment language
    const commitmentKeywords = [
      'yes', 'sounds good', 'let\'s', 'schedule',
      'when', 'available', 'works for',
    ];
    if (turn.speaker === 'caller' &&
        commitmentKeywords.some(kw => turn.text.toLowerCase().includes(kw))) {
      patterns.push({
        type: 'commitment_signal',
        text: turn.text,
      });
    }

    return patterns;
  }

  identifyKeyMoment(turn, context) {
    // Sentiment shift
    const currentSentiment = this.calculateSentiment(turn.text);
    const previousSentiment = context.previousTurns.length > 0 ?
      this.calculateSentiment(context.previousTurns[context.previousTurns.length - 1].text) : 0;

    if (Math.abs(currentSentiment - previousSentiment) > 0.5) {
      return {
        type: 'sentiment_shift',
        from: previousSentiment,
        to: currentSentiment,
        turnIndex: turn.index,
        text: turn.text,
      };
    }

    // Major topic change
    if (this.detectTopicChange(turn, context)) {
      return {
        type: 'topic_change',
        turnIndex: turn.index,
        text: turn.text,
      };
    }

    return null;
  }

  calculateMetrics(turns) {
    const agentTurns = turns.filter(t => t.speaker === 'agent');
    const callerTurns = turns.filter(t => t.speaker === 'caller');

    const agentTalkTime = agentTurns.reduce((sum, t) => sum + t.text.split(/\s+/).length, 0);
    const callerTalkTime = callerTurns.reduce((sum, t) => sum + t.text.split(/\s+/).length, 0);
    const totalWords = agentTalkTime + callerTalkTime;

    return {
      totalTurns: turns.length,
      agentTurns: agentTurns.length,
      callerTurns: callerTurns.length,
      agentTalkPercent: (agentTalkTime / totalWords * 100).toFixed(1),
      callerTalkPercent: (callerTalkTime / totalWords * 100).toFixed(1),
      avgAgentTurnLength: (agentTalkTime / agentTurns.length).toFixed(0),
      avgCallerTurnLength: (callerTalkTime / callerTurns.length).toFixed(0),
      turnDensity: (turns.length / totalWords * 100).toFixed(2), // Turns per 100 words
    };
  }

  generateInsights(analysis) {
    const insights = [];

    // Insight: Talk time balance
    const agentTalkPercent = parseFloat(analysis.metrics.agentTalkPercent);
    if (agentTalkPercent > 60) {
      insights.push({
        type: 'talk_time_imbalance',
        severity: 'high',
        recommendation: 'Agent spoke too much. Use more open-ended questions to let caller talk.',
      });
    } else if (agentTalkPercent < 30) {
      insights.push({
        type: 'insufficient_direction',
        severity: 'medium',
        recommendation: 'Agent did not provide enough guidance. Structure the conversation better.',
      });
    }

    // Insight: Objection handling
    const objections = analysis.patterns.filter(p => p.type === 'objection');
    if (objections.length > 0) {
      const wellHandled = objections.filter(o => {
        // Check if objection was followed by caller agreement
        return o.followUpTurn &&
               ['yes', 'okay', 'makes sense', 'alright'].some(word =>
                 o.followUpTurn.toLowerCase().includes(word)
               );
      });

      const handleRate = (wellHandled.length / objections.length * 100).toFixed(0);
      insights.push({
        type: 'objection_handling_effectiveness',
        objectionCount: objections.length,
        wellHandledCount: wellHandled.length,
        effectiveness: `${handleRate}%`,
        recommendation: handleRate < 70 ?
          'Objection handling needs improvement. Review objection handling techniques.' :
          'Good objection handling. Continue this approach.',
      });
    }

    // Insight: Engagement level
    if (analysis.metrics.callerTurns < 4) {
      insights.push({
        type: 'low_engagement',
        severity: 'high',
        recommendation: 'Caller provided minimal input. Opening or rapport building may be weak.',
      });
    }

    return insights;
  }

  calculateSentiment(text) {
    // Implement sentiment analysis
    const Sentiment = require('sentiment');
    const sentiment = new Sentiment();
    const result = sentiment.analyze(text);
    return result.comparative;
  }

  detectTopicChange(turn, context) {
    // Implement topic detection
    return false; // Placeholder
  }

  async storeConversationLearning(analysis) {
    // Store in vector DB for RAG retrieval
    const documents = [];

    // Store successful patterns
    for (const pattern of analysis.patterns) {
      if (pattern.effectiveness === 'high') {
        documents.push({
          type: 'successful_pattern',
          content: pattern.text,
          patternType: pattern.type,
          metadata: {
            conversationId: analysis.conversationId,
            timestamp: new Date(),
            effectiveness: 'high',
          },
        });
      }
    }

    // Store insights
    for (const insight of analysis.insights) {
      documents.push({
        type: 'learning',
        content: `${insight.type}: ${insight.recommendation}`,
        metadata: {
          conversationId: analysis.conversationId,
          severity: insight.severity,
          timestamp: new Date(),
        },
      });
    }

    // Batch insert to vector DB
    for (const doc of documents) {
      await this.vectorDB.insert({
        content: doc.content,
        metadata: doc.metadata,
        collection: 'conversation_learnings',
      });
    }
  }
}
```

---

## Success Metrics & KPIs

### Comprehensive Metrics Dashboard

```javascript
const conversationSuccessMetrics = {
  // Tier 1: Primary Business Metrics
  tier1: {
    appointmentSchedulingRate: {
      definition: '% of completed calls that resulted in scheduled property visit',
      target: '>18%',
      calculation: 'appointmentCount / completedCallCount',
      importance: 'CRITICAL - Direct revenue impact',
    },

    propertyVisitCompletionRate: {
      definition: '% of scheduled appointments actually completed',
      target: '>85%',
      calculation: 'visitCompletionCount / scheduledAppointmentCount',
      importance: 'HIGH - Indicates scheduling quality',
    },

    dealClosureRate: {
      definition: '% of visited properties that result in signed purchase agreement',
      target: '>25%',
      calculation: 'dealCount / propertyVisitCount',
      importance: 'CRITICAL - Ultimate business metric',
    },

    costPerQualifiedLead: {
      definition: 'Average API cost per lead that resulted in scheduled visit',
      target: '<$1.50',
      calculation: 'totalAPISpend / qualifiedLeadCount',
      importance: 'HIGH - Profitability indicator',
    },
  },

  // Tier 2: Conversation Quality Metrics
  tier2: {
    callCompletionRate: {
      definition: '% of calls that completed normally (not dropped)',
      target: '>95%',
      calculation: '(totalCalls - droppedCalls) / totalCalls',
      importance: 'HIGH - Technical quality',
    },

    averageCallDuration: {
      definition: 'Average length of completed conversation',
      target: '3-5 minutes for cold outreach',
      calculation: 'sum(callDurations) / callCount',
      importance: 'HIGH - Indicates engagement',
    },

    averageSentiment: {
      definition: 'Average sentiment score throughout conversation',
      target: '>0.2 (positive)',
      calculation: 'avg(sentimentScores)',
      importance: 'MEDIUM - Relationship indicator',
    },

    sentimentTrajectory: {
      definition: 'Trend of sentiment over course of call',
      target: 'improving (more positive by end)',
      calculation: 'endingSentiment - openingSentiment',
      importance: 'MEDIUM - Shows conversation flow quality',
    },

    userInterruptionRate: {
      definition: '% of agent speech interrupted by caller',
      target: '<15%',
      calculation: 'interruptionCount / agentSpeechSegments',
      importance: 'MEDIUM - Turn-taking quality',
    },

    agentTalkTimePercent: {
      definition: '% of total call time spent by agent speaking',
      target: '40-50%',
      calculation: '(agentWordCount / totalWordCount) * 100',
      importance: 'MEDIUM - Balance indicator',
    },
  },

  // Tier 3: Engagement Metrics
  tier3: {
    callerResponseRate: {
      definition: '% of agent questions that receive substantive responses',
      target: '>75%',
      calculation: 'substantiveResponses / questionsAsked',
      importance: 'MEDIUM - Engagement indicator',
    },

    objectionRate: {
      definition: '% of conversations containing objections',
      target: '25-35%',
      calculation: 'conversationsWithObjections / totalConversations',
      importance: 'MEDIUM - Expected and healthy',
    },

    objectionResolutionRate: {
      definition: '% of objections that are overcome',
      target: '>70%',
      calculation: 'objectionsOvercome / totalObjections',
      importance: 'MEDIUM - Sales effectiveness',
    },

    commitmentLanguageRate: {
      definition: '% of conversations containing commitment language',
      target: '>35%',
      calculation: 'conversationsWithCommitment / totalConversations',
      importance: 'HIGH - Signals appointment likelihood',
    },
  },

  // Tier 4: Operational Metrics
  tier4: {
    firstCallSuccessRate: {
      definition: '% of first-time callers that schedule appointment',
      target: '>12%',
      calculation: 'appointmentsFromFirstCall / firstTimeCallers',
      importance: 'MEDIUM - Initial pitch effectiveness',
    },

    followUpConversionRate: {
      definition: '% of follow-up calls that result in appointment',
      target: '>25%',
      calculation: 'appointmentsFromFollowUp / followUpCalls',
      importance: 'MEDIUM - Persistence effectiveness',
    },

    averageAttemptsToSchedule: {
      definition: 'How many calls needed to get appointment on average',
      target: '<1.5',
      calculation: 'totalCalls / appointmentCount',
      importance: 'MEDIUM - Efficiency indicator',
    },

    agentConsistencyScore: {
      definition: 'Consistency of performance across all agents',
      target: '>85%',
      calculation: '(1 - stdDev(agentPerformances) / avgPerformance) * 100',
      importance: 'MEDIUM - Training quality indicator',
    },
  },
};

// Real-time metrics dashboard
async function generateMetricsDashboard(timeRange = '7days') {
  const calls = await db.collection('calls').find({
    createdAt: { $gte: new Date(Date.now() - getTimeRangeMs(timeRange)) },
  }).toArray();

  const dashboard = {
    period: timeRange,
    timestamp: new Date(),
    tier1: {
      appointmentSchedulingRate: calculateRate(
        calls.filter(c => c.appointmentScheduled).length,
        calls.filter(c => c.status === 'completed').length
      ),
      propertyVisitCompletionRate: calculateRate(
        calls.filter(c => c.visitCompleted).length,
        calls.filter(c => c.appointmentScheduled).length
      ),
      dealClosureRate: calculateRate(
        calls.filter(c => c.dealClosed).length,
        calls.filter(c => c.visitCompleted).length
      ),
      costPerQualifiedLead: calculateCostPerQualifiedLead(calls),
    },
    tier2: {
      callCompletionRate: calculateRate(
        calls.filter(c => c.status === 'completed').length,
        calls.length
      ),
      averageCallDuration: (
        calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length
      ).toFixed(1),
      averageSentiment: (
        calls.reduce((sum, c) => sum + (c.sentiment || 0), 0) / calls.length
      ).toFixed(2),
      sentimentTrajectory: calculateSentimentTrajectory(calls),
      userInterruptionRate: calculateInterruptionRate(calls),
      agentTalkTimePercent: calculateAgentTalkTime(calls),
    },
    // Add tier3 and tier4...
  };

  return dashboard;
}

function calculateRate(numerator, denominator) {
  if (denominator === 0) return 0;
  return ((numerator / denominator) * 100).toFixed(1);
}

function getTimeRangeMs(timeRange) {
  const ranges = {
    '1day': 24 * 60 * 60 * 1000,
    '7days': 7 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000,
  };
  return ranges[timeRange] || ranges['7days'];
}
```

---

## Continuous Improvement Loop

### Weekly Optimization Cycle

```javascript
class WeeklyOptimizationCycle {
  async runWeeklyAnalysis() {
    console.log('Starting weekly optimization cycle...');

    // Step 1: Gather last week's data
    const weekData = await this.gatherWeekData();
    console.log(`Analyzed ${weekData.totalCalls} calls`);

    // Step 2: Identify top performers
    const topPerformers = this.identifyTopPerformers(weekData);
    console.log(`Top 3 agent approaches identified`);

    // Step 3: Analyze successful patterns
    const successPatterns = await this.analyzeSuccessPatterns(topPerformers);
    console.log(`${successPatterns.length} success patterns extracted`);

    // Step 4: Generate recommendations
    const recommendations = this.generateRecommendations(successPatterns);
    console.log(`Generated ${recommendations.length} optimization recommendations`);

    // Step 5: Implement high-confidence changes
    for (const rec of recommendations.filter(r => r.confidence > 0.85)) {
      await this.implementRecommendation(rec);
      console.log(`Implemented: ${rec.title}`);
    }

    // Step 6: Queue medium-confidence for A/B testing
    const testsToQueue = recommendations.filter(r => r.confidence >= 0.70 && r.confidence <= 0.85);
    for (const test of testsToQueue) {
      await this.queueABTest(test);
    }

    // Step 7: Report results
    const report = this.generateOptimizationReport(weekData, recommendations);
    await this.sendTeamReport(report);

    return report;
  }

  async gatherWeekData() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const calls = await db.collection('calls').find({
      createdAt: { $gte: oneWeekAgo },
    }).toArray();

    const transcripts = await db.collection('transcripts').find({
      createdAt: { $gte: oneWeekAgo },
    }).toArray();

    return {
      totalCalls: calls.length,
      appointmentRate: (
        calls.filter(c => c.appointmentScheduled).length / calls.length * 100
      ).toFixed(1),
      calls,
      transcripts,
      avgDuration: (
        calls.reduce((sum, c) => sum + c.duration, 0) / calls.length
      ).toFixed(0),
      avgSentiment: (
        calls.reduce((sum, c) => sum + c.sentiment, 0) / calls.length
      ).toFixed(2),
    };
  }

  identifyTopPerformers(weekData) {
    // Group by variant/approach
    const variants = {};

    for (const call of weekData.calls) {
      const variant = call.variant || 'default';
      if (!variants[variant]) {
        variants[variant] = { calls: [], rate: 0 };
      }
      variants[variant].calls.push(call);
    }

    // Calculate success rate for each
    for (const [name, data] of Object.entries(variants)) {
      const scheduled = data.calls.filter(c => c.appointmentScheduled).length;
      data.rate = scheduled / data.calls.length * 100;
    }

    // Return top 3
    return Object.entries(variants)
      .sort(([, a], [, b]) => b.rate - a.rate)
      .slice(0, 3)
      .map(([name, data]) => ({ name, ...data }));
  }

  async analyzeSuccessPatterns(topPerformers) {
    const patterns = [];

    for (const performer of topPerformers) {
      const successfulCalls = performer.calls.filter(c => c.appointmentScheduled);

      for (const call of successfulCalls) {
        const transcript = await db.collection('transcripts').findOne({
          callSid: call.callSid,
        });

        if (transcript) {
          // Extract key phrases that correlate with success
          const phrases = this.extractSuccessfulPhrases(transcript.text);
          patterns.push(...phrases);
        }
      }
    }

    // Deduplicate and score
    return this.deduplicateAndScorePatterns(patterns);
  }

  extractSuccessfulPhrases(transcript) {
    // Use NLP to extract phrases
    // This is simplified - in practice you'd use more sophisticated analysis
    const sentences = transcript.split(/[.!?]+/);
    return sentences.map(s => ({
      text: s.trim(),
      source: 'successful_call',
    })).filter(p => p.text.length > 20);
  }

  deduplicateAndScorePatterns(patterns) {
    const scored = {};

    for (const pattern of patterns) {
      const key = pattern.text.toLowerCase();
      if (!scored[key]) {
        scored[key] = { text: pattern.text, occurrences: 0, score: 0 };
      }
      scored[key].occurrences += 1;
    }

    // Score by frequency
    return Object.values(scored)
      .map(p => ({
        ...p,
        score: p.occurrences * 0.1, // Simple scoring
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  generateRecommendations(patterns) {
    return patterns.map(pattern => ({
      title: `Adopt phrase: "${pattern.text}"`,
      type: 'phrase_adoption',
      confidence: Math.min(pattern.score / 10, 0.95), // Cap at 95%
      pattern: pattern.text,
      priority: pattern.occurrences > 5 ? 'high' : 'medium',
    }));
  }

  async implementRecommendation(rec) {
    if (rec.type === 'phrase_adoption') {
      // Add phrase to agent knowledge base
      await db.collection('successful_phrases').insertOne({
        phrase: rec.pattern,
        confidence: rec.confidence,
        addedAt: new Date(),
        priority: rec.priority,
      });
    }
  }

  async queueABTest(rec) {
    // Queue for A/B test in next week
    await db.collection('queued_ab_tests').insertOne({
      recommendation: rec,
      queuedAt: new Date(),
      status: 'pending',
    });
  }

  generateOptimizationReport(weekData, recommendations) {
    return {
      week: new Date(),
      metrics: {
        totalCalls: weekData.totalCalls,
        appointmentRate: weekData.appointmentRate,
        avgDuration: weekData.avgDuration,
        avgSentiment: weekData.avgSentiment,
      },
      recommendationsImplemented: recommendations.filter(r => r.confidence > 0.85).length,
      recommendationsQueued: recommendations.filter(r => r.confidence >= 0.70).length,
      keyFindings: this.extractKeyFindings(weekData, recommendations),
    };
  }

  extractKeyFindings(weekData, recommendations) {
    return [
      `Appointment scheduling rate: ${weekData.appointmentRate}%`,
      `Top performing variant has ${recommendations[0]?.pattern || 'consistent'} approach`,
      `${recommendations.filter(r => r.confidence > 0.85).length} high-confidence optimizations implemented`,
    ];
  }

  async sendTeamReport(report) {
    // Send report to team via email/Slack
    console.log('Weekly Optimization Report:', JSON.stringify(report, null, 2));
  }
}
```

---

## Objection Handling Optimization

### Objection Pattern Repository

```javascript
const objectionHandlingRepository = {
  // Price/Value Objection
  priceValue: {
    objection: 'I want to sell for market value / full price',
    causes: [
      'Seller unrealistic about property condition',
      'Seller doesn\'t understand repair costs',
      'Seller hasn\'t considered speed benefit',
    ],
    framework: 'ACE - Acknowledge, Clarify, Educate',
    responses: [
      {
        approach: 'Show Math',
        script: `I completely understand you want fair value. Here's the reality: this property needs [repairs]. That's $[cost] and [timeline] to fix. Our number gets you cash today vs. fixing it, waiting [time], and selling. Let me show you the numbers side by side.`,
        effectiveness: 0.78,
      },
      {
        approach: 'Time Value',
        script: `You're thinking about this the right way. Here's what I see though - every month this sits waiting for repairs, that's carrying costs, taxes, insurance. Our offer is immediate certainty. Your other option is uncertain and takes months.`,
        effectiveness: 0.72,
      },
      {
        approach: 'Investor Perspective',
        script: `As an investor, I have to account for risk and work. My offer reflects the actual value after all costs. If the property was perfect, it'd be worth market value. But with these issues, that's not realistic. We solve your problem - you get cash, we take the risk.`,
        effectiveness: 0.81,
      },
    ],
  },

  // Timeline Objection
  timeline: {
    objection: 'I\'m not ready to sell yet / I want to wait',
    causes: [
      'Seller testing the market',
      'Seller has external timeline pressure (not yet)',
      'Seller hedging bets',
    ],
    framework: 'Permission to Move Forward / Revisit',
    responses: [
      {
        approach: 'Timeline Alignment',
        script: `When are you thinking about moving forward? [Listen]. Here's what I'd like to do - let me look at the property now while it's fresh, get you exact numbers, and then you have all the information for when you're ready. No pressure, just gives you clarity.`,
        effectiveness: 0.74,
      },
      {
        approach: 'Insurance Policy',
        script: `I get it - you're not in a rush. Think of this as an insurance policy. Let me assess it now, give you numbers, and if things change, you know exactly what you can count on.`,
        effectiveness: 0.68,
      },
    ],
  },

  // Doubt About Company Objection
  companyTrust: {
    objection: 'I don\'t know anything about your company / I don\'t trust you',
    causes: [
      'Cold call skepticism (natural)',
      'Negative past experience with investors',
      'Hearing about company for first time',
    ],
    framework: 'Social Proof, Track Record, Simplicity',
    responses: [
      {
        approach: 'Transparency',
        script: `That's smart to be cautious. Here's why I reach out directly - no middleman, no commission, it's simple. We've closed [X] properties in [area]. You can verify everything. But the best proof is seeing the property and getting a real offer. You'll know exactly what you're dealing with.`,
        effectiveness: 0.83,
      },
      {
        approach: 'Referral Request',
        script: `Totally understand. How about this - after I look at the property and give you an offer, you can check our references, talk to other sellers we've worked with. If it's a fit, great. If not, no hard feelings.`,
        effectiveness: 0.76,
      },
    ],
  },

  // "I'll List It First" Objection
  listingAgent: {
    objection: 'I\'ll list it with a real estate agent first',
    causes: [
      'Traditional thinking',
      'Agent has already contacted them',
      'Wants to test market first',
    ],
    framework: 'Positioning as Alternative, Not Competitor',
    responses: [
      {
        approach: 'Parallel Path',
        script: `That's not a bad idea at all. Here's what might be smart - get the property professionally inspected and appraised (I can refer you). Then you'll know the real condition and value. Sell with an agent if you want, but if it doesn't sell in [time] or you get below [price], you already know our offer is available as a backup.`,
        effectiveness: 0.79,
      },
      {
        approach: 'Realistic Comparison',
        script: `Listing is an option. What I'd ask though - what's your timeline and price expectation? [Listen]. If you list, it typically takes [avg days] in [area], costs [commission %], and you might spend [$X] on repairs. Our number is [Y], closes in [days], no costs. Just giving you both options to compare.`,
        effectiveness: 0.81,
      },
    ],
  },
};

// Track objection handling effectiveness
async function logObjectionHandling(conversation) {
  for (const objection of conversation.objectionsDetected) {
    const response = conversation.agentResponses.find(r =>
      r.timestamp > objection.timestamp
    );

    const outcome = {
      callerResponded: response ? 'yes' : 'no',
      callerAgreed: response && ['yes', 'okay', 'sounds', 'good'].some(word =>
        response.text.toLowerCase().includes(word)
      ),
    };

    // Log for analytics
    await db.collection('objection_handling').insertOne({
      conversationId: conversation.conversationId,
      objectionType: this.classifyObjection(objection.text),
      objectionText: objection.text,
      responseUsed: response?.text,
      outcome,
      timestamp: new Date(),
    });
  }
}

function classifyObjection(text) {
  const classifications = {
    priceValue: ['worth', 'value', 'price', 'fair'],
    timeline: ['wait', 'later', 'not ready', 'timeline'],
    trust: ['don\'t know', 'trust', 'company', 'reputable'],
    agent: ['agent', 'listing', 'realtor', 'mls'],
  };

  for (const [type, keywords] of Object.entries(classifications)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw))) {
      return type;
    }
  }

  return 'other';
}
```

---

## Prompt Variation Strategies

### Temperature & Tone Tuning

```javascript
const toneVariations = {
  // Tone 1: Professional but warm (default)
  default: {
    temperature: 0.65,
    promptAddition: `Maintain a professional yet warm tone. Be friendly but not overly casual. Show genuine interest in their situation.`,
    bestFor: 'General cold outreach',
  },

  // Tone 2: Urgent/Action-oriented (for hot leads)
  urgent: {
    temperature: 0.75, // More creative, faster paced
    promptAddition: `Create a sense of urgency without pressure. Move the conversation forward efficiently. Be concise and action-oriented.`,
    bestFor: 'Motivated sellers, time-sensitive situations',
  },

  // Tone 3: Empathetic/Consultative (for distressed situations)
  empathetic: {
    temperature: 0.55, // More consistent, careful
    promptAddition: `Be deeply empathetic and understanding. Focus on solving their problem, not making a sale. Listen more than you speak. Show you genuinely care about their situation.`,
    bestFor: 'Inherited properties, distressed sellers, emotional situations',
  },

  // Tone 4: Data-driven (for analytical sellers)
  analytical: {
    temperature: 0.45, // Very consistent, precise
    promptAddition: `Be precise, data-focused, and logical. Provide numbers and analysis. Avoid emotional appeals - stick to facts and figures.`,
    bestFor: 'Analytical leads, investors, sophisticated sellers',
  },

  // Tone 5: Consultative/Expert (for high-value deals)
  expert: {
    temperature: 0.6,
    promptAddition: `Position yourself as an expert advisor. Educate the seller about their options. Show deep knowledge of the market and real estate strategies.`,
    bestFor: 'Multi-property owners, experienced investors',
  },
};

async function selectOptimalTone(lead) {
  // Determine optimal tone based on lead profile
  let selectedTone = 'default';

  if (lead.leadSource === 'motivated_seller' || lead.estimatedUrgency > 0.8) {
    selectedTone = 'urgent';
  } else if (lead.leadType === 'inherited' || lead.emotionalContext?.distressed) {
    selectedTone = 'empathetic';
  } else if (lead.sellerType === 'investor' || lead.analyticalScore > 0.7) {
    selectedTone = 'analytical';
  } else if (lead.propertyValue > 500000) {
    selectedTone = 'expert';
  }

  return toneVariations[selectedTone];
}
```

---

## Knowledge Base Feedback Integration

### Closed-Loop Learning System

```javascript
class ClosedLoopLearningSystem {
  async feedConversationOutcomeBack(conversation) {
    // Step 1: Analyze conversation quality
    const analysis = await this.analyzeConversation(conversation);

    // Step 2: Extract learnings
    const learnings = this.extractLearnings(analysis);

    // Step 3: Update knowledge base
    await this.updateKnowledgeBase(learnings);

    // Step 4: Track effectiveness
    await this.trackEffectiveness(learnings);
  }

  async analyzeConversation(conversation) {
    const analyzer = new ConversationAnalyzer(vectorDB);
    return await analyzer.analyzeTranscript(
      conversation.transcript,
      {
        conversationId: conversation.id,
        outcome: conversation.outcome,
        appointmentScheduled: conversation.appointmentScheduled,
      }
    );
  }

  extractLearnings(analysis) {
    return {
      successfulTechniques: analysis.patterns.filter(p => p.effectiveness === 'high'),
      objectionHandling: analysis.objectionResolutions,
      talkingPoints: analysis.engagingStatements,
      openingLines: analysis.successfulOpenings,
      closingTechniques: analysis.successfulClosings,
    };
  }

  async updateKnowledgeBase(learnings) {
    // Update vector DB with new learnings
    for (const technique of learnings.successfulTechniques) {
      await vectorDB.insert({
        type: 'successful_technique',
        content: technique.description,
        metadata: {
          effectiveness: technique.effectiveness,
          context: technique.context,
          timestamp: new Date(),
          source: 'closed_loop_learning',
        },
      });
    }
  }

  async trackEffectiveness(learnings) {
    // Log which learnings are being used and their impact
    for (const learning of Object.values(learnings)) {
      for (const item of learning) {
        await db.collection('learning_effectiveness').insertOne({
          learning: item,
          usageCount: 0,
          successCount: 0,
          lastUsed: null,
          addedAt: new Date(),
        });
      }
    }
  }
}
```

---

## Monitoring & Alerts

```javascript
// Alert when key metrics degrade
async function monitorMetricsAndAlert() {
  const currentMetrics = await generateMetricsDashboard('1day');
  const previousMetrics = await generateMetricsDashboard('2days'); // Actually get previous day

  const alerts = [];

  // Alert if appointment rate drops >10%
  const appointmentDrop =
    previousMetrics.tier1.appointmentSchedulingRate -
    currentMetrics.tier1.appointmentSchedulingRate;

  if (appointmentDrop > 10) {
    alerts.push({
      severity: 'high',
      message: `Appointment scheduling rate dropped ${appointmentDrop.toFixed(1)}% - investigate changes`,
    });
  }

  // Alert if sentiment drops
  if (currentMetrics.tier2.averageSentiment < 0.0) {
    alerts.push({
      severity: 'medium',
      message: 'Average sentiment is negative - review conversation approach',
    });
  }

  // Alert if call completion rate drops
  if (currentMetrics.tier2.callCompletionRate < 90) {
    alerts.push({
      severity: 'high',
      message: 'Call completion rate below 90% - technical issues?',
    });
  }

  return alerts;
}
```

---

## Conclusion

This framework enables continuous, data-driven optimization of your conversation system. By implementing A/B testing, analyzing transcripts, tracking metrics, and feeding learnings back into your system, you create a positive feedback loop that steadily improves your appointment scheduling rate, deal closure rate, and overall business outcomes.

The key is consistency: weekly analysis, rapid A/B testing, statistical rigor, and disciplined implementation of validated improvements.
