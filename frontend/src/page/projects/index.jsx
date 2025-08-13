import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
      if (user.role === 'qa' || user.role === 'developer') {
        navigate('/my-projects', { replace: true });
        return;
      }
    }
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, usersRes] = await Promise.all([
        apiService.getProjects(),
        apiService.authenticatedRequest('/users?role=developer')
      ]);

      const projectsData = await projectsRes.json();
      const usersData = await usersRes.json();

      if (!projectsRes.ok) throw new Error(projectsData.message || 'Failed to load projects');
      if (!usersRes.ok) throw new Error(usersData.message || 'Failed to load users');

      const allUsersRes = await apiService.authenticatedRequest('/users');
      const allUsersData = await allUsersRes.json();
      if (!allUsersRes.ok) throw new Error(allUsersData.message || 'Failed to load users');

      // Extract data from new response format
      const projectsList = projectsData.data || projectsData.projects || [];
      const allUsersList = allUsersData.data || allUsersData.users || [];
      
      setProjects(projectsList);
      setUsers(allUsersList);

      await fetchProjectBugs(projectsList);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error(err.message || 'Failed to load data. Please refresh the page.');
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  }, [editingProject]);

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

  const qaUsers = useMemo(() => users.filter(user => user.role === 'qa'), [users]);
  const developerUsers = useMemo(() => users.filter(user => user.role === 'developer'), [users]);

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
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">Manage your projects and assign team members.</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
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
              bugsCount={projectBugs[project._id]?.length || 0}
            />
          ))}

          {projects.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow p-6 text-center text-gray-600">
              <p className="text-lg">No projects found.</p>
              <p className="text-sm mt-2">Create your first project to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Project Modal */}
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
