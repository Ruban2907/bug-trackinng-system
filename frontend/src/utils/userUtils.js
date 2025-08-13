export const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
};

export const setUserInfo = (userData) => {
  try {
    localStorage.setItem('userInfo', JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user info:', error);
  }
};

export const clearUserInfo = () => {
  localStorage.removeItem('userInfo');
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userInfo = getUserInfo();
  
  return token && userInfo;
};

export const getToken = () => {
  return localStorage.getItem('token');
}; 