/**
 * Custom Assertions
 *
 * Domain-specific assertion helpers for testing.
 */

/**
 * Assert lead structure is valid
 */
export function assertValidLead(lead: any): void {
  expect(lead).toBeDefined();
  expect(lead.leadId).toBeDefined();
  expect(lead.source).toBeDefined();
  expect(lead.contact).toBeDefined();
  expect(lead.contact.firstName).toBeDefined();
  expect(lead.contact.lastName).toBeDefined();
  expect(lead.contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  expect(lead.contact.phone).toMatch(/^\+?[1-9]\d{1,14}$/);
  expect(lead.consent).toBeDefined();
  expect(lead.consent.hasWrittenConsent).toBeDefined();
  expect(lead.createdAt).toBeDefined();
  expect(lead.updatedAt).toBeDefined();
}

/**
 * Assert TCPA compliance
 */
export function assertTCPACompliant(lead: any): void {
  expect(lead.consent).toBeDefined();
  expect(lead.consent.hasWrittenConsent).toBe(true);
  expect(lead.consent.consentDate).toBeDefined();
  expect(lead.consent.consentMethod).toMatch(/^(written_form|email|phone)$/);
  expect(lead.consent.consentSource).toBeDefined();
  expect(lead.dncStatus).toBeDefined();
  expect(lead.dncStatus.onNationalRegistry).toBe(false);
  expect(lead.dncStatus.internalDNC).toBe(false);
  expect(lead.automatedCallsAllowed).toBe(true);
}

/**
 * Assert call structure is valid
 */
export function assertValidCall(call: any): void {
  expect(call).toBeDefined();
  expect(call.callId).toBeDefined();
  expect(call.leadId).toBeDefined();
  expect(call.from).toMatch(/^\+?[1-9]\d{1,14}$/);
  expect(call.to).toMatch(/^\+?[1-9]\d{1,14}$/);
  expect(call.status).toMatch(/^(queued|ringing|in-progress|completed|failed|busy|no-answer)$/);
  expect(call.direction).toMatch(/^(inbound|outbound)$/);
  expect(call.createdAt).toBeDefined();
}

/**
 * Assert completed call has required data
 */
export function assertCompletedCall(call: any): void {
  assertValidCall(call);
  expect(call.status).toBe('completed');
  expect(call.startTime).toBeDefined();
  expect(call.endTime).toBeDefined();
  expect(call.duration).toBeGreaterThan(0);
  expect(call.transcript).toBeDefined();
  expect(Array.isArray(call.transcript)).toBe(true);
  expect(call.outcome).toBeDefined();
}

/**
 * Assert conversation transcript is valid
 */
export function assertValidTranscript(transcript: any[]): void {
  expect(Array.isArray(transcript)).toBe(true);
  expect(transcript.length).toBeGreaterThan(0);

  transcript.forEach((entry) => {
    expect(entry.role).toMatch(/^(agent|user)$/);
    expect(entry.message).toBeDefined();
    expect(typeof entry.message).toBe('string');
    expect(entry.timestamp).toBeDefined();
  });
}

/**
 * Assert conversation has positive sentiment
 */
export function assertPositiveSentiment(call: any): void {
  expect(call.sentiment).toBeDefined();
  expect(call.sentiment.overall).toBe('positive');
  expect(call.sentiment.score).toBeGreaterThan(0.5);
}

/**
 * Assert lead qualification
 */
export function assertQualifiedLead(lead: any): void {
  assertValidLead(lead);
  expect(lead.status).toBe('qualified');
  expect(lead.qualificationScore).toBeGreaterThanOrEqual(70);
  expect(lead.qualificationReason).toBeDefined();
}

/**
 * Assert property data is valid
 */
export function assertValidProperty(property: any): void {
  expect(property).toBeDefined();
  expect(property.address).toBeDefined();
  expect(property.address.street).toBeDefined();
  expect(property.address.city).toBeDefined();
  expect(property.address.state).toBeDefined();
  expect(property.address.zipCode).toBeDefined();
  expect(property.propertyType).toBeDefined();
  expect(property.estimatedValue).toBeGreaterThan(0);
}

/**
 * Assert event message structure
 */
export function assertValidEvent(event: any): void {
  expect(event).toBeDefined();
  expect(event.key).toBeDefined();
  expect(event.value).toBeDefined();

  const parsedValue = typeof event.value === 'string' ? JSON.parse(event.value) : event.value;
  expect(parsedValue.type).toBeDefined();
  expect(parsedValue.payload).toBeDefined();
  expect(parsedValue.timestamp).toBeDefined();
}

/**
 * Assert API response structure
 */
export function assertValidApiResponse(response: any, expectedStatus: number = 200): void {
  expect(response).toBeDefined();
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
}

/**
 * Assert error response structure
 */
export function assertErrorResponse(response: any, expectedStatus: number = 400): void {
  expect(response).toBeDefined();
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  expect(response.body.error).toBeDefined();
  expect(response.body.message).toBeDefined();
}

/**
 * Assert webhook payload structure
 */
export function assertValidWebhookPayload(payload: any, source: 'google_ads' | 'zillow' | 'realgeeks'): void {
  expect(payload).toBeDefined();

  if (source === 'google_ads') {
    expect(payload.lead_id).toBeDefined();
    expect(payload.google_key).toBeDefined();
    expect(payload.user_column_data).toBeDefined();
    expect(Array.isArray(payload.user_column_data)).toBe(true);
  } else if (source === 'zillow') {
    expect(payload.ContactID).toBeDefined();
    expect(payload.FirstName).toBeDefined();
    expect(payload.LastName).toBeDefined();
    expect(payload.Email).toBeDefined();
    expect(payload.Phone).toBeDefined();
  }
}

/**
 * Assert campaign structure is valid
 */
export function assertValidCampaign(campaign: any): void {
  expect(campaign).toBeDefined();
  expect(campaign.campaignId).toBeDefined();
  expect(campaign.name).toBeDefined();
  expect(campaign.type).toBeDefined();
  expect(campaign.status).toMatch(/^(active|paused|completed)$/);
  expect(campaign.conversationFlow).toBeDefined();
  expect(campaign.performance).toBeDefined();
  expect(campaign.createdAt).toBeDefined();
}

/**
 * Assert performance metrics are valid
 */
export function assertValidMetrics(metrics: any): void {
  expect(metrics).toBeDefined();
  expect(typeof metrics.callsInitiated).toBe('number');
  expect(typeof metrics.callsCompleted).toBe('number');
  expect(typeof metrics.connectRate).toBe('number');
  expect(typeof metrics.qualificationRate).toBe('number');
  expect(metrics.connectRate).toBeGreaterThanOrEqual(0);
  expect(metrics.connectRate).toBeLessThanOrEqual(1);
}

/**
 * Assert agent response structure
 */
export function assertValidAgentResponse(response: any): void {
  expect(response).toBeDefined();
  expect(response.id).toBeDefined();
  expect(response.role).toBe('assistant');
  expect(response.content).toBeDefined();
  expect(response.usage).toBeDefined();
  expect(response.usage.inputTokens).toBeGreaterThan(0);
  expect(response.usage.outputTokens).toBeGreaterThan(0);
}

/**
 * Assert prompt caching is working
 */
export function assertPromptCachingActive(response: any): void {
  assertValidAgentResponse(response);
  expect(response.usage.cacheReadInputTokens).toBeGreaterThan(0);
}

/**
 * Assert market intelligence data
 */
export function assertValidMarketIntelligence(data: any): void {
  expect(data).toBeDefined();
  expect(data.location).toBeDefined();
  expect(data.metrics).toBeDefined();
  expect(data.metrics.averagePrice).toBeGreaterThan(0);
  expect(data.metrics.medianPrice).toBeGreaterThan(0);
  expect(data.metrics.daysOnMarket).toBeGreaterThan(0);
  expect(data.metrics.inventoryLevel).toMatch(/^(low|medium|high)$/);
  expect(data.comparables).toBeDefined();
  expect(Array.isArray(data.comparables)).toBe(true);
}

/**
 * Assert timing constraints (for 5-minute rule)
 */
export function assertTimingConstraint(createdAt: Date, processedAt: Date, maxMinutes: number = 5): void {
  const diffMs = processedAt.getTime() - createdAt.getTime();
  const diffMinutes = diffMs / 1000 / 60;

  expect(diffMinutes).toBeLessThanOrEqual(maxMinutes);
}

/**
 * Assert response time is acceptable
 */
export function assertResponseTime(duration: number, maxMs: number = 1000): void {
  expect(duration).toBeLessThanOrEqual(maxMs);
}

/**
 * Assert database record exists
 */
export function assertRecordExists(record: any): void {
  expect(record).toBeDefined();
  expect(record).not.toBeNull();
}

/**
 * Assert database record does not exist
 */
export function assertRecordNotExists(record: any): void {
  expect(record).toBeNull();
}

/**
 * Assert array has items
 */
export function assertArrayHasItems(array: any[], minCount: number = 1): void {
  expect(Array.isArray(array)).toBe(true);
  expect(array.length).toBeGreaterThanOrEqual(minCount);
}

/**
 * Assert array is empty
 */
export function assertArrayEmpty(array: any[]): void {
  expect(Array.isArray(array)).toBe(true);
  expect(array.length).toBe(0);
}

/**
 * Assert rate limiting is working
 */
export function assertRateLimited(response: any): void {
  expect(response.status).toBe(429);
  expect(response.body.error).toMatch(/rate limit/i);
}

/**
 * Assert authentication is required
 */
export function assertAuthRequired(response: any): void {
  expect(response.status).toBe(401);
  expect(response.body.error).toMatch(/unauthorized|authentication/i);
}

/**
 * Assert authorization is required
 */
export function assertAuthorizationRequired(response: any): void {
  expect(response.status).toBe(403);
  expect(response.body.error).toMatch(/forbidden|authorization/i);
}

/**
 * Assert validation error
 */
export function assertValidationError(response: any, field?: string): void {
  expect(response.status).toBe(400);
  expect(response.body.error).toMatch(/validation|invalid/i);

  if (field) {
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[field]).toBeDefined();
  }
}

/**
 * Assert not found error
 */
export function assertNotFound(response: any): void {
  expect(response.status).toBe(404);
  expect(response.body.error).toMatch(/not found/i);
}

/**
 * Assert conflict error
 */
export function assertConflict(response: any): void {
  expect(response.status).toBe(409);
  expect(response.body.error).toMatch(/conflict|already exists/i);
}

/**
 * Assert dates are close (within tolerance)
 */
export function assertDatesClose(date1: Date, date2: Date, toleranceMs: number = 1000): void {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  expect(diff).toBeLessThanOrEqual(toleranceMs);
}

/**
 * Assert object contains subset
 */
export function assertObjectContains(obj: any, subset: any): void {
  Object.keys(subset).forEach((key) => {
    expect(obj[key]).toEqual(subset[key]);
  });
}

/**
 * Assert value is within range
 */
export function assertInRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}
