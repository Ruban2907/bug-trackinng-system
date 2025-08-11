import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, clearUserInfo } from '../utils/userUtils';
import ProfilePicture from './ProfilePicture';
import { toast } from 'react-toastify';

const Header = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const user = getUserInfo();
    setUserInfo(user);
  }, []);

  // Listen for storage changes to update user info
  useEffect(() => {
    const handleStorageChange = () => {
      const user = getUserInfo();
      setUserInfo(user);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearUserInfo();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleLogoClick = () => {
    if (userInfo) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  if (!userInfo) {
    return null; // Don't show header if user is not logged in
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BT</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Bug Tracker</h1>
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Dashboard
            </button>
            
            {(userInfo.role === 'admin' || userInfo.role === 'manager') && (
              <>
                <button
                  onClick={() => navigate("/projects")}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Projects
                </button>
                <button
                  onClick={() => navigate("/users")}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Users
                </button>
              </>
            )}
            
            {(userInfo.role === 'qa' || userInfo.role === 'developer') && (
              <button
                onClick={() => navigate("/my-projects")}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Projects
              </button>
            )}
            
            <button
              onClick={() => navigate("/bugs")}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Bugs & Features
            </button>
          </nav>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {userInfo.firstname} {userInfo.lastname}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {userInfo.role}
                </div>
              </div>
              
              {/* User Avatar */}
              <ProfilePicture user={userInfo} size="sm" />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2 space-y-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Dashboard
          </button>
          
          {(userInfo.role === 'admin' || userInfo.role === 'manager') && (
            <>
              <button
                onClick={() => navigate("/projects")}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Projects
              </button>
              <button
                onClick={() => navigate("/users")}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Users
              </button>
            </>
          )}
          
          {(userInfo.role === 'qa' || userInfo.role === 'developer') && (
            <button
              onClick={() => navigate("/my-projects")}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Projects
            </button>
          )}
          
          <button
            onClick={() => navigate("/bugs")}
            className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Bugs & Features
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
