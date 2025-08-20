import { API_BASE_URL, getAuthHeaders, authenticatedRequest } from '../../../utils/apiHelpers';

// Project-related API functions
export const projectApiService = {
  getProjects: () =>
    authenticatedRequest("/projects", { method: "GET" }),
  getProjectById: (projectId) =>
    authenticatedRequest(`/projects/${projectId}`, {
      method: "GET",
    }),
  createProject: (formData) =>
    authenticatedRequest("/projects", {
      method: "POST",
      body: formData,
    }),
  updateProject: (projectId, formData) =>
    authenticatedRequest(`/projects/${projectId}`, {
      method: "PATCH",
      body: formData,
    }),
  deleteProject: (projectId) =>
    authenticatedRequest(`/projects/${projectId}`, {
      method: "DELETE",
    }),
  assignQA: (projectId, qaIds) =>
    authenticatedRequest(`/projects/${projectId}/assign-qa`, {
      method: "POST",
      body: JSON.stringify({ qaIds }),
    }),
  assignDevelopers: (projectId, developerIds) =>
    authenticatedRequest(`/projects/${projectId}/assign-developers`, {
      method: "POST",
      body: JSON.stringify({ developerIds }),
    }),
  getAssignedProjects: () =>
    authenticatedRequest("/projects/assigned-projects", { method: "GET" }),
  getUsersByRole: (role) =>
    authenticatedRequest(`/users?role=${role}`, { method: "GET" }),
};

export default projectApiService;
