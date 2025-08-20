const API_BASE_URL = "http://localhost:8003";

// Helper function to get authentication headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

// Helper function for authenticated requests
export const authenticatedRequest = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  return response;
};

export { API_BASE_URL };
