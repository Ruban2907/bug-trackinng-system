import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setUserInfo, isAuthenticated } from "../../utils/userUtils";
import { toast } from 'react-toastify';
import { apiService } from "../../services/api";

const LoginPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.login(form);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.foundUser) {
        setUserInfo(data.foundUser);
      }

      try {
        const userResponse = await apiService.authenticatedRequest('/users/me', {
          method: 'GET'
        });
        const userData = await userResponse.json();
        if (userResponse.ok && userData.user) {
          setUserInfo(userData.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }


      navigate("/dashboard");
      toast.success("Login Successful!");

    } catch (err) {
      console.error("Login Error: ", err);
      setError(err.message || "Login failed. Please check your credentials.");
      toast.error(err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError("");

    if (!forgotEmail) {
      setError("Please enter your email address.");
      setForgotLoading(false);
      return;
    }

    try {
      const response = await apiService.forgotPassword({ email: forgotEmail });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email not found');
      }

      setEmailVerified(true);
      toast.success("Email verified! You can now reset your password.");

    } catch (err) {
      console.error("Forgot Password Error: ", err);
      setError(err.message || "Email not found in our database.");
      toast.error(err.message || "Email not found.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError("");

    if (!resetPassword || !confirmPassword) {
      setError("Both password fields are required.");
      setResetLoading(false);
      return;
    }

    if (resetPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setResetLoading(false);
      return;
    }

    if (resetPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setResetLoading(false);
      return;
    }

    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    if (!regex.test(resetPassword)) {
      setError("Password must contain at least one capital letter, one lowercase letter, one number, and one special character.");
      setResetLoading(false);
      return;
    }

    try {
      const response = await apiService.resetPassword({
        email: forgotEmail,
        newPassword: resetPassword
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      toast.success("Password reset successfully!");
      setShowForgotPassword(false);
      setEmailVerified(false);
      setForgotEmail("");
      setResetPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error("Reset Password Error: ", err);
      setError(err.message || "Password reset failed. Please try again.");
      toast.error(err.message || "Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setError("");
    setForgotEmail("");
    setEmailVerified(false);
    setResetPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col justify-center items-center w-full md:max-w-md px-4 sm:px-8 py-8 sm:py-12 order-1 md:order-none">
          <div className="w-full max-w-sm h-full flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Sign In</h2>
            <div className="flex-1 overflow-y-auto pr-2">
              {!showForgotPassword ? (
                <form onSubmit={handleSubmit} className="space-y-5 pb-4">
                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={form.password}
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
                    className={`w-full py-2 rounded transition ${isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gray-800 hover:bg-gray-700'
                      } text-white`}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              ) : !emailVerified ? (
                <form onSubmit={handleForgotPassword} className="space-y-5 pb-4">
                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="forgotEmail">Email *</label>
                    <input
                      type="email"
                      id="forgotEmail"
                      name="forgotEmail"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
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
                    disabled={forgotLoading}
                    className={`w-full py-2 rounded transition ${forgotLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                  >
                    {forgotLoading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5 pb-4">
                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="newPassword">New Password *</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters long and contain at least one capital letter, one lowercase letter, one number, and one special character.
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="confirmNewPassword">Confirm New Password *</label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                    disabled={resetLoading}
                    className={`w-full py-2 rounded transition ${resetLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                  >
                    {resetLoading ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              {!showForgotPassword ? (
                <span
                  className="font-semibold text-gray-800 cursor-pointer hover:underline"
                  onClick={toggleForgotPassword}
                  tabIndex={0}
                  role="button"
                >
                  Forgot Password?
                </span>
              ) : (
                <span
                  className="font-semibold text-gray-800 cursor-pointer hover:underline"
                  onClick={toggleForgotPassword}
                  tabIndex={0}
                  role="button"
                >
                  Back to Sign In
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:flex-1 bg-gray-100 flex items-center justify-center order-2 md:order-none">
          <img
            src="/public/forget.jpg"
            alt="Sign in visual"
            className="object-cover w-full h-48 sm:h-64 md:h-full md:min-h-[300px]"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
