import React, { useState, useEffect } from 'react';
import { bugApiService } from '../services/api';

import { projectApiService } from '../../projects/services/api';
import { toast } from 'react-toastify';
import { getUserInfo } from '../../../utils/userUtils';

const BugCreationFlow = ({ onClose, onBugCreated }) => {
  const [step, setStep] = useState('project-selection');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('bug'); // 'bug' or 'feature'
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      let projectsRes;

      if (userInfo?.role === 'admin' || userInfo?.role === 'manager') {
        projectsRes = await projectApiService.getProjects();
      } else {
        projectsRes = await projectApiService.getAssignedProjects();
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.data || data.projects || []);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setStep('bug-creation');
  };

  const handleBackToProjects = () => {
    setStep('project-selection');
    setSelectedProject(null);
    setTitle('');
    setType('bug');
    setDescription('');
    setDeadline('');
    setAssignedTo('');
    setScreenshot(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !type) {
      toast.error('Title and type are required');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', type);
      formData.append('description', description.trim());
      formData.append('projectId', selectedProject._id);

      if (deadline) {
        formData.append('deadline', deadline);
      }

      if (assignedTo) {
        formData.append('assignedTo', assignedTo);
      }

      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const response = await bugApiService.createBug(formData);
      const data = await response.json();

      if (response.ok) {
        toast.success('Bug/Feature created successfully!');
        onBugCreated(data.data);
        onClose();
      } else {
        toast.error(data.message || 'Failed to create bug/feature');
      }
    } catch (error) {
      console.error('Error creating bug:', error);
      toast.error('Failed to create bug/feature');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setScreenshot(file);
    }
  };

  if (step === 'project-selection') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Project</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Choose a project to create a bug or feature in. Only projects you have access to are shown.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                  <div
                    key={project._id}
                    onClick={() => handleProjectSelect(project)}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {project.name?.slice(0, 2)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-600">
                          {project.qaAssigned?.length || 0} QA, {project.developersAssigned?.length || 0} Devs
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {projects.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No projects available. Contact your manager to get assigned to projects.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create {type === 'bug' ? 'Bug' : 'Feature'}</h2>
              <p className="text-gray-600">Project: {selectedProject?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleBackToProjects}
            className="mb-4 flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Projects</span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${type} title`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Describe the ${type} in detail`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedProject?.developersAssigned?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Developer
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Auto-assign (first developer)</option>
                  {selectedProject.developersAssigned.map(dev => (
                    <option key={dev._id} value={dev._id}>
                      {dev.firstname} {dev.lastname} ({dev.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Screenshot (optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Supported formats: JPG, PNG, GIF</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : `Create ${type === 'bug' ? 'Bug' : 'Feature'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BugCreationFlow;
