import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../shared/Layout';
import { apiService } from '../../../services/api';
import { toast } from 'react-toastify';
import { getProjectPictureUrl } from '../../../utils/imageUtils';
import BugEditModal from '../../../feature/bugs/BugEditModal';
import ConfirmationModal from '../../../shared/ConfirmationModal';
import BugCard from '../../../feature/bugs/BugCard';
import { getUserInfo } from '../../../utils/userUtils';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bugToEdit, setBugToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bugToDelete, setBugToDelete] = useState(null);
  const [deletingBug, setDeletingBug] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [bugToReassign, setBugToReassign] = useState(null);
  const [reassigningBug, setReassigningBug] = useState(null);

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchProjectBugs();
    }
  }, [id]);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const response = await apiService.getProjectById(id);
      const data = await response.json();

      if (response.ok) {
        setProject(data.project);
      } else {
        console.error('ProjectDetails: Failed to load project:', data.message);
        toast.error(data.message || 'Failed to load project details');
        navigate('/projects');
      }
    } catch (error) {
      console.error('ProjectDetails: Error fetching project details:', error);
      toast.error('Failed to load project details');
      navigate('/projects');
    }
  }, [id]);

  const fetchProjectBugs = useCallback(async () => {
    try {
      const response = await apiService.authenticatedRequest(`/bugs?projectId=${id}`);
      const data = await response.json();

      if (response.ok) {
        setBugs(data.bugs || []);
      } else {
        console.error('ProjectDetails: Failed to load bugs:', data.message);
        toast.error(data.message || 'Failed to load project bugs');
      }
    } catch (error) {
      console.error('ProjectDetails: Error fetching project bugs:', error);
      toast.error('Failed to load project bugs');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const handleBugEdit = (bug) => {
    setBugToEdit(bug);
    setShowEditModal(true);
  };

  const handleBugEditClose = () => {
    setShowEditModal(false);
    setBugToEdit(null);
  };

  const handleBugUpdated = (updatedBug) => {
    setBugs(prev => prev.map(bug => bug._id === updatedBug._id ? updatedBug : bug));
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
        setBugs(prev => prev.filter(bug => bug._id !== bugToDelete._id));
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

  const handleBugReassign = (bug) => {
    setBugToReassign(bug);
    setShowReassignModal(true);
  };

  const handleBugReassignConfirm = async (newAssignee) => {
    if (!bugToReassign) return;

    setReassigningBug(bugToReassign._id);
    try {
      const res = await apiService.reassignBug(bugToReassign._id, newAssignee);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to reassign bug');
      } else {
        toast.success('Bug reassigned successfully');
        setBugs(prev => prev.map(bug =>
          bug._id === bugToReassign._id ? { ...bug, assignedTo: newAssignee } : bug
        ));
        setShowReassignModal(false);
        setBugToReassign(null);
      }
    } catch (error) {
      console.error('Error reassigning bug:', error);
      toast.error('Failed to reassign bug');
    } finally {
      setReassigningBug(null);
    }
  };

  const handleBugReassignCancel = () => {
    setShowReassignModal(false);
    setBugToReassign(null);
  };

  const handleStatusUpdate = async (bugId, newStatus) => {
    try {
      const response = await apiService.updateBugStatus(bugId, newStatus);
      const data = await response.json();

      if (response.ok) {
        toast.success('Bug status updated successfully');
        setBugs(prev => prev.map(bug =>
          bug._id === bugId ? { ...bug, status: newStatus } : bug
        ));
      } else {
        toast.error(data.message || 'Failed to update bug status');
      }
    } catch (error) {
      console.error('Error updating bug status:', error);
      toast.error('Failed to update bug status');
    }
  };

  const getBugStats = () => {
    const total = bugs.length;
    const bugsCount = bugs.filter(bug => bug.type === 'bug').length;
    const featuresCount = bugs.filter(bug => bug.type === 'feature').length;
    const newCount = bugs.filter(bug => bug.status === 'new').length;
    const inProgressCount = bugs.filter(bug => bug.status === 'started').length;
    const resolvedCount = bugs.filter(bug => bug.status === 'resolved' || bug.status === 'completed').length;

    return { total, bugsCount, featuresCount, newCount, inProgressCount, resolvedCount };
  };

  if (!project || isLoading) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Loading project details...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = getBugStats();

  return (
    <Layout>
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/projects")}
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Projects</span>
            </button>
            <div className="text-right text-white">
              <p className="text-blue-100 text-sm">Project ID: {project._id}</p>
            </div>
          </div>
          <div className="mt-6">
            <h1 className="text-4xl font-bold text-white mb-2">{project.name}</h1>
            <p className="text-xl text-blue-100 max-w-3xl">{project.description}</p>
          </div>
        </div>
      </div>

      {/* Project Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bugs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.bugsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Features</p>
              <p className="text-2xl font-bold text-gray-900">{stats.featuresCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Project Picture and Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {project.picture ? (
              <div className="relative">
                <img
                  src={getProjectPictureUrl(project.picture)}
                  alt={project.name}
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">{project.name}</h3>
                  <p className="text-blue-200">Project Overview</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No project image</p>
                  <p className="text-gray-400 text-sm">Add a project image for better visual appeal</p>
                </div>
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 leading-relaxed">{project.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">Created By</h4>
                    <p className="text-gray-700 font-semibold">{project.createdBy?.firstname} {project.createdBy?.lastname}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">Created Date</h4>
                    <p className="text-gray-700 font-semibold">{new Date(project.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-6">
          {/* QA Engineers */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">QA Engineers</h3>
            </div>
            {project.qaAssigned && project.qaAssigned.length > 0 ? (
              <div className="space-y-3">
                {project.qaAssigned.map((qa, index) => (
                  <div key={qa._id || index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    {qa.picture ? (
                      <img
                        src={`data:${qa.picture.contentType};base64,${qa.picture.data}`}
                        alt={qa.firstname}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {qa.firstname?.charAt(0) || 'Q'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{qa.firstname} {qa.lastname}</p>
                      <p className="text-sm text-blue-600">QA Engineer</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-gray-500 text-sm">No QA engineers assigned</p>
              </div>
            )}
          </div>

          {/* Developers */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Developers</h3>
            </div>
            {project.developersAssigned && project.developersAssigned.length > 0 ? (
              <div className="space-y-3">
                {project.developersAssigned.map((dev, index) => (
                  <div key={dev._id || index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    {dev.picture ? (
                      <img
                        src={`data:${dev.picture.contentType};base64,${dev.picture.data}`}
                        alt={dev.firstname}
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {dev.firstname?.charAt(0) || 'D'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{dev.firstname} {dev.lastname}</p>
                      <p className="text-sm text-green-600">Developer</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <p className="text-gray-500 text-sm">No developers assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Bugs Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Bugs & Features</h2>
            <p className="text-gray-600 mt-1">Manage and track all project items</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedCount}</p>
            </div>
          </div>
        </div>

        {bugs.length > 0 ? (
          <div className="space-y-4">
            {bugs.map(bug => (
              <BugCard
                key={bug._id}
                bug={bug}
                onEdit={handleBugEdit}
                onDelete={handleBugDelete}
                onStatusUpdate={handleStatusUpdate}
                onReassign={handleBugReassign}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bugs or features yet</h3>
            <p className="text-gray-500">This project doesn't have any bugs or features yet. Start by creating the first one!</p>
          </div>
        )}
      </div>

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

      {/* Reassign Modal */}
      <ConfirmationModal
        isOpen={showReassignModal}
        onClose={handleBugReassignCancel}
        onConfirm={() => handleBugReassignConfirm(bugToReassign?.assignedTo?._id || '')}
        title="Reassign Bug"
        message={bugToReassign ? `Are you sure you want to reassign "${bugToReassign.title}"?` : ''}
        confirmText="Reassign"
        cancelText="Cancel"
        isLoading={reassigningBug !== null}
      />
    </Layout>
  );
};

export default ProjectDetails;
