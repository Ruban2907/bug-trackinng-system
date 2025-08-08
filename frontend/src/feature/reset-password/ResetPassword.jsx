import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { apiService } from "../../services/api";

const ResetPasswordPage = () => {
  const [form, setForm] = useState({ 
    password: "", 
    confirmPassword: "" 
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token, email]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!form.password || !form.confirmPassword) {
      setError("Both password fields are required.");
      setIsLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    if (!regex.test(form.password)) {
      setError("Password must contain at least one capital letter, one lowercase letter, one number, and one special character.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.resetPassword({
        email: email,
        token: token,
        password: form.password
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      toast.success("Password reset successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      
    } catch (err) {
      console.error("Reset Password Error: ", err);
      setError(err.message || "Password reset failed. Please try again.");
      toast.error(err.message || "Password reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 text-center mb-6">
            The password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <button
            onClick={handleBackToLogin}
            className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Reset Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">New Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long and contain at least one capital letter, one lowercase letter, one number, and one special character.
            </p>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="confirmPassword">Confirm New Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded transition ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
