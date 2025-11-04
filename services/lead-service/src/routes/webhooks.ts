import { Router } from 'express';
import { body } from 'express-validator';
import {
  handleZillowLead,
  verifyZillowSignature
} from '../webhooks/zillow';
import {
  handleGoogleAdsLead,
  handleGoogleAdsVerification,
  verifyGoogleAdsSignature
} from '../webhooks/google-ads';
import {
  handleRealGeeksLead,
  handleRealGeeksLeadUpdate,
  verifyRealGeeksAuth
} from '../webhooks/realgeeks';

const router = Router();

/**
 * Zillow webhook endpoint
 * POST /webhooks/zillow/leads
 */
router.post(
  '/zillow/leads',
  verifyZillowSignature,
  handleZillowLead
);

/**
 * Google Ads webhook endpoints
 */
// Verification endpoint (challenge request)
router.get(
  '/google-ads/leads',
  handleGoogleAdsVerification
);

// Lead submission endpoint
router.post(
  '/google-ads/leads',
  verifyGoogleAdsSignature,
  handleGoogleAdsLead
);

/**
 * RealGeeks webhook endpoints
 */
// New lead
router.post(
  '/realgeeks/leads',
  verifyRealGeeksAuth,
  handleRealGeeksLead
);

// Lead update
router.put(
  '/realgeeks/leads',
  verifyRealGeeksAuth,
  handleRealGeeksLeadUpdate
);

router.patch(
  '/realgeeks/leads',
  verifyRealGeeksAuth,
  handleRealGeeksLeadUpdate
);

export default router;
