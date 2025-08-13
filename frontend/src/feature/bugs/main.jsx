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
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchProjects();
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo) {
      fetchBugs();
    }
  }, [userInfo, selectedProject]);

  // Debug effect to see when selectedProject changes
  useEffect(() => {
    console.log('selectedProject changed to:', selectedProject);
  }, [selectedProject]);

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
        // Extract data from new response format
        const projectsList = data.data || data.projects || [];
        console.log(`Loaded ${projectsList.length} projects for user role ${userInfo?.role}:`, projectsList.map(p => ({ id: p._id, name: p.name })));
        setProjects(projectsList);
        
        // Show helpful message for QA users with no projects
        if (userInfo?.role === 'qa' && projectsList.length === 0) {
          toast.info('No projects are currently assigned to you. Please contact your manager to get assigned to projects.');
        }
      } else {
        if (userInfo?.role === 'qa') {
          toast.error('Failed to load your assigned projects. Please try again or contact support.');
        }
      }
    } catch (error) {
      if (userInfo?.role === 'qa') {
        toast.error('Failed to load your assigned projects. Please try again.');
      }
    }
  };

  const fetchBugs = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching bugs for project: ${selectedProject || 'All Projects'}`);
      const response = await apiService.getBugs(selectedProject);
      const data = await response.json();

      if (response.ok) {
        // Extract data from new response format
        const bugsList = data.data || data.bugs || [];
        console.log(`Received ${bugsList.length} bugs for project: ${selectedProject || 'All Projects'}`);
        setBugs(bugsList);
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
        handleBugUpdated(data.data);
      } else {
        toast.error(data.message || 'Failed to update bug status');
      }
    } catch (error) {
      console.error('Error updating bug status:', error);
      toast.error('Failed to update bug status');
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
              <h1 className="text-2xl font-bold text-gray-900">Bugs & Features</h1>
              <p className="text-gray-600 mt-1">Track and manage bugs and feature requests across projects</p>
            </div>
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
            onClick={() => {
              setIsLoading(true);
              fetchBugs();
            }}
            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
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

          {/* Show helpful message for QA users with no projects */}
          {userInfo?.role === 'qa' && projects.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-blue-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">No Projects Assigned</h3>
              <p className="text-blue-700 mb-4">
                You don't have any projects assigned to you yet. This is why you can't see any bugs or create new ones.
              </p>
              <div className="text-sm text-blue-600">
                <p>To get started:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Contact your manager or admin to assign you to projects</li>
                  <li>• Once assigned, you'll be able to view project bugs and create new ones</li>
                  <li>• You can also report bugs through other channels in the meantime</li>
                </ul>
              </div>
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
          isOpen={showEditModal}
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
