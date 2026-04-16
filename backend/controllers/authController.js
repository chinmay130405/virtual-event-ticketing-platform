/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { normalizeRole, getPublicRegistrationRole } = require('../utils/roles');
const { buildAuthUserPayload } = require('../utils/authUserPayload');
const { validateOrganizerRegistration } = require('../utils/organizerVerification');
const { verifyOrganizerAuthenticity } = require('../utils/organizerAuthenticity');

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: getPublicRegistrationRole(role),
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update organizer payout bank details
 * PUT /api/auth/organizer/bank-details
 */
exports.updateOrganizerBankDetails = async (req, res, next) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required bank details',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Only organizers can update payout bank details',
      });
    }

    user.bankDetails = {
      accountHolderName: String(accountHolderName).trim(),
      accountNumber: String(accountNumber).trim(),
      ifscCode: String(ifscCode).trim().toUpperCase(),
      bankName: String(bankName).trim(),
    };

    await user.save({ validateBeforeSave: false });

    const maskedAccount = user.bankDetails.accountNumber.length > 4
      ? `${'*'.repeat(user.bankDetails.accountNumber.length - 4)}${user.bankDetails.accountNumber.slice(-4)}`
      : user.bankDetails.accountNumber;

    return res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      bankDetails: {
        accountHolderName: user.bankDetails.accountHolderName,
        bankName: user.bankDetails.bankName,
        ifscCode: user.bankDetails.ifscCode,
        maskedAccountNumber: maskedAccount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    if (!user.role) {
      user.role = normalizeRole(undefined);
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user._id, user.role);

    // Update last login time
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new organizer account
 * POST /api/auth/register-organizer
 */
exports.registerOrganizer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      companyName,
      gstNumber,
      businessAddress,
      venueRegistration,
      phone,
    } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const verification = validateOrganizerRegistration({
      companyName,
      gstNumber,
      businessAddress,
    });

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: 'Organizer registration validation failed',
        errors: verification.errors,
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const authenticity = await verifyOrganizerAuthenticity({
      companyName,
      gstNumber,
      businessAddress,
      venueRegistration,
    });

    user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'organizer',
      phone: phone || '',
      companyName: String(companyName).trim(),
      gstNumber: String(gstNumber).trim().toUpperCase(),
      businessAddress: String(businessAddress).trim(),
      venueRegistration: venueRegistration ? String(venueRegistration).trim() : '',
      verificationStatus:
        authenticity.recommendedStatus === 'approved'
          ? 'approved'
          : authenticity.recommendedStatus === 'rejected'
            ? 'rejected'
            : 'pending',
      verificationReason: authenticity.reasons.length ? authenticity.reasons.join('; ') : '',
      verifiedAt: authenticity.recommendedStatus === 'approved' ? new Date() : null,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message:
        authenticity.recommendedStatus === 'approved'
          ? 'Organizer registration approved automatically.'
          : authenticity.recommendedStatus === 'rejected'
            ? 'Organizer registration rejected. Please contact support.'
            : 'Organizer registration submitted. Awaiting approval.',
      token,
      user: buildAuthUserPayload(user, { includeVerification: true }),
      authenticity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/update-profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
