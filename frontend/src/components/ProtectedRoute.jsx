import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, rehydrateUserInfo } from '../utils/userUtils';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // small delay to ensure storage writes complete
      await new Promise(r => setTimeout(r, 80));
      // Attempt to rehydrate if needed
      await rehydrateUserInfo();
      if (!isAuthenticated()) {
        toast.error("Please login to access this page");
        navigate("/login", { replace: true });
        return;
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
