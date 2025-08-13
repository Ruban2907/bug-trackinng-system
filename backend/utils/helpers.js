const { ValidationError } = require('./errors');

/**
 * Convert Buffer to base64 string
 * @param {Buffer} buffer - The buffer to convert
 * @returns {string} Base64 encoded string
 */
const bufferToBase64 = (buffer) => {
  if (!buffer) return null;
  return buffer.toString('base64');
};

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @param {number} maxSize - Maximum file size in bytes (default: 5MB)
 * @returns {Object} Validation result
 */
const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) return { isValid: true };
  
  if (!file.mimetype.startsWith('image/')) {
    throw new ValidationError('Only image files are allowed');
  }
  
  if (file.size > maxSize) {
    throw new ValidationError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }
  
  return { isValid: true };
};

/**
 * Parse array field from request body
 * @param {any} fieldValue - The field value to parse
 * @returns {Array} Parsed array
 */
const parseArrayField = (fieldValue) => {
  if (!fieldValue) return [];
  
  try {
    return Array.isArray(fieldValue) ? fieldValue : JSON.parse(fieldValue);
  } catch (_) {
    return [];
  }
};

/**
 * Check if user can manage a specific role
 * @param {string} currentUserRole - Current user's role
 * @param {string} targetRole - Target role to manage
 * @returns {boolean} Whether user can manage the target role
 */
const canManageRole = (currentUserRole, targetRole) => {
  switch (currentUserRole) {
    case 'admin':
      return ['manager', 'qa', 'developer'].includes(targetRole);
    case 'manager':
      return ['qa', 'developer'].includes(targetRole);
    default:
      return false;
  }
};

/**
 * Sanitize user object by removing sensitive fields
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  
  // Convert picture buffer to base64 if exists
  if (userObj.picture && userObj.picture.data) {
    userObj.picture = {
      data: bufferToBase64(userObj.picture.data),
      contentType: userObj.picture.contentType
    };
  }
  
  return userObj;
};

/**
 * Check if string is valid ObjectId
 * @param {string} id - String to validate
 * @returns {boolean} Whether string is valid ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate pagination object
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination object
 */
const generatePagination = (page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage
  };
};

module.exports = {
  bufferToBase64,
  validateImageFile,
  parseArrayField,
  canManageRole,
  sanitizeUser,
  isValidObjectId,
  isValidEmail,
  generatePagination
};
