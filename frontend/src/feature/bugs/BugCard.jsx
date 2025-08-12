import React, { useState } from 'react';
import { getUserInfo } from '../../utils/userUtils';

const BugCard = ({ bug, onEdit, onDelete, onStatusUpdate, onReassign }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newAssignee, setNewAssignee] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const userInfo = getUserInfo();
  const canEdit = userInfo && (userInfo.role === 'admin' || userInfo.role === 'manager' || userInfo.role === 'qa');
  const canDelete = userInfo && (userInfo.role === 'admin' || userInfo.role === 'manager' || userInfo.role === 'qa');
  const canUpdateStatus = userInfo && (userInfo.role === 'admin' || userInfo.role === 'manager' || userInfo.role === 'qa' || userInfo.role === 'developer');
  const canReassign = userInfo && (userInfo.role === 'admin' || userInfo.role === 'manager');
  const canReassignForUser = canReassign && userInfo.role !== 'developer';

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'started': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    return type === 'bug' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800';
  };

  const handleStatusUpdate = async (newStatus) => {
    if (onStatusUpdate) {
      await onStatusUpdate(bug._id, newStatus);
    }
  };

  const handleReassign = async () => {
    if (!newAssignee) return;

    setIsUpdating(true);
    try {
      if (onReassign) {
        await onReassign(bug._id, newAssignee);
        setShowReassignModal(false);
        setNewAssignee('');
      }
    } catch (error) {
      console.error('Error reassigning bug:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(bug.type)}`}>
                  {bug.type === 'bug' ? '🐛 Bug' : '✨ Feature'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                  {bug.status}
                </span>
                {userInfo.role === 'developer' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    👨‍💻 Dev
                  </span>
                )}

              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{bug.title}</h3>
              <p className="text-sm text-gray-600">
                Project: {bug.projectId?.name || 'Unknown Project'}
              </p>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className={`w-5 h-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
              {/* Left Column - Text Data */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {bug.description || 'No description provided'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Created by:</span>
                      <span className="ml-2 text-gray-900">
                        {bug.createdBy?.firstname} {bug.createdBy?.lastname}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="ml-2 text-gray-900">
                        {bug.assignedTo?.firstname} {bug.assignedTo?.lastname}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {formatDate(bug.createdAt)}
                      </span>
                    </div>
                    {bug.deadline && (
                      <div>
                        <span className="text-gray-600">Deadline:</span>
                        <span className="ml-2 text-gray-900">
                          {formatDate(bug.deadline)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Screenshot */}
              {bug.screenshot && bug.screenshot.data ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Screenshot</h4>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <img
                      src={`data:${bug.screenshot.contentType};base64,${bug.screenshot.data}`}
                      alt="Bug screenshot"
                      className="w-full h-auto rounded-md object-cover max-h-80"
                      onError={(e) => {
                        console.error('Error loading screenshot:', e);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Screenshot</h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No screenshot available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              {/* Developer Permission Notice */}
              {userInfo.role === 'developer' && (
                <div className="w-full mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Developer Mode: You can only update bug status</span>
                  </div>
                </div>
              )}

              {/* Status Update */}
              {canUpdateStatus && (
                <select
                  value={bug.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="started">Started</option>
                  {bug.type === 'bug' ? (
                    <>
                      <option value="resolved">Resolved</option>
                    </>
                  ) : (
                    <>
                      <option value="completed">Completed</option>
                    </>
                  )}
                </select>
              )}

              {/* Reassign Button */}
              {canReassignForUser && (
                <button
                  onClick={() => setShowReassignModal(true)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Reassign
                </button>
              )}

              {/* Edit Button */}
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(bug)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  Edit
                </button>
              )}

              {/* Delete Button */}
              {canDelete && onDelete && (
                <button
                  onClick={() => onDelete(bug)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reassign Bug</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Developer
                </label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select developer</option>
                  {bug.projectId?.developersAssigned?.map(dev => (
                    <option key={dev._id} value={dev._id}>
                      {dev.firstname} {dev.lastname} ({dev.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassign}
                  disabled={!newAssignee || isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Reassigning...' : 'Reassign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BugCard;
