import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';
import Login from './page/login';
import Dashboard from './page/dashboard';
import Projects from './page/projects';
import Users from './page/users';
import Bugs from './page/bugs';
import Profile from './page/profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
    <BrowserRouter>
      <ToastContainer/>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/bugs" element={
          <ProtectedRoute>
            <Bugs />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App
