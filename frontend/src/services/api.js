const API_BASE_URL = "http://localhost:8003";

export const apiService = {
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

  getAuthHeaders: () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  },

  authenticatedRequest: async (endpoint, options = {}) => {
    const headers = {
      ...apiService.getAuthHeaders(),
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
  },

  getProjects: () =>
    apiService.authenticatedRequest("/projects", { method: "GET" }),
  getProjectById: (projectId) =>
    apiService.authenticatedRequest(`/projects/${projectId}`, {
      method: "GET",
    }),
  createProject: (formData) =>
    apiService.authenticatedRequest("/projects", {
      method: "POST",
      body: formData,
    }),
  updateProject: (projectId, formData) =>
    apiService.authenticatedRequest(`/projects/${projectId}`, {
      method: "PATCH",
      body: formData,
    }),
  deleteProject: (projectId) =>
    apiService.authenticatedRequest(`/projects/${projectId}`, {
      method: "DELETE",
    }),
  assignQA: (projectId, qaIds) =>
    apiService.authenticatedRequest(`/projects/${projectId}/assign-qa`, {
      method: "POST",
      body: JSON.stringify({ qaIds }),
    }),
  assignDevelopers: (projectId, developerIds) =>
    apiService.authenticatedRequest(
      `/projects/${projectId}/assign-developers`,
      { method: "POST", body: JSON.stringify({ developerIds }) }
    ),
  getAssignedProjects: () =>
    apiService.authenticatedRequest("/assigned-projects", { method: "GET" }),

  getBugs: (projectId) => {
    const endpoint = projectId ? `/bugs?projectId=${projectId}` : "/bugs";
    return apiService.authenticatedRequest(endpoint, { method: "GET" });
  },
  createBug: (formData) =>
    apiService.authenticatedRequest("/bugs", {
      method: "POST",
      body: formData,
    }),
  getBugById: (bugId) =>
    apiService.authenticatedRequest(`/bugs/${bugId}`, { method: "GET" }),
  updateBug: (bugId, formData) =>
    apiService.authenticatedRequest(`/bugs/${bugId}`, {
      method: "PATCH",
      body: formData,
    }),
  deleteBug: (bugId) =>
    apiService.authenticatedRequest(`/bugs/${bugId}`, { method: "DELETE" }),
  updateBugStatus: (bugId, status) =>
    apiService.authenticatedRequest(`/bugs/${bugId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

};

export default apiService;
