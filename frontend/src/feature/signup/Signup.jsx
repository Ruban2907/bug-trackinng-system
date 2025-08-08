import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUserInfo } from "../../utils/userUtils";
import { toast } from 'react-toastify';
import { apiService } from "../../services/api";

const SignUpPage = () => {
  const [form, setForm] = useState({ 
    firstname: "", 
    lastname: "", 
    email: "", 
    password: "", 
    role: "manager" 
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file.");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        return;
      }
      
      setSelectedFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!form.firstname || !form.lastname || !form.email || !form.password) {
      setError("First name, last name, email, and password are required.");
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('firstname', form.firstname);
      formData.append('lastname', form.lastname);
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('role', form.role);
      
      if (selectedFile) {
        formData.append('picture', selectedFile);
      }

      const response = await apiService.signup(formData);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      if (data.foundUser) {
        setUserInfo(data.foundUser);
      }
      
      toast.success("Registered Successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
      
    } catch (err) {
      console.error("Error: ", err);
      setError(err.message || "Signup failed. Please try again.");
      toast.error(err.message || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col justify-center items-center w-full md:max-w-md px-4 sm:px-8 py-8 sm:py-12 order-1 md:order-none">
          <div className="w-full max-w-sm h-full flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Sign Up</h2>
            <div className="flex-1 overflow-y-auto pr-2">
              <form onSubmit={handleSubmit} className="space-y-5 pb-4">
                <div>
                  <label className="block text-gray-700 mb-1" htmlFor="firstname">First Name *</label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    value={form.firstname}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1" htmlFor="lastname">Last Name *</label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={form.lastname}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                
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
                  <label className="block text-gray-700 mb-1" htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only admin and manager accounts can be created during signup.
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long and contain at least one capital letter, one lowercase letter, one number, and one special character.
                  </p>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1" htmlFor="picture">Profile Picture (Optional)</label>
                  <input
                    type="file"
                    id="picture"
                    name="picture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                  {selectedFile && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">Selected: {selectedFile.name}</p>
                    </div>
                  )}
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
                      : 'bg-gray-800 hover:bg-gray-700'
                  } text-white`}
                >
                  {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>
              </form>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              Already a member?{' '}
              <span
                className="font-semibold text-gray-800 cursor-pointer hover:underline"
                onClick={handleLoginClick}
                tabIndex={0}
                role="button"
              >
                Log in
              </span>
            </div>
          </div>
        </div>
        
        <div className="w-full md:flex-1 bg-gray-100 flex items-center justify-center order-2 md:order-none">
          <img
            src="/assets/signup.png"
            alt="Sign up visual"
            className="object-cover w-full h-48 sm:h-64 md:h-full md:min-h-[300px]"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage; 