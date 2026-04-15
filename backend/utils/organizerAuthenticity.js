/**
 * Organizer authenticity verification utility
 */

const { GST_REGEX } = require('./organizerVerification');

const SCORE_WEIGHTS = {
  companyName: 10,
  gstNumberValid: 60,
  businessAddress: 15,
  venueRegistration: 15,
};

const APPROVAL_THRESHOLD = 90;
const MANUAL_REVIEW_THRESHOLD = 60;

/**
 * @typedef {Object} OrganizerAuthenticityInput
 * @property {string} [companyName]
 * @property {string} [gstNumber]
 * @property {string} [businessAddress]
 * @property {string} [venueRegistration]
 */

/**
 * @typedef {Object} OrganizerAuthenticityResult
 * @property {number} score
 * @property {boolean} autoApproved
 * @property {'approved' | 'pending_manual_review' | 'rejected'} recommendedStatus
 * @property {string[]} reasons
 */

/**
 * Evaluate organizer authenticity using deterministic checks.
 * @param {OrganizerAuthenticityInput} input
 * @returns {Promise<OrganizerAuthenticityResult>}
 */
const verifyOrganizerAuthenticity = async (input = {}) => {
  const reasons = [];
  let score = 0;

  const companyName = String(input.companyName || '').trim();
  const gstNumber = String(input.gstNumber || '').trim().toUpperCase();
  const businessAddress = String(input.businessAddress || '').trim();
  const venueRegistration = String(input.venueRegistration || '').trim();

  if (companyName) {
    score += SCORE_WEIGHTS.companyName;
  } else {
    reasons.push('companyName is missing');
  }

  if (!gstNumber) {
    reasons.push('gstNumber is missing');
  } else if (GST_REGEX.test(gstNumber)) {
    score += SCORE_WEIGHTS.gstNumberValid;
  } else {
    reasons.push('gstNumber format is invalid');
  }

  if (businessAddress) {
    score += SCORE_WEIGHTS.businessAddress;
  } else {
    reasons.push('businessAddress is missing');
  }

  if (venueRegistration) {
    score += SCORE_WEIGHTS.venueRegistration;
  } else {
    reasons.push('venueRegistration is missing');
  }

  if (score >= APPROVAL_THRESHOLD) {
    return {
      score,
      autoApproved: true,
      recommendedStatus: 'approved',
      reasons,
    };
  }

  if (score >= MANUAL_REVIEW_THRESHOLD) {
    return {
      score,
      autoApproved: false,
      recommendedStatus: 'pending_manual_review',
      reasons,
    };
  }

  return {
    score,
    autoApproved: false,
    recommendedStatus: 'rejected',
    reasons,
  };
};

module.exports = {
  verifyOrganizerAuthenticity,
};
