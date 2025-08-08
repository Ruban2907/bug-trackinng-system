import React from 'react';
import { getProfilePictureUrl } from '../utils/imageUtils';

const ProfilePicture = ({ user, size = 'md', className = '' }) => {
  const profilePictureUrl = getProfilePictureUrl(user);
  
  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden ${className}`}>
      {profilePictureUrl ? (
        <img
          src={profilePictureUrl}
          alt={`${user?.firstname || 'User'} ${user?.lastname || ''}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className={`w-full h-full flex items-center justify-center text-blue-600 font-medium ${
          profilePictureUrl ? 'hidden' : 'flex'
        }`}
        style={{ backgroundColor: '#EBF4FF' }}
      >
        {user?.firstname?.charAt(0)}{user?.lastname?.charAt(0)}
      </div>
    </div>
  );
};

export default ProfilePicture;
