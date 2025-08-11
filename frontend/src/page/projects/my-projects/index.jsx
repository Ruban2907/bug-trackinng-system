import React, { useEffect, useState } from 'react';
import Layout from '../../../shared/Layout';
import { apiService } from '../../../services/api';
import { toast } from 'react-toastify';
import ProjectCard from '../../../feature/projects/ProjectCard';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../../utils/userUtils';

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserInfo();
    if (user) {
      setUserInfo(user);
    }
  }, []);

    const fetchMyProjects = async () => {
    if (!userInfo) return;
    
    setIsLoading(true);
    try {
      const projectsRes = await apiService.authenticatedRequest('/assigned-projects');
      const projectsData = await projectsRes.json();
      
      if (!projectsRes.ok) {
        throw new Error(projectsData.message || 'Failed to load projects');
      }

      setProjects(projectsData.projects || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchMyProjects();
    }
  }, [userInfo]);

  const handleShowDetails = (project) => {
    navigate(`/projects/${project._id}`);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600 mt-1">
                {userInfo.role === 'qa' 
                  ? 'Projects where you are assigned as QA Engineer'
                  : 'Projects where you are assigned as Developer'
                }
              </p>
            </div>
          </div>
          <button 
            onClick={fetchMyProjects}
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Loading your projects...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                     {projects.map(project => (
             <ProjectCard 
               key={project._id} 
               project={project} 
               onShowDetails={handleShowDetails}
               showEditDelete={false} // Don't show edit/delete buttons for assigned users
               showDetails={false} // Don't show details button for assigned users
             />
           ))}
          {projects.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">
                {userInfo.role === 'qa' ? '🔍' : '💻'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Projects Assigned
              </h3>
              <p className="text-gray-600">
                {userInfo.role === 'qa' 
                  ? 'You are not currently assigned to any projects as a QA Engineer.'
                  : 'You are not currently assigned to any projects as a Developer.'
                }
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Contact your project manager to get assigned to projects.
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default MyProjects;
