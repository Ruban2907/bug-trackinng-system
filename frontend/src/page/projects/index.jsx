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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  // Check user role and redirect if not admin/manager
  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
      // Redirect QA and developers to their my-projects page
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

      // Load all roles for dropdowns (manager/admin have access to dev and qa)
      const allUsersRes = await apiService.authenticatedRequest('/users');
      const allUsersData = await allUsersRes.json();
      if (!allUsersRes.ok) throw new Error(allUsersData.message || 'Failed to load users');

      setProjects(projectsData.projects || []);
      setUsers(allUsersData.users || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (formData) => {
    const res = await apiService.createProject(formData);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create project');
    toast.success('Project created successfully');
    await fetchData();
  };

  const handleUpdate = async (projectId, formData) => {
    const res = await apiService.updateProject(projectId, formData);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update project');
    toast.success('Project updated successfully');
    await fetchData();
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
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
    navigate(`/projects/${project._id}`);
  };

  // Show loading while checking user role
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
              <p className="text-gray-600 mt-1">Create and manage projects. Assign QA and developers optionally.</p>
            </div>
          </div>
          <button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
            New Project
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div><span className="ml-2">Loading...</span></div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} onEdit={(proj) => { setEditingProject(proj); setIsModalOpen(true); }} onDelete={handleDeleteClick} onShowDetails={handleShowDetails} />
          ))}
          {projects.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-gray-600">No projects yet.</div>
          )}
        </div>
      )}

      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={users}
        initialProject={editingProject}
        onSubmit={(formData) => editingProject ? handleUpdate(editingProject._id, formData) : handleCreate(formData)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={projectToDelete ? `Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone and will remove all project data including assignments.` : ''}
        confirmText="Delete Project"
        cancelText="Cancel"
        isLoading={deletingProject !== null}
      />
    </Layout>
  );
};

export default Projects;
