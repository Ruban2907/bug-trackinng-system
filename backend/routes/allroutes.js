const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { 
  validateRequiredFields, 
  validateEmail, 
  validateObjectId, 
  validateBodyObjectId, 
  validateRole, 
  validateBugType, 
  validateBugStatus,
  validateArrayFields,
  sanitizeStrings 
} = require("../middleware/validation");

const { handleUserlogin, handleUserSignup, handleForgotPassword, handleResetPassword } = require("../controller/auth");
const { handleCreateUser, handleGetAllUsers, handleGetUserById, handleUpdateUser, handleUpdateProfile, handleGetCurrentUser, handleDeleteUser } = require("../controller/user");
const { handleCreateProject, handleGetAllProjects, handleGetAssignedProjects, handleGetProjectById, handleUpdateProject, handleDeleteProject, handleAssignQA, handleAssignDevelopers } = require("../controller/project");
const { handleCreateBug, handleGetAllBugs, handleGetBugById, handleUpdateBug, handleDeleteBug, handleUpdateBugStatus } = require("../controller/bug");
const {
  authenticate,
  requireManagerOrAdmin,
  requireAnyUser,
  requireAdminManagerOrQA
} = require("../middleware/authentication");

// Auth routes
router.post("/signup", 
  upload.single("picture"), 
  validateRequiredFields(['firstname', 'email', 'password']),
  validateEmail,
  validateRole,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleUserSignup
);

router.post("/login", 
  validateRequiredFields(['email', 'password']),
  validateEmail,
  handleUserlogin
);

router.post("/forgot-password", 
  validateRequiredFields(['email']),
  validateEmail,
  handleForgotPassword
);

router.post("/reset-password", 
  validateRequiredFields(['email', 'newPassword']),
  validateEmail,
  handleResetPassword
);

// User profile routes (for all authenticated users) - MUST come before /users/:userId
router.get("/users/me", authenticate, handleGetCurrentUser);

router.patch("/users/profile", 
  authenticate, 
  upload.single("picture"), 
  validateRequiredFields(['firstname', 'email']),
  validateEmail,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleUpdateProfile
);

// User management routes
router.post("/users", 
  authenticate, 
  requireManagerOrAdmin, 
  upload.single("picture"), 
  validateRequiredFields(['firstname', 'email', 'password', 'role']),
  validateEmail,
  validateRole,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleCreateUser
);

router.get("/users", authenticate, requireAdminManagerOrQA, handleGetAllUsers);

router.get("/users/:userId", 
  authenticate, 
  requireAdminManagerOrQA, 
  validateObjectId('userId'),
  handleGetUserById
);

router.patch("/users/:userId", 
  authenticate, 
  requireAdminManagerOrQA, 
  upload.single("picture"), 
  validateObjectId('userId'),
  validateEmail,
  validateRole,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleUpdateUser
);

router.delete("/users/:userId", 
  authenticate, 
  requireAdminManagerOrQA, 
  validateObjectId('userId'),
  handleDeleteUser
);

// Project management routes (only for managers, admins)
router.post("/projects", 
  authenticate, 
  requireManagerOrAdmin, 
  upload.single("picture"), 
  validateRequiredFields(['name']),
  sanitizeStrings(['name', 'description']),
  handleCreateProject
);

router.get("/projects", authenticate, requireManagerOrAdmin, handleGetAllProjects);

router.get("/projects/:projectId", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('projectId'),
  handleGetProjectById
);

router.patch("/projects/:projectId", 
  authenticate, 
  requireManagerOrAdmin, 
  upload.single("picture"), 
  validateObjectId('projectId'),
  sanitizeStrings(['name', 'description']),
  handleUpdateProject
);

router.delete("/projects/:projectId", 
  authenticate, 
  requireManagerOrAdmin, 
  validateObjectId('projectId'),
  handleDeleteProject
);

// Project access routes (for QA engineers and developers to see their assigned projects)
router.get("/assigned-projects", authenticate, requireAnyUser, handleGetAssignedProjects);

// Project assignment routes (only for managers, admins)
router.post("/projects/:projectId/assign-qa", 
  authenticate, 
  requireManagerOrAdmin, 
  validateObjectId('projectId'),
  validateRequiredFields(['qaIds']),
  validateArrayFields(['qaIds']),
  handleAssignQA
);

router.post("/projects/:projectId/assign-developers", 
  authenticate, 
  requireManagerOrAdmin, 
  validateObjectId('projectId'),
  validateRequiredFields(['developerIds']),
  validateArrayFields(['developerIds']),
  handleAssignDevelopers
);

// Bug management routes (for QA, managers, admins, developers)
router.post("/bugs", 
  authenticate, 
  requireAnyUser, 
  upload.single("screenshot"), 
  validateRequiredFields(['title', 'type', 'projectId']),
  validateBugType,
  validateBugStatus,
  validateBodyObjectId('projectId'),
  sanitizeStrings(['title', 'description']),
  handleCreateBug
);

router.get("/bugs", authenticate, requireAnyUser, handleGetAllBugs);

router.get("/bugs/:bugId", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('bugId'),
  handleGetBugById
);

router.patch("/bugs/:bugId", 
  authenticate, 
  requireAnyUser, 
  upload.single("screenshot"), 
  validateObjectId('bugId'),
  validateBugType,
  validateBugStatus,
  validateBodyObjectId('assignedTo'),
  sanitizeStrings(['title', 'description']),
  handleUpdateBug
);

router.delete("/bugs/:bugId", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('bugId'),
  handleDeleteBug
);

router.patch("/bugs/:bugId/status", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('bugId'),
  validateRequiredFields(['status']),
  validateBugStatus,
  handleUpdateBugStatus
);



module.exports = router; 