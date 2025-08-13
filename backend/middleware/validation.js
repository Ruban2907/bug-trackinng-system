const { ValidationError } = require('../utils/errors');
const { isValidObjectId, isValidEmail } = require('../utils/helpers');

/**
 * Validate required fields in request body
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Function} Express middleware function
 */
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return next(new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      ));
    }
    
    next();
  };
};

/**
 * Validate email format
 * @returns {Function} Express middleware function
 */
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email && !isValidEmail(email)) {
    return next(new ValidationError('Invalid email format'));
  }
  
  next();
};

/**
 * Validate ObjectId format
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!isValidObjectId(id)) {
      return next(new ValidationError(`Invalid ${paramName} format`));
    }
    
    next();
  };
};

/**
 * Validate ObjectId in request body
 * @param {string} fieldName - Name of the field to validate
 * @returns {Function} Express middleware function
 */
const validateBodyObjectId = (fieldName) => {
  return (req, res, next) => {
    const id = req.body[fieldName];
    
    if (id && !isValidObjectId(id)) {
      return next(new ValidationError(`Invalid ${fieldName} format`));
    }
    
    next();
  };
};

/**
 * Validate role assignment
 * @returns {Function} Express middleware function
 */
const validateRole = (req, res, next) => {
  const { role } = req.body;
  const validRoles = ['admin', 'manager', 'qa', 'developer'];
  
  if (role && !validRoles.includes(role)) {
    return next(new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`));
  }
  
  next();
};

/**
 * Validate bug type
 * @returns {Function} Express middleware function
 */
const validateBugType = (req, res, next) => {
  const { type } = req.body;
  const validTypes = ['feature', 'bug'];
  
  if (type && !validTypes.includes(type)) {
    return next(new ValidationError(`Invalid type. Must be one of: ${validTypes.join(', ')}`));
  }
  
  if (type) {
    req.body.type = type.toLowerCase();
  }
  
  next();
};

/**
 * Validate bug status
 * @returns {Function} Express middleware function
 */
const validateBugStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['new', 'started', 'resolved', 'completed'];
  
  if (status && !validStatuses.includes(status)) {
    return next(new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`));
  }
  
  next();
};

/**
 * Validate date format
 * @param {string} fieldName - Name of the date field to validate
 * @returns {Function} Express middleware function
 */
const validateDate = (fieldName) => {
  return (req, res, next) => {
    const dateValue = req.body[fieldName];
    
    if (dateValue) {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return next(new ValidationError(`Invalid ${fieldName} format`));
      }
      
      // Check if date is in the future
      if (date < new Date()) {
        return next(new ValidationError(`${fieldName} cannot be in the past`));
      }
    }
    
    next();
  };
};

/**
 * Validate array fields
 * @param {string[]} arrayFields - Array of field names that should be arrays
 * @returns {Function} Express middleware function
 */
const validateArrayFields = (arrayFields) => {
  return (req, res, next) => {
    arrayFields.forEach(field => {
      const value = req.body[field];
      
      if (value !== undefined && !Array.isArray(value)) {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            return next(new ValidationError(`${field} must be an array`));
          }
        } catch (error) {
          return next(new ValidationError(`${field} must be an array`));
        }
      }
    });
    
    next();
  };
};

/**
 * Sanitize string fields (trim whitespace)
 * @param {string[]} stringFields - Array of field names to sanitize
 * @returns {Function} Express middleware function
 */
const sanitizeStrings = (stringFields) => {
  return (req, res, next) => {
    stringFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].trim();
      }
    });
    
    next();
  };
};

module.exports = {
  validateRequiredFields,
  validateEmail,
  validateObjectId,
  validateBodyObjectId,
  validateRole,
  validateBugType,
  validateBugStatus,
  validateDate,
  validateArrayFields,
  sanitizeStrings
};
