import React, { useEffect, useState } from 'react';
import Layout from '../../../shared/Layout';
import { apiService } from '../../../services/api';
import { toast } from 'react-toastify';
import ProjectCard from '../../../feature/projects/ProjectCard';
import BugEditModal from '../../../feature/bugs/BugEditModal';
import BugCard from '../../../feature/bugs/BugCard';
import ConfirmationModal from '../../../shared/ConfirmationModal';
import { getUserInfo } from '../../../utils/userUtils';
import { useNavigate } from 'react-router-dom';

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [projectBugs, setProjectBugs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bugToEdit, setBugToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bugToDelete, setBugToDelete] = useState(null);
  const [deletingBug, setDeletingBug] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
      if (user.role === 'admin' || user.role === 'manager') {
        navigate('/projects', { replace: true });
        return;
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (userInfo) {
      fetchData();
    }
  }, [userInfo]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const projectsRes = await apiService.getAssignedProjects();
      if (!projectsRes.ok) {
        const errorData = await projectsRes.json();
        throw new Error(errorData.message || 'Failed to load projects');
      }

      const projectsData = await projectsRes.json();
      // Extract data from new response format
      const projectsList = projectsData.data || projectsData.projects || [];
      setProjects(projectsList);

      await fetchProjectBugs(projectsList);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectBugs = async (projectsList) => {
    try {
      const bugsPromises = projectsList.map(async (project) => {
        try {
          const bugsRes = await apiService.authenticatedRequest(`/bugs?projectId=${project._id}`);
          if (bugsRes.ok) {
            const bugsData = await bugsRes.json();
            // Extract data from new response format
            const bugsList = bugsData.data || bugsData.bugs || [];
            
            // Additional safety check: ensure bugs actually belong to this project
            const filteredBugs = bugsList.filter(bug => {
              const bugProjectId = bug.projectId?._id || bug.projectId;
              return bugProjectId === project._id;
            });
            
            console.log(`Project ${project.name} (${project._id}): Fetched ${bugsList.length} bugs, filtered to ${filteredBugs.length} bugs`);
            
            return { projectId: project._id, bugs: filteredBugs };
          }
        } catch (error) {
          console.error(`Error fetching bugs for project ${project._id}:`, error);
        }
        return { projectId: project._id, bugs: [] };
      });

      const bugsResults = await Promise.all(bugsPromises);
      const bugsMap = {};
      bugsResults.forEach(result => {
        bugsMap[result.projectId] = result.bugs;
      });
      
      setProjectBugs(bugsMap);
    } catch (error) {
      console.error('Error fetching project bugs:', error);
    }
  };

  const handleBugEdit = (bug) => {
    setBugToEdit(bug);
    setShowEditModal(true);
  };

  const handleBugEditClose = () => {
    setShowEditModal(false);
    setBugToEdit(null);
  };

  const handleBugUpdated = (updatedBug) => {
    setProjectBugs(prev => {
      const newState = { ...prev };
      // Only update bugs in the project that the bug belongs to
      if (updatedBug.projectId) {
        const projectId = updatedBug.projectId._id || updatedBug.projectId;
        if (newState[projectId]) {
          newState[projectId] = newState[projectId].map(bug =>
            bug._id === updatedBug._id ? updatedBug : bug
          );
        }
      }
      return newState;
    });
    toast.success('Bug updated successfully');
  };

  const handleBugDelete = (bug) => {
    setBugToDelete(bug);
    setShowDeleteModal(true);
  };

  const handleBugDeleteConfirm = async () => {
    if (!bugToDelete) return;

    setDeletingBug(bugToDelete._id);
    try {
      const res = await apiService.deleteBug(bugToDelete._id);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to delete bug');
      } else {
        toast.success('Bug deleted successfully');
        setProjectBugs(prev => {
          const newState = { ...prev };
          // Only delete bugs from the project that the bug belongs to
          if (bugToDelete.projectId) {
            const projectId = bugToDelete.projectId._id || bugToDelete.projectId;
            if (newState[projectId]) {
              newState[projectId] = newState[projectId].filter(bug => bug._id !== bugToDelete._id);
            }
          }
          return newState;
        });
      }
    } catch (error) {
      console.error('Error deleting bug:', error);
      toast.error('Failed to delete bug');
    } finally {
      setDeletingBug(null);
      setShowDeleteModal(false);
      setBugToDelete(null);
    }
  };

  const handleBugDeleteCancel = () => {
    setShowDeleteModal(false);
    setBugToDelete(null);
  };



  const handleStatusUpdate = async (bugId, newStatus) => {
    try {
      const response = await apiService.updateBugStatus(bugId, newStatus);
      const data = await response.json();

      if (response.ok) {
        toast.success('Bug status updated successfully');
        setProjectBugs(prev => {
          const newState = { ...prev };
          // Find which project contains this bug and update only that project
          Object.keys(newState).forEach(projectId => {
            const bugIndex = newState[projectId].findIndex(bug => bug._id === bugId);
            if (bugIndex !== -1) {
              // Found the bug in this project, update only this project
              newState[projectId] = newState[projectId].map(bug =>
                bug._id === bugId ? { ...bug, status: newStatus } : bug
              );
            }
          });
          return newState;
        });
      } else {
        toast.error(data.message || 'Failed to update bug status');
      }
    } catch (error) {
      console.error('Error updating bug status:', error);
      toast.error('Failed to update bug status');
    }
  };


  if (!userInfo) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600 mt-1">View your assigned projects and manage bugs.</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div><span className="ml-2">Loading...</span></div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <div key={project._id} className="bg-white rounded-lg shadow p-6">
              <ProjectCard
                project={project}
                showEditDelete={false}
                showDetails={false}
                bugsCount={
                  projectBugs[project._id] 
                    ? projectBugs[project._id].filter(bug => {
                        // Ensure bug belongs to this specific project
                        const bugProjectId = bug.projectId?._id || bug.projectId;
                        return bugProjectId === project._id;
                      }).length 
                    : 0
                }
              />

              {/* Project Bugs Section */}
              {projectBugs[project._id] && projectBugs[project._id].length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Bugs</h3>
                  <div className="space-y-4">
                    {projectBugs[project._id]
                      .filter(bug => {
                        // Ensure bug belongs to this specific project
                        const bugProjectId = bug.projectId?._id || bug.projectId;
                        return bugProjectId === project._id;
                      })
                      .map(bug => (
                        userInfo.role === 'qa' ? (
                          <BugCard
                            key={bug._id}
                            bug={bug}
                            onEdit={handleBugEdit}
                            onDelete={handleBugDelete}
                            onStatusUpdate={handleStatusUpdate}
                          />
                        ) : userInfo.role === 'developer' ? (
                          <BugCard
                            key={bug._id}
                            bug={bug}
                            onEdit={null}
                            onDelete={null}
                            onStatusUpdate={handleStatusUpdate}
                          />
                        ) : (
                          <BugCard
                            key={bug._id}
                            bug={bug}
                            onEdit={handleBugEdit}
                            onDelete={handleBugDelete}
                            onStatusUpdate={handleStatusUpdate}
                          />
                        )
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {projects.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              <p className="text-lg">No projects assigned to you yet.</p>
              <p className="text-sm mt-2">Contact your manager to get assigned to projects.</p>
            </div>
          )}
        </div>
      )}

      {/* Bug Edit Modal */}
      <BugEditModal
        isOpen={showEditModal}
        onClose={handleBugEditClose}
        bug={bugToEdit}
        onBugUpdated={handleBugUpdated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleBugDeleteCancel}
        onConfirm={handleBugDeleteConfirm}
        title="Delete Bug"
        message={bugToDelete ? `Are you sure you want to delete "${bugToDelete.title}"? This action cannot be undone.` : ''}
        confirmText="Delete Bug"
        cancelText="Cancel"
        isLoading={deletingBug !== null}
      />


    </Layout>
  );
};

export default MyProjects;
