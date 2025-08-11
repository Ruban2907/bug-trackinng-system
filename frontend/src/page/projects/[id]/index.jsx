import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../shared/Layout';
import { apiService } from '../../../services/api';
import { toast } from 'react-toastify';
import { getProfilePictureUrl, getProjectPictureUrl } from '../../../utils/imageUtils';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.authenticatedRequest(`/projects/${id}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load project details');
      }
      
      setProject(data.project);
    } catch (err) {
      toast.error(err.message);
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading project details...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-600">
            <p>Project not found</p>
            <button 
              onClick={() => navigate('/projects')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const pictureUrl = getProjectPictureUrl(project.picture);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/projects")}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Projects</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">Project Details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Project Info */}
          <div className="lg:col-span-2 space-y-6">
                         {/* Project Picture */}
             <div className="bg-white rounded-lg shadow p-6">
               <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Picture</h2>
               <div className="flex justify-center">
                 {pictureUrl ? (
                   <div className="relative">
                     <img 
                       src={pictureUrl} 
                       alt={project.name} 
                       className="w-64 h-64 object-cover rounded-lg shadow-md"
                       onLoad={() => console.log('Image loaded successfully')}
                       onError={(e) => {
                         console.error('Image failed to load:', e);
                         console.error('Image src:', e.target.src);
                         e.target.style.display = 'none';
                         e.target.nextSibling.style.display = 'flex';
                       }}
                     />
                     <div className="w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md flex items-center justify-center absolute top-0 left-0" style={{display: 'none'}}>
                       <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center">
                         <span className="text-white font-bold text-4xl">
                           {project.name?.slice(0,2)?.toUpperCase()}
                         </span>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md flex items-center justify-center">
                     <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center">
                       <span className="text-white font-bold text-4xl">
                         {project.name?.slice(0,2)?.toUpperCase()}
                       </span>
                     </div>
                   </div>
                 )}
               </div>
               <div className="mt-2 text-center text-sm text-gray-500">
                 {pictureUrl ? (
                   <>
                     <p>Picture loaded successfully</p>
                     <p className="text-xs break-all">URL: {pictureUrl.substring(0, 100)}...</p>
                   </>
                 ) : (
                   <p>No picture available</p>
                 )}
               </div>
             </div>

            {/* Project Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              {project.description ? (
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </div>

            {/* Project Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                   <label className="block text-sm font-medium text-gray-600">Created By</label>
                   <div className="flex items-center space-x-2 mt-1">
                     {project.createdBy?.picture?.data ? (
                       <img 
                         src={`data:${project.createdBy.picture.contentType};base64,${project.createdBy.picture.data}`}
                         alt={`${project.createdBy.firstname} ${project.createdBy.lastname}`}
                         className="w-6 h-6 rounded-full object-cover"
                       />
                     ) : (
                       <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                         <span className="text-white font-semibold text-xs">
                           {project.createdBy?.firstname?.slice(0,1)}{project.createdBy?.lastname?.slice(0,1)}
                         </span>
                       </div>
                     )}
                     <p className="text-gray-900">
                       {project.createdBy?.firstname} {project.createdBy?.lastname}
                     </p>
                   </div>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created On</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Project ID</label>
                  <p className="text-gray-900 mt-1 font-mono text-sm">{project._id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Assignments */}
          <div className="space-y-6">
            {/* QA Assigned */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">QA Engineers Assigned</h2>
              {project.qaAssigned && project.qaAssigned.length > 0 ? (
                <div className="space-y-3">
                                     {project.qaAssigned.map(user => (
                     <div key={user._id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                       {user.picture?.data ? (
                         <img 
                           src={`data:${user.picture.contentType};base64,${user.picture.data}`}
                           alt={`${user.firstname} ${user.lastname}`}
                           className="w-10 h-10 rounded-full object-cover"
                         />
                       ) : (
                         <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                           <span className="text-white font-semibold text-sm">
                             {user.firstname?.slice(0,1)}{user.lastname?.slice(0,1)}
                           </span>
                         </div>
                       )}
                       <div>
                         <p className="font-medium text-gray-900">{user.firstname} {user.lastname}</p>
                         <p className="text-sm text-gray-600">{user.email}</p>
                       </div>
                     </div>
                   ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No QA engineers assigned</p>
              )}
            </div>

            {/* Developers Assigned */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Developers Assigned</h2>
              {project.developersAssigned && project.developersAssigned.length > 0 ? (
                <div className="space-y-3">
                                     {project.developersAssigned.map(user => (
                     <div key={user._id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                       {user.picture?.data ? (
                         <img 
                           src={`data:${user.picture.contentType};base64,${user.picture.data}`}
                           alt={`${user.firstname} ${user.lastname}`}
                           className="w-10 h-10 rounded-full object-cover"
                         />
                       ) : (
                         <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                           <span className="text-white font-semibold text-sm">
                             {user.firstname?.slice(0,1)}{user.lastname?.slice(0,1)}
                           </span>
                         </div>
                       )}
                       <div>
                         <p className="font-medium text-gray-900">{user.firstname} {user.lastname}</p>
                         <p className="text-sm text-gray-600">{user.email}</p>
                       </div>
                     </div>
                   ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No developers assigned</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">QA Engineers</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    {project.qaAssigned?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Developers</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    {project.developersAssigned?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Team</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                    {(project.qaAssigned?.length || 0) + (project.developersAssigned?.length || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetails;
