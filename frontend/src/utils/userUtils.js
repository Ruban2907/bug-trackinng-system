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

// Rehydrate user information from the backend when only a token exists
export const rehydrateUserInfo = async () => {
  try {
    const token = localStorage.getItem('token');
    const existing = getUserInfo();
    if (!token || existing) {
      return existing;
    }
    // Lazy import to avoid potential circular dependency on build tools
    const { apiService } = await import('../services/api');
    const res = await apiService.authenticatedRequest('/users/me', { method: 'GET' });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const user = data.data || data.user || data;
    if (user) {
      setUserInfo(user);
    }
    return user;
  } catch (error) {
    console.error('Failed to rehydrate user info:', error);
    return null;
  }
};