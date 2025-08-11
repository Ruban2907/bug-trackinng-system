// Utility function to convert buffer data to base64 for displaying images
export const bufferToBase64 = (buffer) => {
  if (!buffer || !buffer.data) {
    return null;
  }

  try {
    // If the data is already a base64 string (from backend conversion)
    if (typeof buffer.data === 'string') {
      const dataUrl = `data:${buffer.contentType};base64,${buffer.data}`;
      return dataUrl;
    }

    // Handle boolean case (from login response)
    if (typeof buffer === 'boolean') {
      return null;
    }

    let uint8Array;

    // Handle different buffer formats (including MongoDB Buffer serialization)
    if (buffer.data instanceof Uint8Array) {
      uint8Array = buffer.data;
    } else if (Array.isArray(buffer.data)) {
      uint8Array = new Uint8Array(buffer.data);
    } else if (buffer.data.data) {
      // Handle nested buffer structure (e.g., { data: [byte1, byte2, ...], type: 'Buffer' })
      uint8Array = new Uint8Array(buffer.data.data);
    } else if (buffer.data.type === 'Buffer' && Array.isArray(buffer.data.data)) { // Specific fix for MongoDB Buffer serialization
      uint8Array = new Uint8Array(buffer.data.data);
    } else {
      return null;
    }

    // Convert buffer to base64
    const base64 = btoa(
      uint8Array.reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const dataUrl = `data:${buffer.contentType};base64,${base64}`;

    return dataUrl;
  } catch (error) {
    console.error('Error converting buffer to base64:', error);
    return null;
  }
};

// Utility function to get profile picture URL
export const getProfilePictureUrl = (userInfo) => {
  if (!userInfo?.picture) {
    return null;
  }

  const result = bufferToBase64(userInfo.picture);
  return result;
};

// Utility function to get project picture URL
export const getProjectPictureUrl = (projectPicture) => {
  if (!projectPicture?.data) {
    return null;
  }

  // Backend already converts to base64, so we just need to create the data URL
  return `data:${projectPicture.contentType};base64,${projectPicture.data}`;
};
