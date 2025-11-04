import { Transcript, Sentiment } from '@next-level-real-estate/shared/models';

/**
 * Sentiment Analyzer Utility
 *
 * Analyzes conversation sentiment from transcripts
 * In production, this would integrate with ElevenLabs or a dedicated sentiment analysis service
 */
export class SentimentAnalyzer {
  /**
   * Analyze overall sentiment from transcript
   */
  static analyzeTranscript(transcript: Transcript): Sentiment {
    const segments = transcript.segments;

    if (segments.length === 0) {
      return {
        overall: 'neutral',
        confidence: 0,
        keywords: [],
      };
    }

    // Analyze customer segments only (ignore agent)
    const customerSegments = segments.filter(
      (seg) => seg.speaker === 'customer'
    );

    if (customerSegments.length === 0) {
      return {
        overall: 'neutral',
        confidence: 0,
        keywords: [],
      };
    }

    // Simple keyword-based sentiment analysis (placeholder)
    // In production, use ElevenLabs sentiment API or a dedicated NLP service
    const positiveKeywords = [
      'yes',
      'interested',
      'great',
      'sounds good',
      'perfect',
      'thank you',
      'appreciate',
      'helpful',
      'definitely',
    ];

    const negativeKeywords = [
      'no',
      'not interested',
      'busy',
      'stop calling',
      'remove',
      'unsubscribe',
      'never',
      'wrong number',
    ];

    let positiveScore = 0;
    let negativeScore = 0;
    const foundKeywords: string[] = [];

    for (const segment of customerSegments) {
      const text = segment.text.toLowerCase();

      for (const keyword of positiveKeywords) {
        if (text.includes(keyword)) {
          positiveScore++;
          foundKeywords.push(keyword);
        }
      }

      for (const keyword of negativeKeywords) {
        if (text.includes(keyword)) {
          negativeScore++;
          foundKeywords.push(keyword);
        }
      }
    }

    // Determine overall sentiment
    let overall: Sentiment['overall'];
    let confidence: number;

    const totalScore = positiveScore + negativeScore;
    if (totalScore === 0) {
      overall = 'neutral';
      confidence = 0.5;
    } else {
      const positiveRatio = positiveScore / totalScore;

      if (positiveRatio >= 0.8) {
        overall = 'very_positive';
        confidence = 0.8;
      } else if (positiveRatio >= 0.6) {
        overall = 'positive';
        confidence = 0.7;
      } else if (positiveRatio <= 0.2) {
        overall = 'very_negative';
        confidence = 0.8;
      } else if (positiveRatio <= 0.4) {
        overall = 'negative';
        confidence = 0.7;
      } else {
        overall = 'neutral';
        confidence = 0.6;
      }
    }

    return {
      overall,
      confidence,
      keywords: [...new Set(foundKeywords)],
    };
  }

  /**
   * Extract key moments from transcript
   */
  static extractKeyMoments(transcript: Transcript): Array<{
    timestamp: number;
    text: string;
    type: 'commitment' | 'objection' | 'question' | 'positive' | 'negative';
    speaker: 'agent' | 'customer' | 'system';
  }> {
    const keyMoments: Array<{
      timestamp: number;
      text: string;
      type: 'commitment' | 'objection' | 'question' | 'positive' | 'negative';
      speaker: 'agent' | 'customer' | 'system';
    }> = [];

    // Commitment keywords
    const commitmentKeywords = [
      'yes',
      'sure',
      'okay',
      'sounds good',
      'let\'s do it',
      'schedule',
      'appointment',
      'meeting',
    ];

    // Objection keywords
    const objectionKeywords = [
      'but',
      'however',
      'not sure',
      'concerned',
      'worried',
      'problem',
      'issue',
    ];

    // Question patterns
    const questionPatterns = [
      /what/i,
      /how/i,
      /when/i,
      /where/i,
      /why/i,
      /can you/i,
      /could you/i,
    ];

    for (const segment of transcript.segments) {
      if (segment.speaker === 'system') {
        continue;
      }

      const text = segment.text.toLowerCase();

      // Check for commitments
      if (commitmentKeywords.some((keyword) => text.includes(keyword))) {
        keyMoments.push({
          timestamp: segment.timestamp,
          text: segment.text,
          type: 'commitment',
          speaker: segment.speaker,
        });
        continue;
      }

      // Check for objections
      if (objectionKeywords.some((keyword) => text.includes(keyword))) {
        keyMoments.push({
          timestamp: segment.timestamp,
          text: segment.text,
          type: 'objection',
          speaker: segment.speaker,
        });
        continue;
      }

      // Check for questions
      if (questionPatterns.some((pattern) => pattern.test(text))) {
        keyMoments.push({
          timestamp: segment.timestamp,
          text: segment.text,
          type: 'question',
          speaker: segment.speaker,
        });
        continue;
      }

      // Check sentiment of segment
      if (segment.sentiment) {
        if (
          segment.sentiment.overall === 'positive' ||
          segment.sentiment.overall === 'very_positive'
        ) {
          keyMoments.push({
            timestamp: segment.timestamp,
            text: segment.text,
            type: 'positive',
            speaker: segment.speaker,
          });
        } else if (
          segment.sentiment.overall === 'negative' ||
          segment.sentiment.overall === 'very_negative'
        ) {
          keyMoments.push({
            timestamp: segment.timestamp,
            text: segment.text,
            type: 'negative',
            speaker: segment.speaker,
          });
        }
      }
    }

    return keyMoments;
  }

  /**
   * Calculate talk time ratio (agent vs customer)
   */
  static calculateTalkTimeRatio(transcript: Transcript): number {
    let agentWords = 0;
    let customerWords = 0;

    for (const segment of transcript.segments) {
      const wordCount = segment.text.split(/\s+/).length;

      if (segment.speaker === 'agent') {
        agentWords += wordCount;
      } else if (segment.speaker === 'customer') {
        customerWords += wordCount;
      }
    }

    const totalWords = agentWords + customerWords;
    if (totalWords === 0) {
      return 0.5;
    }

    return customerWords / totalWords;
  }

  /**
   * Detect conversation quality issues
   */
  static detectQualityIssues(transcript: Transcript): {
    interruptions: number;
    longPauses: number;
    repeatedPhrases: number;
  } {
    let interruptions = 0;
    let longPauses = 0;
    const phraseCount = new Map<string, number>();

    for (let i = 1; i < transcript.segments.length; i++) {
      const prev = transcript.segments[i - 1];
      const curr = transcript.segments[i];

      // Detect interruptions (same speaker twice in a row is unusual)
      if (prev.speaker === curr.speaker && prev.speaker !== 'system') {
        interruptions++;
      }

      // Detect long pauses (>3 seconds between segments)
      if (curr.timestamp - prev.timestamp > 3000) {
        longPauses++;
      }

      // Count repeated phrases
      const normalizedText = curr.text.toLowerCase().trim();
      if (normalizedText.length > 10) {
        const count = phraseCount.get(normalizedText) || 0;
        phraseCount.set(normalizedText, count + 1);
      }
    }

    // Count phrases repeated more than twice
    let repeatedPhrases = 0;
    for (const count of phraseCount.values()) {
      if (count > 2) {
        repeatedPhrases++;
      }
    }

    return {
      interruptions,
      longPauses,
      repeatedPhrases,
    };
  }
}
