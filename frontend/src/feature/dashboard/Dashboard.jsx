import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../utils/userUtils";
import { toast } from 'react-toastify';
import Layout from "../../shared/Layout";
import ProfilePicture from "../../shared/ProfilePicture";

const DashboardPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const user = getUserInfo();
      if (user) {
        setUserInfo(user);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <ProfilePicture user={userInfo} size="xl" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {userInfo.firstname}!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Full Name:</span>
                    <p className="font-medium text-gray-900">{userInfo.firstname} {userInfo.lastname}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{userInfo.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <p className="font-medium text-gray-900 capitalize">{userInfo.role}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {userInfo.role === 'admin' ? 'Administrator' : 
                     userInfo.role === 'manager' ? 'Project Manager' :
                     userInfo.role === 'qa' ? 'Quality Assurance' : 'Developer'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900">Total Projects</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-900">Active Bugs</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-900">Pending Features</h3>
            <p className="text-2xl font-bold text-yellow-600">0</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-900">Resolved Issues</h3>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
        </div>

        {userInfo.role !== 'developer' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(userInfo.role === 'admin' || userInfo.role === 'manager') && (
                <>
                  <button 
                    onClick={() => navigate("/projects")}
                    className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    Create Project
                  </button>
                  <button 
                    onClick={() => navigate("/users")}
                    className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition"
                  >
                    Manage Users
                  </button>
                </>
              )}
              
              {userInfo.role === 'qa' && (
                <button 
                  onClick={() => navigate("/users")}
                  className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition"
                >
                  Manage Users
                </button>
              )}
              
              <button 
                onClick={() => navigate("/bugs")}
                className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition"
              >
                Create Bug/Feature
              </button>
            </div>
          </div>
        )}

        {(userInfo.role === 'admin' || userInfo.role === 'manager') && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">User Management</h4>
            <p className="text-sm text-blue-700">
              As an {userInfo.role}, you can create new user accounts and manage existing users through the "Manage Users" feature. 
              New users will be able to login with their credentials once created.
            </p>
          </div>
        )}

        {userInfo.role === 'qa' && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">User Management</h4>
            <p className="text-sm text-green-700">
              As a QA Engineer, you can view developer accounts through the "Manage Users" feature. 
              You can see developer information but cannot create, edit, or delete developer accounts.
            </p>
          </div>
        )}

        {userInfo.role === 'developer' && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Developer Dashboard</h4>
            <p className="text-sm text-gray-700">
              As a developer, you can view and update bug statuses assigned to you. 
              Use the navigation menu to access projects and bugs.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
