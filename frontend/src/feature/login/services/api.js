import { API_BASE_URL, getAuthHeaders, authenticatedRequest } from '../../../utils/apiHelpers';

// Authentication-related API functions
export const authApiService = {
  // User login
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    return response;
  },

  // Forgot password
  forgotPassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response;
  },

  // Reset password
  resetPassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response;
  },

  // Get authentication headers
  getAuthHeaders,

  // Generic authenticated request helper
  authenticatedRequest,
};

export default authApiService;
