import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../../utils/userUtils';
import { toast } from 'react-toastify';
import RoleSelector from './RoleSelector';
import UserList from './UserList';
import CreateUserModal from './CreateUserModal';
import { authApiService } from '../../login/services/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser] = useState(getUserInfo());

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'admin':
        return ['manager', 'qa', 'developer'];
      case 'manager':
        return ['qa', 'developer'];
      default:
        return [];
    }
  };

  const availableRoles = getAvailableRoles();

  // Fetch users for selected role
  const fetchUsers = async (role) => {
    if (!role) return;
    
    setIsLoading(true);
    try {
      const response = await authApiService.authenticatedRequest(`/users?role=${role}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        // Extract data from new response format
        const usersList = data.data || data.users || [];
        setUsers(usersList);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    fetchUsers(role);
  };

  // Handle user creation
  const handleUserCreated = (newUser) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
    setShowCreateModal(false);
    toast.success('User created successfully!');
  };

  // Handle user update
  const handleUserUpdated = (updatedUser) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === updatedUser._id ? updatedUser : user
      )
    );
    toast.success('User updated successfully!');
  };

  // Handle user deletion
  const handleUserDeleted = (userId) => {
    setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
    toast.success('User deleted successfully!');
  };

  // Check if current user can manage users
  if (!currentUser || !['admin', 'manager', 'qa'].includes(currentUser.role)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">
                Manage users in your organization
              </p>
            </div>
          </div>
          {selectedRole && (
            // Only admins and managers can create users
            ['admin', 'manager'].includes(currentUser.role) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select User Category</h2>
        <RoleSelector
          availableRoles={availableRoles}
          selectedRole={selectedRole}
          onRoleSelect={handleRoleSelect}
          currentUserRole={currentUser.role}
        />
      </div>

      {/* User List */}
      {selectedRole && (
        <div className="bg-white rounded-lg shadow">
          <UserList
            users={users}
            role={selectedRole}
            isLoading={isLoading}
            onUserUpdated={handleUserUpdated}
            onUserDeleted={handleUserDeleted}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          role={selectedRole}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};

export default UserManagement;
