/**
 * @typedef {Object} AuthUserInput
 * @property {string|Object} _id
 * @property {string} name
 * @property {string} email
 * @property {'user'|'organizer'|'admin'} role
 * @property {'none'|'pending'|'approved'|'rejected'} [verificationStatus]
 * @property {string} [verificationReason]
 */

/**
 * @typedef {Object} AuthUserPayload
 * @property {string|Object} id
 * @property {string} name
 * @property {string} email
 * @property {'user'|'organizer'|'admin'} role
 * @property {'none'|'pending'|'approved'|'rejected'} [verificationStatus]
 * @property {string} [verificationReason]
 */

/**
 * Build a safe auth response user payload.
 * @param {AuthUserInput} user
 * @param {{ includeVerification?: boolean }} [options]
 * @returns {AuthUserPayload}
 */
const buildAuthUserPayload = (user, options = {}) => {
  if (!user || typeof user !== 'object') {
    throw new TypeError('user is required');
  }

  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  if (options.includeVerification) {
    payload.verificationStatus = user.verificationStatus;
    payload.verificationReason = user.verificationReason;
  }

  return payload;
};

module.exports = {
  buildAuthUserPayload,
};
