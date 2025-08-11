import React, { useEffect, useState } from 'react';
import ConfirmationModal from '../../shared/ConfirmationModal';

const ProjectFormModal = ({ isOpen, onClose, onSubmit, initialProject, users }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [qaAssigned, setQaAssigned] = useState([]);
  const [developersAssigned, setDevelopersAssigned] = useState([]);
  const [pictureFile, setPictureFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQASelection, setShowQASelection] = useState(false);
  const [showDevSelection, setShowDevSelection] = useState(false);

  const qaUsers = users?.filter(u => u.role === 'qa') || [];
  const devUsers = users?.filter(u => u.role === 'developer') || [];

  useEffect(() => {
    if (initialProject) {
      console.log('Setting initial project data:', initialProject);
      setName(initialProject.name || '');
      setDescription(initialProject.description || '');
      // Handle both populated user objects and user IDs
      const qaIds = initialProject.qaAssigned?.map(u => typeof u === 'object' ? u._id : u) || [];
      const devIds = initialProject.developersAssigned?.map(u => typeof u === 'object' ? u._id : u) || [];
      console.log('QA IDs:', qaIds, 'Dev IDs:', devIds);
      setQaAssigned(qaIds);
      setDevelopersAssigned(devIds);
      setPictureFile(null);
    } else {
      setName('');
      setDescription('');
      setQaAssigned([]);
      setDevelopersAssigned([]);
      setPictureFile(null);
    }
  }, [initialProject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
             const formData = new FormData();
       formData.append('name', name);
       formData.append('description', description);
       // Always send the arrays, even if empty, to ensure proper backend handling
       formData.append('qaAssigned', JSON.stringify(qaAssigned));
       formData.append('developersAssigned', JSON.stringify(developersAssigned));
       if (pictureFile) formData.append('picture', pictureFile);

      await onSubmit(formData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit} className="bg-white p-6 space-y-4">
            <h3 className="text-lg font-semibold">{initialProject ? 'Edit Project' : 'Create Project'}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign QA (optional)</label>
                
                {/* Chosen QA */}
                {qaAssigned.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">Selected QA:</div>
                    <div className="flex flex-wrap gap-2">
                      {qaAssigned.map(qaId => {
                        const user = qaUsers.find(u => u._id === qaId);
                        return user ? (
                          <div key={qaId} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            <span>{user.firstname} {user.lastname}</span>
                                                         <button
                               type="button"
                               onClick={() => {
                                 console.log('Removing QA:', qaId, 'Current:', qaAssigned);
                                 setQaAssigned(prev => {
                                   const newArray = prev.filter(id => id !== qaId);
                                   console.log('New QA array:', newArray);
                                   return newArray;
                                 });
                               }}
                               className="text-blue-600 hover:text-blue-800"
                             >
                               ×
                             </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* QA Selection Button */}
                <button
                  type="button"
                  onClick={() => setShowQASelection(prev => !prev)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-left text-sm hover:bg-gray-50"
                >
                  {qaAssigned.length > 0 ? `${qaAssigned.length} QA selected` : 'Select QA'}
                </button>

                {/* QA Selection Modal */}
                {showQASelection && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowQASelection(false)}></div>
                      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Select QA Engineers</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {qaUsers.map(user => (
                              <label key={user._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={qaAssigned.includes(user._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setQaAssigned(prev => [...prev, user._id]);
                                    } else {
                                      setQaAssigned(prev => prev.filter(id => id !== user._id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">
                                  {user.firstname} {user.lastname} ({user.email})
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="button"
                            onClick={() => setShowQASelection(false)}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Developers (optional)</label>
                
                {/* Chosen Developers */}
                {developersAssigned.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">Selected Developers:</div>
                    <div className="flex flex-wrap gap-2">
                      {developersAssigned.map(devId => {
                        const user = devUsers.find(u => u._id === devId);
                        return user ? (
                          <div key={devId} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            <span>{user.firstname} {user.lastname}</span>
                                                         <button
                               type="button"
                               onClick={() => {
                                 console.log('Removing Developer:', devId, 'Current:', developersAssigned);
                                 setDevelopersAssigned(prev => {
                                   const newArray = prev.filter(id => id !== devId);
                                   console.log('New Developers array:', newArray);
                                   return newArray;
                                 });
                               }}
                               className="text-green-600 hover:text-green-800"
                             >
                               ×
                             </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Developer Selection Button */}
                <button
                  type="button"
                  onClick={() => setShowDevSelection(prev => !prev)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-left text-sm hover:bg-gray-50"
                >
                  {developersAssigned.length > 0 ? `${developersAssigned.length} Developers selected` : 'Select Developers'}
                </button>

                {/* Developer Selection Modal */}
                {showDevSelection && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDevSelection(false)}></div>
                      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Developers</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {devUsers.map(user => (
                              <label key={user._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={developersAssigned.includes(user._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDevelopersAssigned(prev => [...prev, user._id]);
                                    } else {
                                      setDevelopersAssigned(prev => prev.filter(id => id !== user._id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">
                                  {user.firstname} {user.lastname} ({user.email})
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="button"
                            onClick={() => setShowDevSelection(false)}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Project Picture (optional)</label>
              <input type="file" accept="image/*" onChange={e => setPictureFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                {isLoading ? 'Saving...' : (initialProject ? 'Save Changes' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;


