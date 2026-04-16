/**
 * Payout state transition utility
 */

const PAYOUT_ACTIONS = {
  MARK_PAID: 'mark_paid',
  MARK_FAILED: 'mark_failed',
};

const ACTION_TO_STATUS = {
  [PAYOUT_ACTIONS.MARK_PAID]: 'paid',
  [PAYOUT_ACTIONS.MARK_FAILED]: 'failed',
};

/**
 * @typedef {Object} PayoutTransitionInput
 * @property {'pending'|'processing'|'paid'|'failed'|'not_applicable'} currentStatus
 * @property {string} action
 * @property {'admin'|'organizer'|'user'} actorRole
 */

/**
 * @typedef {Object} PayoutTransitionResult
 * @property {boolean} allowed
 * @property {string} nextStatus
 * @property {string} [reason]
 */

/**
 * Validate and compute payout status transition.
 * @param {PayoutTransitionInput} input
 * @returns {PayoutTransitionResult}
 */
const transitionPayoutStatus = (input = {}) => {
  const currentStatus = input.currentStatus || 'pending';
  const action = input.action;
  const actorRole = input.actorRole;

  if (!Object.prototype.hasOwnProperty.call(ACTION_TO_STATUS, action)) {
    return {
      allowed: false,
      nextStatus: currentStatus,
      reason: 'Invalid payout transition action',
    };
  }

  if (actorRole !== 'admin') {
    return {
      allowed: false,
      nextStatus: currentStatus,
      reason: 'Only admin can finalize payout status',
    };
  }

  if (currentStatus !== 'processing') {
    return {
      allowed: false,
      nextStatus: currentStatus,
      reason: 'Payout must be in processing state for this action',
    };
  }

  return {
    allowed: true,
    nextStatus: ACTION_TO_STATUS[action],
  };
};

module.exports = {
  transitionPayoutStatus,
  PAYOUT_ACTIONS,
};
