import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Layout from '../../shared/Layout';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';
import ProjectCard from '../../feature/projects/ProjectCard';
import ProjectFormModal from '../../feature/projects/ProjectFormModal';
import ConfirmationModal from '../../shared/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../utils/userUtils';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectBugs, setProjectBugs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  // Filter users by role - only for admin/manager users
  const qaUsers = useMemo(() => {
    if (userInfo?.role === 'admin' || userInfo?.role === 'manager') {
      return users.filter(user => user.role === 'qa');
    }
    return [];
  }, [users, userInfo?.role]);
  
  const developerUsers = useMemo(() => {
    if (userInfo?.role === 'admin' || userInfo?.role === 'manager') {
      return users.filter(user => user.role === 'developer');
    }
    return [];
  }, [users, userInfo?.role]);

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!userInfo || !userInfo.role) {
      return;
    }
    
    setIsLoading(true);
    try {
      let projectsRes;
      if (userInfo.role === 'admin' || userInfo.role === 'manager') {
        // Admin and managers can see all projects
        projectsRes = await apiService.getProjects();
        
        // Only fetch users for admin/manager users who need to assign users to projects
        const [usersRes] = await Promise.all([
          apiService.authenticatedRequest('/users?role=developer')
        ]);

        const usersData = await usersRes.json();
        if (!usersRes.ok) throw new Error(usersData.message || 'Failed to load users');

        const allUsersRes = await apiService.authenticatedRequest('/users');
        const allUsersData = await allUsersRes.json();
        if (!allUsersRes.ok) throw new Error(allUsersData.message || 'Failed to load users');

        // Extract data from new response format
        const allUsersList = allUsersData.data || allUsersData.users || [];
        setUsers(allUsersList);
      } else if (userInfo.role === 'qa' || userInfo.role === 'developer') {
        // QA and developers should see only their assigned projects
        projectsRes = await apiService.getAssignedProjects();
        
        // QA and developer users don't need to fetch all users
        setUsers([]);
      } else {
        return;
      }

      const projectsData = await projectsRes.json();
      if (!projectsRes.ok) throw new Error(projectsData.message || 'Failed to load projects');

      // Extract data from new response format
      const projectsList = projectsData.data || projectsData.projects || [];
      setProjects(projectsList);

      await fetchProjectBugs(projectsList);
    } catch (err) {
      console.error('Projects page: Error fetching data:', err);
      toast.error(err.message || 'Failed to load data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo && userInfo.role) {
      // Add a small delay to ensure userInfo is properly set
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [userInfo, fetchData]);

  const fetchProjectBugs = async (projectsList) => {
    try {
      const bugsPromises = projectsList.map(async (project) => {
        try {
          const bugsRes = await apiService.authenticatedRequest(`/bugs?projectId=${project._id}`);
          if (bugsRes.ok) {
            const bugsData = await bugsRes.json();
            // Extract data from new response format
            const bugsList = bugsData.data || bugsData.bugs || [];
            return { projectId: project._id, bugs: bugsList };
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

  const handleCreateProject = async (formData) => {
    try {
      if (!formData) {
        toast.error('Form data is required');
        return;
      }
      const res = await apiService.createProject(formData);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to create project');
      } else {
        toast.success('Project created successfully!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleUpdateProject = async (projectId, formData) => {
    try {
      if (!projectId) {
        toast.error('Project ID is required');
        return;
      }
      if (!formData) {
        toast.error('Form data is required');
        return;
      }
      const res = await apiService.updateProject(projectId, formData);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to update project');
      } else {
        toast.success('Project updated successfully!');
        setEditingProject(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
    }
  };

  const handleDeleteClick = (project) => {
    if (!project || !project._id) {
      toast.error('Invalid project data');
      return;
    }
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || !projectToDelete._id) {
      toast.error('Invalid project data');
      return;
    }

    setDeletingProject(projectToDelete._id);
    try {
      const res = await apiService.deleteProject(projectToDelete._id);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to delete project');
      } else {
        toast.success('Project deleted successfully');
        setProjects(prev => prev.filter(p => p._id !== projectToDelete._id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeletingProject(null);
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleShowDetails = (project) => {
    try {
      if (!project || !project._id) {
        toast.error('Invalid project data');
        return;
      }
      navigate(`/projects/${project._id}`);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate to project details');
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
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userInfo?.role === 'admin' || userInfo?.role === 'manager' ? 'Projects' : 'My Assigned Projects'}
              </h1>
              <p className="text-gray-600 mt-1">
                {userInfo?.role === 'admin' || userInfo?.role === 'manager' 
                  ? 'Manage your projects and assign team members.'
                  : 'View your assigned projects and their details.'
                }
              </p>
            </div>
          </div>
          {(userInfo?.role === 'admin' || userInfo?.role === 'manager') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div><span className="ml-2">Loading...</span></div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.filter(project => project && project._id).map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={(project) => {
                if (!project || !project._id) {
                  toast.error('Invalid project data');
                  return;
                }
                setEditingProject(project);
              }}
              onDelete={() => handleDeleteClick(project)}
              onShowDetails={() => {
                if (!project || !project._id) {
                  toast.error('Invalid project data');
                  return;
                }
                handleShowDetails(project);
              }}
              showEditDelete={userInfo?.role === 'admin' || userInfo?.role === 'manager'}
              bugsCount={projectBugs[project._id]?.length || 0}
            />
          ))}

          {projects.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow p-6 text-center text-gray-600">
              <p className="text-lg">
                {userInfo?.role === 'admin' || userInfo?.role === 'manager' 
                  ? 'No projects found.'
                  : 'No projects assigned to you yet.'
                }
              </p>
              <p className="text-sm mt-2">
                {userInfo?.role === 'admin' || userInfo?.role === 'manager'
                  ? 'Create your first project to get started.'
                  : 'Contact your manager to get assigned to projects.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Project Modal - Only for admin/manager users */}
      {(userInfo?.role === 'admin' || userInfo?.role === 'manager') && (
        <ProjectFormModal
          isOpen={isModalOpen || !!editingProject}
          onClose={() => {
            try {
              setIsModalOpen(false);
              setEditingProject(null);
            } catch (error) {
              console.error('Error closing modal:', error);
            }
          }}
          onSubmit={editingProject ?
            (formData) => {
              try {
                if (!editingProject || !editingProject._id) {
                  toast.error('Invalid project data');
                  return;
                }
                handleUpdateProject(editingProject._id, formData);
              } catch (error) {
                console.error('Error submitting update:', error);
                toast.error('Failed to submit update');
              }
            } :
            (formData) => {
              try {
                handleCreateProject(formData);
              } catch (error) {
                console.error('Error submitting create:', error);
                toast.error('Failed to submit create');
              }
            }
          }
          project={editingProject}
          qaUsers={qaUsers}
          developerUsers={developerUsers}
        />
      )}



      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={projectToDelete ? `Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Delete Project"
        cancelText="Cancel"
        isLoading={deletingProject !== null}
      />
    </Layout>
  );
};

export default Projects;
