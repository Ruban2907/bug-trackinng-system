import { API_BASE_URL, getAuthHeaders, authenticatedRequest } from '../../../utils/apiHelpers';

// Bug-related API functions
export const bugApiService = {
  getBugs: (projectId) => {
    const endpoint = projectId ? `/bugs?projectId=${projectId}` : "/bugs";
    return authenticatedRequest(endpoint, { method: "GET" });
  },
  createBug: (formData) =>
    authenticatedRequest("/bugs", {
      method: "POST",
      body: formData,
    }),
  getBugById: (bugId) =>
    authenticatedRequest(`/bugs/${bugId}`, { method: "GET" }),
  updateBug: (bugId, formData) =>
    authenticatedRequest(`/bugs/${bugId}`, {
      method: "PATCH",
      body: formData,
    }),
  deleteBug: (bugId) =>
    authenticatedRequest(`/bugs/${bugId}`, { method: "DELETE" }),
  updateBugStatus: (bugId, status) =>
    authenticatedRequest(`/bugs/${bugId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getProjectBugs: (projectId) =>
    authenticatedRequest (`/bugs?projectId=${projectId}`, { method: "GET" }),
};

export default bugApiService;
