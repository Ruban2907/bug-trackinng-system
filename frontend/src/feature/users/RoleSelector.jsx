import React from 'react';

const RoleSelector = ({ availableRoles, selectedRole, onRoleSelect, currentUserRole }) => {
  const roleConfig = {
    manager: {
      label: 'Managers',
      description: 'Project managers and team leads',
      icon: '👔',
      color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
    },
    qa: {
      label: 'QA Engineers',
      description: 'Quality assurance and testing specialists',
      icon: '🔍',
      color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
    },
    developer: {
      label: 'Developers',
      description: 'Software developers and programmers',
      icon: '💻',
      color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {currentUserRole === 'admin' && (
          <p>As an admin, you can manage managers, QA engineers, and developers.</p>
        )}
        {currentUserRole === 'manager' && (
          <p>As a manager, you can manage QA engineers and developers.</p>
        )}
        {currentUserRole === 'qa' && (
          <p>As a QA engineer, you can manage developers.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableRoles.map((role) => {
          const config = roleConfig[role];
          const isSelected = selectedRole === role;

          return (
            <button
              key={role}
              onClick={() => onRoleSelect(role)}
              className={`
                p-6 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : `border-gray-200 ${config.color}`
                }
                hover:shadow-md transform hover:scale-105
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{config.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{config.label}</h3>
                  <p className="text-sm opacity-75 mt-1">{config.description}</p>
                </div>
                {isSelected && (
                  <div className="text-blue-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {availableRoles.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions</h3>
          <p className="text-gray-600">
            You don't have permission to manage any user categories.
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
