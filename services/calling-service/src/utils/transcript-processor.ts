import { Transcript, Intent, CallOutcome } from '@next-level-real-estate/shared/models';
import { SentimentAnalyzer } from './sentiment-analyzer';

/**
 * Transcript Processor Utility
 *
 * Processes call transcripts to extract insights and outcomes
 */
export class TranscriptProcessor {
  /**
   * Process complete transcript
   */
  static processTranscript(transcript: Transcript): {
    sentiment: any;
    intent: Intent;
    outcome: CallOutcome;
    keyMoments: any[];
    quality: any;
  } {
    return {
      sentiment: SentimentAnalyzer.analyzeTranscript(transcript),
      intent: this.extractIntent(transcript),
      outcome: this.determineOutcome(transcript),
      keyMoments: SentimentAnalyzer.extractKeyMoments(transcript),
      quality: this.analyzeQuality(transcript),
    };
  }

  /**
   * Extract primary intent from conversation
   */
  static extractIntent(transcript: Transcript): Intent {
    const text = transcript.fullText.toLowerCase();

    // Intent keywords mapping
    const intentPatterns = {
      get_cash_offer: ['cash offer', 'how much', 'offer', 'price', 'value'],
      sell_property: ['sell', 'selling', 'sale', 'get rid of'],
      schedule_appointment: ['schedule', 'appointment', 'meet', 'visit', 'come over'],
      request_information: ['tell me', 'information', 'learn more', 'explain'],
      request_callback: ['call back', 'callback', 'later', 'another time'],
      decline: ['not interested', 'no thanks', 'remove', 'stop calling'],
    };

    let maxScore = 0;
    let primaryIntent = 'unknown';
    const secondaryIntents: string[] = [];

    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score++;
        }
      }

      if (score > maxScore) {
        if (maxScore > 0) {
          secondaryIntents.push(primaryIntent);
        }
        maxScore = score;
        primaryIntent = intent;
      } else if (score > 0) {
        secondaryIntents.push(intent);
      }
    }

    const confidence = maxScore > 0 ? Math.min(maxScore / 10, 1) : 0.3;

    return {
      primary: primaryIntent,
      secondary: secondaryIntents,
      confidence,
    };
  }

  /**
   * Determine call outcome
   */
  static determineOutcome(transcript: Transcript): CallOutcome {
    const text = transcript.fullText.toLowerCase();
    const intent = this.extractIntent(transcript);

    // Default outcome
    let outcome: CallOutcome = {
      result: 'information_provided',
      appointmentScheduled: false,
      callbackRequested: false,
      tags: [],
    };

    // Check for appointment
    if (
      intent.primary === 'schedule_appointment' ||
      text.includes('schedule') ||
      text.includes('appointment')
    ) {
      outcome.result = 'appointment_set';
      outcome.appointmentScheduled = true;
      outcome.tags.push('appointment');
    }

    // Check for callback request
    else if (
      intent.primary === 'request_callback' ||
      text.includes('call back') ||
      text.includes('later')
    ) {
      outcome.result = 'callback_requested';
      outcome.callbackRequested = true;
      outcome.tags.push('callback');
    }

    // Check for not interested
    else if (
      intent.primary === 'decline' ||
      text.includes('not interested') ||
      text.includes('no thanks')
    ) {
      outcome.result = 'not_interested';
      outcome.tags.push('declined');
    }

    // Check for qualified
    else if (
      intent.primary === 'get_cash_offer' ||
      intent.primary === 'sell_property'
    ) {
      outcome.result = 'qualified';
      outcome.tags.push('qualified', 'interested');
    }

    // Check for voicemail
    else if (
      text.includes('leave a message') ||
      text.includes('voicemail') ||
      transcript.segments.length === 1
    ) {
      outcome.result = 'voicemail';
      outcome.tags.push('voicemail');
    }

    // Check for no answer
    else if (transcript.duration < 10) {
      outcome.result = 'no_answer';
      outcome.tags.push('no_answer');
    }

    return outcome;
  }

  /**
   * Analyze call quality
   */
  static analyzeQuality(transcript: Transcript): {
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    latency?: number;
    interruptions: number;
    silencePercentage?: number;
    talkTimeRatio: number;
  } {
    const qualityIssues = SentimentAnalyzer.detectQualityIssues(transcript);
    const talkTimeRatio = SentimentAnalyzer.calculateTalkTimeRatio(transcript);

    // Determine audio quality based on confidence scores
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const segment of transcript.segments) {
      if (segment.confidence !== undefined) {
        totalConfidence += segment.confidence;
        confidenceCount++;
      }
    }

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.5;

    let audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (avgConfidence >= 0.9) {
      audioQuality = 'excellent';
    } else if (avgConfidence >= 0.7) {
      audioQuality = 'good';
    } else if (avgConfidence >= 0.5) {
      audioQuality = 'fair';
    } else {
      audioQuality = 'poor';
    }

    return {
      audioQuality,
      interruptions: qualityIssues.interruptions,
      talkTimeRatio,
    };
  }

  /**
   * Extract action items from transcript
   */
  static extractActionItems(transcript: Transcript): string[] {
    const actionItems: string[] = [];
    const text = transcript.fullText.toLowerCase();

    // Action item patterns
    if (text.includes('send') || text.includes('email')) {
      actionItems.push('Send follow-up email');
    }

    if (text.includes('call back') || text.includes('follow up')) {
      actionItems.push('Schedule follow-up call');
    }

    if (text.includes('appointment') || text.includes('schedule')) {
      actionItems.push('Confirm appointment details');
    }

    if (text.includes('documents') || text.includes('paperwork')) {
      actionItems.push('Prepare necessary documents');
    }

    if (text.includes('inspection') || text.includes('visit')) {
      actionItems.push('Schedule property inspection');
    }

    return actionItems;
  }

  /**
   * Generate call summary
   */
  static generateSummary(transcript: Transcript): string {
    const intent = this.extractIntent(transcript);
    const outcome = this.determineOutcome(transcript);
    const sentiment = SentimentAnalyzer.analyzeTranscript(transcript);

    const parts: string[] = [];

    // Duration
    parts.push(`Call duration: ${Math.floor(transcript.duration / 60)} minutes`);

    // Intent
    parts.push(`Primary intent: ${intent.primary}`);

    // Outcome
    parts.push(`Result: ${outcome.result}`);

    // Sentiment
    parts.push(`Sentiment: ${sentiment.overall}`);

    // Key moments
    const keyMoments = SentimentAnalyzer.extractKeyMoments(transcript);
    if (keyMoments.length > 0) {
      parts.push(`Key moments: ${keyMoments.length}`);
    }

    return parts.join('. ');
  }

  /**
   * Format transcript for display
   */
  static formatForDisplay(transcript: Transcript): string {
    let formatted = '';

    for (const segment of transcript.segments) {
      const timestamp = this.formatTimestamp(segment.timestamp);
      const speaker = segment.speaker.toUpperCase();
      formatted += `[${timestamp}] ${speaker}: ${segment.text}\n`;
    }

    return formatted;
  }

  /**
   * Format timestamp
   */
  private static formatTimestamp(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
