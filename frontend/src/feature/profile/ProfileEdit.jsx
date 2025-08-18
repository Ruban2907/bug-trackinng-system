import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, setUserInfo } from '../../utils/userUtils';
import { toast } from 'react-toastify';
import ProfilePicture from '../../shared/ProfilePicture';
import { apiService } from '../../services/api';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfoState] = useState(null);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: ''
  });
  const [newPicture, setNewPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = getUserInfo();
    if (!user) {
      toast.error("Please login to access your profile");
      navigate("/login");
      return;
    }
    setUserInfoState(user);
    setFormData({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || ''
    });
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setNewPicture(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstname', formData.firstname);
      formDataToSend.append('lastname', formData.lastname);
      formDataToSend.append('email', formData.email);

      if (newPicture) {
        formDataToSend.append('picture', newPicture);
      }

      const response = await apiService.authenticatedRequest('/users/profile', {
        method: 'PATCH',
        body: formDataToSend
      });

      if (response.ok) {
        const data = await response.json();
        
        const updatedUserData = data.data || data;
        
        const finalUserInfo = {
          ...userInfo,
          ...formData,
          picture: updatedUserData.picture || userInfo.picture
        };
        
        setUserInfo(finalUserInfo);
        setUserInfoState(finalUserInfo);

        window.dispatchEvent(new Event('storage'));

        toast.success('Profile updated successfully!');

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstname: userInfo?.firstname || '',
      lastname: userInfo?.lastname || '',
      email: userInfo?.email || ''
    });
    setNewPicture(null);
    setPreviewUrl(null);
    toast.info('Changes cancelled');
  };



  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Edit Profile</h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          ⬅️ Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>

            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : (
                  <ProfilePicture user={userInfo} size="2xl" />
                )}

                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-white text-center">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">Change Photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {newPicture && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {newPicture.name}
                  </p>
                )}
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Current picture will be replaced</p>
                {newPicture && (
                  <p className="text-green-600 mt-1">
                    New picture selected: {newPicture.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Account Information</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><span className="font-medium">Role:</span> {userInfo.role}</p>
              <p><span className="font-medium">User ID:</span> {userInfo._id}</p>
              <p><span className="font-medium">Member since:</span> {new Date(userInfo.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-900 mb-1">Note</h4>
            <p className="text-sm text-yellow-800">
              Password and role cannot be changed from this page. Contact your administrator for role changes.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;
