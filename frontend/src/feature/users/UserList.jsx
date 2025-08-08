import React, { useState } from 'react';
import ProfilePicture from '../../shared/ProfilePicture';
import EditUserModal from './EditUserModal';
import ConfirmationModal from '../../shared/ConfirmationModal';
import { toast } from 'react-toastify';
import { apiService } from '../../services/api';

const UserList = ({ users, role, isLoading, onUserUpdated, onUserDeleted, currentUser }) => {
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setDeletingUser(userToDelete._id);
    try {
      const response = await apiService.authenticatedRequest(`/users/${userToDelete._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onUserDeleted(userToDelete._id);
        toast.success('User deleted successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeletingUser(null);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      manager: 'Manager',
      qa: 'QA Engineer',
      developer: 'Developer'
    };
    return roleNames[role] || role;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {getRoleDisplayName(role)} ({users.length})
        </h3>
      </div>

      {/* Table */}
      {users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ProfilePicture user={user} size="sm" className="mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'qa' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* QA can only view developers, not edit/delete them */}
                    {!(currentUser.role === 'qa' && user.role === 'developer') ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit user"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          disabled={deletingUser === user._id}
                          className={`transition-colors ${
                            deletingUser === user._id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title="Delete user"
                        >
                          {deletingUser === user._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">
            {role === 'manager' ? '👔' : role === 'qa' ? '🔍' : '💻'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {getRoleDisplayName(role)}s Found
          </h3>
          <p className="text-gray-600">
            There are no {getRoleDisplayName(role).toLowerCase()}s in the system yet.
          </p>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={onUserUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={userToDelete ? `Are you sure you want to delete ${userToDelete.firstname} ${userToDelete.lastname}? This action cannot be undone.` : ''}
        confirmText="Delete User"
        cancelText="Cancel"
        isLoading={deletingUser !== null}
      />
    </div>
  );
};

export default UserList;
