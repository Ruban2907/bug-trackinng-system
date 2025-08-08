# Bug Tracking System - Frontend

A React-based frontend for the Bug Tracking System with authentication, project management, and bug tracking capabilities.

## Features

- ✅ **User Authentication**: Login with role-based access
- ✅ **Password Reset**: Email verification and direct password reset
- ✅ **Role-Based Access Control**: Admin, Manager, QA, and Developer roles
- ✅ **Modern UI**: Built with React 19, Tailwind CSS, and Vite
- ✅ **Toast Notifications**: User-friendly feedback with react-toastify
- ✅ **Form Validation**: Client-side validation with proper error handling
- ✅ **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **React 19** - UI Framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API calls
- **React Toastify** - Toast notifications
- **ESLint** - Code linting

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 8003

### Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8003

## Authentication Flow

### Login Process
1. User enters email and password
2. Credentials are validated against backend
3. On successful login:
   - JWT token is stored in localStorage
   - User info is stored in localStorage
   - Success toast notification
   - Redirect to dashboard

### Password Reset Process
1. User clicks "Forgot Password?" on login page
2. User enters their email address
3. System verifies if email exists in database
4. If email exists, user can directly set new password
5. If email doesn't exist, error message is shown
6. Password validation ensures complexity requirements
7. Success message and redirect to login

### User Management
- **Admin/Manager Only**: User accounts are created by administrators through the backend API
- **No Public Signup**: The system does not allow public user registration
- **Role Assignment**: Admins and managers can assign roles (admin, manager, qa, developer) to new users

## API Integration

The frontend integrates with the backend API through the `apiService` module:

- **Base URL**: `http://localhost:8003`
- **Authentication**: JWT Bearer tokens
- **Error Handling**: Comprehensive error messages and user feedback

### Key API Endpoints

- `POST /login` - User authentication
- `POST /forgot-password` - Verify email exists
- `POST /reset-password` - Reset password with email and new password
- `GET /users` - Get all users (admin/manager only)
- `POST /projects` - Create project (admin/manager only)
- `POST /bugs` - Create bug/feature
- `GET /bugs` - Get all bugs

## File Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── feature/            # Feature-specific components
│   │   ├── login/          # Login and password reset functionality
│   │   └── dashboard/      # Dashboard functionality
│   ├── page/               # Page components
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── assets/             # Static assets
│   ├── App.jsx             # Main app component
│   └── main.jsx            # App entry point
├── public/                 # Public assets
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8003
```

## Backend Integration Notes

- **CORS**: Backend is configured to allow requests from `http://localhost:5173`
- **Port**: Backend runs on port 8003
- **Authentication**: JWT tokens with Bearer scheme
- **User Creation**: Only through admin/manager API endpoints

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for frontend origin
2. **Port Conflicts**: Verify backend is running on port 8003
3. **Authentication Errors**: Check JWT token storage and API headers
4. **Password Reset**: Verify email exists in database before reset

### Debug Mode

Enable debug logging by checking browser console for:
- API request/response logs
- Authentication token storage
- Error messages and stack traces

## Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Test authentication flows
5. Ensure responsive design

## License

This project is part of the Bug Tracking System.
