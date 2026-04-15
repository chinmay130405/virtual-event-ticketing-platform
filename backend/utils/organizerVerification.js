const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const validateOrganizerRegistration = (payload = {}) => {
  const errors = [];

  if (!payload.companyName || !String(payload.companyName).trim()) {
    errors.push('companyName is required');
  }

  if (!payload.businessAddress || !String(payload.businessAddress).trim()) {
    errors.push('businessAddress is required');
  }

  if (!payload.gstNumber || !String(payload.gstNumber).trim()) {
    errors.push('gstNumber is required');
  } else if (!GST_REGEX.test(String(payload.gstNumber).trim().toUpperCase())) {
    errors.push('gstNumber format is invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  GST_REGEX,
  validateOrganizerRegistration,
};
