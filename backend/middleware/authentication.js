const { getUser } = require("../services/secret");
const User = require("../model/user");
const { AuthenticationError, AuthorizationError } = require("../utils/errors");

/**
 * Base authentication function to extract and verify token
 * @param {Object} req - Express request object
 * @returns {Object} User data from token
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }
  return authHeader.substring(7);
};

/**
 * Base authentication function to get user from database
 * @param {string} userId - User ID from token
 * @returns {Object} User object from database
 */
const getUserFromDb = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  return user;
};

/**
 * Basic authentication middleware
 */
function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    const decoded = getUser(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require manager or admin role
 */
async function requireManagerOrAdmin(req, res, next) {
  try {
    const user = await getUserFromDb(req.user._id);
    if (!['admin', 'manager'].includes(user.role)) {
      throw new AuthorizationError('Access denied. Manager or Admin role required.');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require admin role only
 */
async function requireAdmin(req, res, next) {
  try {
    const user = await getUserFromDb(req.user._id);
    if (user.role !== 'admin') {
      throw new AuthorizationError('Access denied. Admin role required.');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require regular user (non-admin)
 */
async function requireUser(req, res, next) {
  try {
    const user = await getUserFromDb(req.user._id);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require any authenticated user
 */
async function requireAnyUser(req, res, next) {
  try {
    const user = await getUserFromDb(req.user._id);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require admin, manager, or QA role
 */
const requireAdminManagerOrQA = async (req, res, next) => {
  try {
    const user = await getUserFromDb(req.user._id);
    if (!['admin', 'manager', 'qa'].includes(user.role)) {
      throw new AuthorizationError('Access denied. Admin, Manager, or QA role required.');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Flexible role-based access control
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await getUserFromDb(req.user._id);
      if (!allowedRoles.includes(user.role)) {
        throw new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  requireAdmin,
  requireUser,
  requireManagerOrAdmin,
  requireAnyUser,
  requireAdminManagerOrQA,
  requireRole
}; 