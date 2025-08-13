/**
 * Standardized response handler for consistent API responses
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {Object} pagination - Pagination info (optional)
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {any} errors - Error details (optional)
 */
const errorResponse = (res, statusCode = 500, message = 'Internal server error', errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Created resource data
 */
const createdResponse = (res, message = 'Resource created successfully', data = null) => {
  return successResponse(res, 201, message, data);
};

/**
 * No content response (204)
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Validation error response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {any} errors - Validation error details
 */
const validationErrorResponse = (res, message = 'Validation failed', errors = null) => {
  return errorResponse(res, 400, message, errors);
};

/**
 * Not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, 404, message);
};

/**
 * Unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, 401, message);
};

/**
 * Forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
const forbiddenResponse = (res, message = 'Access denied') => {
  return errorResponse(res, 403, message);
};

/**
 * Conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 */
const conflictResponse = (res, message = 'Resource conflict') => {
  return errorResponse(res, 409, message);
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse
};
