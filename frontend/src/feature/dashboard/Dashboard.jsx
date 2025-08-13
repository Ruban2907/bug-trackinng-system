import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../utils/userUtils";
import { toast } from 'react-toastify';
import Layout from "../../shared/Layout";
import ProfilePicture from "../../shared/ProfilePicture";
import { apiService } from "../../services/api";

const DashboardPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeBugs: 0,
    pendingFeatures: 0,
    resolvedIssues: 0
  });
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      if (userInfo && (userInfo.role === 'admin' || userInfo.role === 'manager')) {
        const projectsRes = await apiService.authenticatedRequest('/projects');
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          // Extract data from new response format
          const projectsList = projectsData.data || projectsData.projects || [];
          setDashboardStats(prev => ({
            ...prev,
            totalProjects: projectsList.length || 0
          }));
        }
      }

      if (userInfo && (userInfo.role === 'qa' || userInfo.role === 'developer')) {
        const projectsRes = await apiService.authenticatedRequest('/assigned-projects');
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          // Extract data from new response format
          const projectsList = projectsData.data || projectsData.projects || [];

          setDashboardStats(prev => ({
            ...prev,
            totalProjects: projectsList.length
          }));
        }
      }

      let bugs = [];

      if (userInfo.role === 'admin' || userInfo.role === 'manager') {
        const bugsRes = await apiService.authenticatedRequest('/bugs');
        if (bugsRes.ok) {
          const bugsData = await bugsRes.json();
          // Extract data from new response format
          bugs = bugsData.data || bugsData.bugs || [];
        }
      } else {
        const bugsRes = await apiService.authenticatedRequest('/bugs');
        if (bugsRes.ok) {
          const bugsData = await bugsRes.json();
          // Extract data from new response format
          bugs = bugsData.data || bugsData.bugs || [];
        }
      }

      const activeBugs = bugs.filter(bug => bug.status === 'new' || bug.status === 'started').length;
      const resolvedIssues = bugs.filter(bug => bug.status === 'resolved' || bug.status === 'completed').length;
      const pendingFeatures = bugs.filter(bug => bug.type === 'feature' && bug.status !== 'completed').length;

      setDashboardStats(prev => ({
        ...prev,
        activeBugs,
        pendingFeatures,
        resolvedIssues
      }));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchDashboardStats();
    }
  }, [userInfo]);

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Loading dashboard...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchDashboardStats();
            }}
            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

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
          {(userInfo.role === 'admin' || userInfo.role === 'manager') ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900">Total Projects</h3>
              <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalProjects}</p>
              <p className="text-xs text-blue-600 mt-1">All projects in system</p>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900">My Projects</h3>
              <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalProjects}</p>
              <p className="text-xs text-blue-600 mt-1">Projects assigned to you</p>
            </div>
          )}

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-900">
              {userInfo.role === 'developer' ? 'My Active Bugs' : 'Active Bugs'}
            </h3>
            <p className="text-2xl font-bold text-green-600">{dashboardStats.activeBugs}</p>
            <p className="text-xs text-green-600 mt-1">
              {userInfo.role === 'developer' ? 'Bugs assigned to you' : 'New & started bugs'}
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-900">
              {userInfo.role === 'developer' ? 'My Pending Features' : 'Pending Features'}
            </h3>
            <p className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingFeatures}</p>
            <p className="text-xs text-yellow-600 mt-1">
              {userInfo.role === 'developer' ? 'Features assigned to you' : 'Unresolved feature requests'}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-900">
              {userInfo.role === 'developer' ? 'My Resolved Issues' : 'Resolved Issues'}
            </h3>
            <p className="text-2xl font-bold text-purple-600">{dashboardStats.resolvedIssues}</p>
            <p className="text-xs text-purple-600 mt-1">
              {userInfo.role === 'developer' ? 'Issues you resolved' : 'Completed bugs & features'}
            </p>
          </div>
        </div>

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
                onClick={() => navigate("/my-projects")}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition"
              >
                Show My Projects
              </button>
            )}

            {userInfo.role === 'developer' && (
              <button
                onClick={() => navigate("/my-projects")}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition"
              >
                Show My Projects
              </button>
            )}

            <button
              onClick={() => navigate("/bugs")}
              className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition"
            >
              {userInfo.role === 'developer' ? 'Bug/Feature' : 'Create Bug/Feature'}
            </button>
          </div>
        </div>

        {/* Role-based Actions Summary */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions You Can Perform</h3>

          {userInfo.role === 'admin' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">🔧 System Management</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create, edit, and delete projects</li>
                    <li>• Assign QA engineers and developers to projects</li>
                    <li>• Manage all user accounts (create, edit, delete)</li>
                    <li>• Access all projects and bugs in the system</li>
                    <li>• Full control over user roles and permissions</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">🐛 Bug & Feature Management</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create, edit, and delete bugs/features</li>
                    <li>• Update bug statuses</li>
                    <li>• View all project screenshots and details</li>
                    <li>• Monitor overall system performance</li>
                    <li>• Access comprehensive project analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {userInfo.role === 'manager' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">📋 Project Management</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create, edit, and delete projects</li>
                    <li>• Assign QA engineers and developers to projects</li>
                    <li>• Manage project assignments and team composition</li>
                    <li>• View all projects and their current status</li>
                    <li>• Monitor project progress and team performance</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">🐛 Bug & Feature Management</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create, edit, and delete bugs/features</li>
                    <li>• Update bug statuses</li>
                    <li>• View all project screenshots and details</li>
                    <li>• Track bug resolution progress</li>
                    <li>• Manage feature development workflow</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {userInfo.role === 'qa' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">🔍 Quality Assurance</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• View projects assigned to you</li>
                    <li>• Create and manage bugs/features</li>
                    <li>• Update bug statuses and descriptions</li>
                    <li>• Upload and manage bug screenshots</li>
                    <li>• Track bug resolution progress</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Project Monitoring</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Access "My Projects" to see assigned work</li>
                    <li>• View detailed project information</li>
                    <li>• Monitor bug counts and project status</li>
                    <li>• Collaborate with developers on bug fixes</li>
                    <li>• Manage feature request workflows</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {userInfo.role === 'developer' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">💻 Development Work</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• View projects assigned to you</li>
                    <li>• Update bug and feature statuses</li>
                    <li>• Track your assigned work progress</li>
                    <li>• View bug details and screenshots</li>
                    <li>• Monitor project deadlines and priorities</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">📈 Progress Tracking</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Access "My Projects" for assigned work</li>
                    <li>• Update bug status: New → Started → Resolved</li>
                    <li>• Update feature status: New → Started → Completed</li>
                    <li>• View project team composition</li>
                    <li>• Track your development metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
