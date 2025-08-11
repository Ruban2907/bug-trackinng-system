import React, { useState, useEffect } from 'react';
import Layout from '../../shared/Layout';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';
import { getUserInfo } from '../../utils/userUtils';
import BugCreationFlow from '../../feature/bugs/BugCreationFlow';
import BugCard from '../../feature/bugs/BugCard';
import BugEditModal from '../../feature/bugs/BugEditModal';
import ConfirmationModal from '../../shared/ConfirmationModal';

const Bugs = () => {
  const [bugs, setBugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bugToEdit, setBugToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bugToDelete, setBugToDelete] = useState(null);
  const [deletingBug, setDeletingBug] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
      fetchProjects();
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchBugs();
    }
  }, [userInfo, selectedProject]);

  const fetchProjects = async () => {
    try {
      let projectsRes;
      if (userInfo?.role === 'admin' || userInfo?.role === 'manager') {
        projectsRes = await apiService.getProjects();
      } else {
        projectsRes = await apiService.getAssignedProjects();
      }
      
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchBugs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getBugs(selectedProject);
      const data = await response.json();
      
      if (response.ok) {
        setBugs(data.bugs || []);
      } else {
        toast.error(data.message || 'Failed to load bugs');
      }
    } catch (error) {
      console.error('Error fetching bugs:', error);
      toast.error('Failed to load bugs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBugCreated = (newBug) => {
    setBugs(prev => [newBug, ...prev]);
  };

  const handleBugDeleted = (bugId) => {
    setBugs(prev => prev.filter(bug => bug._id !== bugId));
  };

  const handleBugUpdated = (updatedBug) => {
    setBugs(prev => prev.map(bug => bug._id === updatedBug._id ? updatedBug : bug));
  };

  const handleEditClick = (bug) => {
    setBugToEdit(bug);
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setBugToEdit(null);
  };

  const handleStatusUpdate = async (bugId, newStatus) => {
    try {
      const response = await apiService.updateBugStatus(bugId, newStatus);
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Bug status updated successfully');
        handleBugUpdated(data.bug);
      } else {
        toast.error(data.message || 'Failed to update bug status');
      }
    } catch (error) {
      console.error('Error updating bug status:', error);
      toast.error('Failed to update bug status');
    }
  };

  const handleReassign = async (bugId, newAssignee) => {
    try {
      const response = await apiService.reassignBug(bugId, newAssignee);
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Bug reassigned successfully');
        handleBugUpdated(data.bug);
      } else {
        toast.error(data.message || 'Failed to reassign bug');
      }
    } catch (error) {
      console.error('Error reassigning bug:', error);
      toast.error('Failed to reassign bug');
    }
  };

  const handleDeleteClick = (bug) => {
    setBugToDelete(bug);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bugToDelete) return;
    
    setDeletingBug(bugToDelete._id);
    try {
      const response = await apiService.deleteBug(bugToDelete._id);
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Bug deleted successfully');
        handleBugDeleted(bugToDelete._id);
      } else {
        toast.error(data.message || 'Failed to delete bug');
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

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBugToDelete(null);
  };

  const canCreateBug = userInfo && (userInfo.role === 'admin' || userInfo.role === 'manager' || userInfo.role === 'qa');

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bugs & Features</h1>
            <p className="text-gray-600 mt-1">Track and manage bugs and feature requests across projects</p>
          </div>
          {canCreateBug && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Bug/Feature
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Project:</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchBugs}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Bugs List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Loading bugs...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bugs.map(bug => (
            <BugCard
              key={bug._id}
              bug={bug}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onStatusUpdate={handleStatusUpdate}
              onReassign={handleReassign}
            />
          ))}
          
          {bugs.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">🐛</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bugs Found</h3>
              <p className="text-gray-600">
                {selectedProject 
                  ? 'No bugs found in the selected project.'
                  : 'No bugs found in your accessible projects.'
                }
              </p>
              {canCreateBug && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Bug/Feature
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Bug Modal */}
      {showCreateModal && (
        <BugCreationFlow
          onClose={() => setShowCreateModal(false)}
          onBugCreated={handleBugCreated}
        />
      )}

      {/* Edit Bug Modal */}
      {showEditModal && bugToEdit && (
        <BugEditModal
          bug={bugToEdit}
          onClose={handleEditClose}
          onBugUpdated={handleBugUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Bug/Feature"
        message={bugToDelete ? `Are you sure you want to delete "${bugToDelete.title}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deletingBug !== null}
      />
    </Layout>
  );
};

export default Bugs;
