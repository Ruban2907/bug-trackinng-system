export const bufferToBase64 = (buffer) => {
  if (!buffer || !buffer.data) {
    return null;
  }

  try {
    if (typeof buffer.data === 'string') {
      const dataUrl = `data:${buffer.contentType};base64,${buffer.data}`;
      return dataUrl;
    }

    if (typeof buffer === 'boolean') {
      return null;
    }

    let uint8Array;

    if (buffer.data instanceof Uint8Array) {
      uint8Array = buffer.data;
    } else if (Array.isArray(buffer.data)) {
      uint8Array = new Uint8Array(buffer.data);
    } else if (buffer.data.data) {
      uint8Array = new Uint8Array(buffer.data.data);
    } else if (buffer.data.type === 'Buffer' && Array.isArray(buffer.data.data)) {
      uint8Array = new Uint8Array(buffer.data.data);
    } else {
      return null;
    }

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

export const getProfilePictureUrl = (userInfo) => {
  if (!userInfo?.picture) {
    return null;
  }

  const result = bufferToBase64(userInfo.picture);
  return result;
};

export const getProjectPictureUrl = (projectPicture) => {
  if (!projectPicture?.data) {
    return null;
  }

  return `data:${projectPicture.contentType};base64,${projectPicture.data}`;
};
