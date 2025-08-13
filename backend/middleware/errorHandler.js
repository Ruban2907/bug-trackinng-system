const { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError } = require('../utils/errors');
const { errorResponse, validationErrorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, conflictResponse } = require('../utils/responseHandler');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthenticationError(message);
  }

  // Handle custom errors
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      return validationErrorResponse(res, err.message, err.errors);
    }
    if (err instanceof AuthenticationError) {
      return unauthorizedResponse(res, err.message);
    }
    if (err instanceof AuthorizationError) {
      return forbiddenResponse(res, err.message);
    }
    if (err instanceof NotFoundError) {
      return notFoundResponse(res, err.message);
    }
    if (err instanceof ConflictError) {
      return conflictResponse(res, err.message);
    }
    
    // Generic AppError
    return errorResponse(res, err.statusCode, err.message);
  }

  // Default error
  return errorResponse(res, 500, 'Internal server error');
};

/**
 * 404 handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFound = (req, res) => {
  return notFoundResponse(res, `Route ${req.originalUrl} not found`);
};

/**
 * Async error wrapper to catch async errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { errorHandler, notFound, asyncHandler };
