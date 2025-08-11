import React, { useState } from 'react';

const ProjectCard = ({ project, onEdit, onDelete, onShowDetails, showEditDelete = true, showDetails = true }) => {
  const [showQA, setShowQA] = useState(false);
  const [showDevelopers, setShowDevelopers] = useState(false);
  const pictureUrl = project.picture?.data
    ? `data:${project.picture.contentType};base64,${project.picture.data}`
    : null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
       {/* Top half - Profile Picture */}
       <div className="h-60 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        {pictureUrl ? (
          <img src={pictureUrl} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {project.name?.slice(0,2)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* Bottom half - Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <button type="button" onClick={() => setShowQA(prev => !prev)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
            QA: {project.qaAssigned?.length || 0}
          </button>
          <button type="button" onClick={() => setShowDevelopers(prev => !prev)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
            Developers: {project.developersAssigned?.length || 0}
          </button>
        </div>

        {showQA && (
          <div className="border rounded p-2 text-sm bg-gray-50">
            <div className="font-medium mb-1">QA Assigned</div>
            {project.qaAssigned && project.qaAssigned.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {project.qaAssigned.map(u => (
                  <li key={u._id}>{u.firstname} {u.lastname} ({u.email})</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No QA assigned</div>
            )}
          </div>
        )}

        {showDevelopers && (
          <div className="border rounded p-2 text-sm bg-gray-50">
            <div className="font-medium mb-1">Developers Assigned</div>
            {project.developersAssigned && project.developersAssigned.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {project.developersAssigned.map(u => (
                  <li key={u._id}>{u.firstname} {u.lastname} ({u.email})</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No developers assigned</div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          {showEditDelete && onEdit && (
            <button onClick={() => onEdit(project)} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Edit</button>
          )}
          {showEditDelete && onDelete && (
            <button onClick={() => onDelete(project)} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700">Delete</button>
          )}
          {showDetails && onShowDetails && (
            <button onClick={() => onShowDetails(project)} className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700">Show Details</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;


