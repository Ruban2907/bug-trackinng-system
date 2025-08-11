import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';

const BugEditModal = ({ bug, onClose, onBugUpdated, isOpen }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'bug',
    description: '',
    deadline: '',
    assignedTo: '',
    status: 'new'
  });
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [developers, setDevelopers] = useState([]);

  useEffect(() => {
    if (bug) {
      setFormData({
        title: bug.title || '',
        type: bug.type || 'bug',
        description: bug.description || '',
        deadline: bug.deadline ? new Date(bug.deadline).toISOString().slice(0, 16) : '',
        assignedTo: bug.assignedTo?._id || '',
        status: bug.status || 'new'
      });
      fetchProjectDevelopers();
    }
  }, [bug]);

  const fetchProjectDevelopers = async () => {
    try {
      const response = await apiService.authenticatedRequest(`/projects/${bug.projectId._id}`);
      if (response.ok) {
        const data = await response.json();
        setDevelopers(data.project.developersAssigned || []);
      }
    } catch (error) {
      console.error('Error fetching project developers:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.type) {
      toast.error('Title and type are required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('status', formData.status);
      
      if (formData.deadline) {
        formDataToSend.append('deadline', formData.deadline);
      }
      
      if (formData.assignedTo) {
        formDataToSend.append('assignedTo', formData.assignedTo);
      }
      
      if (screenshot) {
        formDataToSend.append('screenshot', screenshot);
      }

      const response = await apiService.updateBug(bug._id, formDataToSend);
      const data = await response.json();

      if (response.ok) {
        toast.success('Bug updated successfully!');
        onBugUpdated(data.bug);
        onClose();
      } else {
        toast.error(data.message || 'Failed to update bug');
      }
    } catch (error) {
      console.error('Error updating bug:', error);
      toast.error('Failed to update bug');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    // Note: To actually remove the screenshot from the backend, you'd need to send a special flag
    // For now, we'll just clear the local state
  };

  if (!isOpen || !bug) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Bug</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
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
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${formData.type} title`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                {formData.type === 'bug' ? (
                  <>
                    <option value="started">Started</option>
                    <option value="resolved">Resolved</option>
                  </>
                ) : (
                  <>
                    <option value="started">Started</option>
                    <option value="completed">Completed</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Describe the ${formData.type} in detail`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {developers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Developer
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select developer</option>
                  {developers.map(dev => (
                    <option key={dev._id} value={dev._id}>
                      {dev.firstname} {dev.lastname} ({dev.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Screenshot
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Supported formats: JPG, PNG, GIF</p>
              
              {bug.screenshot && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Current screenshot:</p>
                  <img
                    src={`data:${bug.screenshot.contentType};base64,${bug.screenshot.data}`}
                    alt="Current screenshot"
                    className="w-32 h-32 object-cover rounded border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove current screenshot
                  </button>
                </div>
              )}
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
                {isSubmitting ? 'Updating...' : 'Update Bug'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BugEditModal;
