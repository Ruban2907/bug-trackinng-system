import React from 'react';
import { NavLink } from 'react-router-dom';

const NotFound = () => (
  <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <h1 style={{ fontSize: '3rem', color: '#e53e3e' }}>404</h1>
    <p style={{ fontSize: '1.5rem' }}>Page Not Found</p>
    <div className='py-4'>
      <NavLink to='/login'>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-blue-600 transition duration-300">
          Go To Login</button>
      </NavLink>
    </div>
  </div>
);

export default NotFound;
