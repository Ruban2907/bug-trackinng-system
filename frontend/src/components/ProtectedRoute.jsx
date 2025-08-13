import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/userUtils';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      // Add a small delay to ensure authentication state is properly set
      const timer = setTimeout(() => {
        if (!isAuthenticated()) {
          toast.error("Please login to access this page");
          navigate("/login", { replace: true });
          return;
        }
        setIsLoading(false);
      }, 100); // Small delay to ensure state is set

      return () => clearTimeout(timer);
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
