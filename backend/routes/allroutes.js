const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { handleUserlogin, handleUserSignup, handleForgotPassword, handleResetPassword } = require("../controller/auth")
const { handleCreateUser, handleGetAllUsers, handleGetUserById, handleUpdateUser, handleUpdateProfile, handleGetCurrentUser, handleDeleteUser } = require("../controller/user")
const { handleCreateProject, handleGetAllProjects, handleGetAssignedProjects, handleGetProjectById, handleUpdateProject, handleDeleteProject, handleAssignQA, handleAssignDevelopers } = require("../controller/project")
const { handleCreateBug, handleGetAllBugs, handleGetBugById, handleUpdateBug, handleDeleteBug, handleUpdateBugStatus, handleReassignBug } = require("../controller/bug")
const {
  authenticate,
  requireManagerOrAdmin,
  requireAnyUser,
  requireAdminManagerOrQA
} = require("../middleware/authentication");

//auth routes
router.post("/signup", upload.single("picture"), handleUserSignup)
router.post("/login", handleUserlogin);
router.post("/forgot-password", handleForgotPassword);
router.post("/reset-password", handleResetPassword);



// User profile routes (for all authenticated users) - MUST come before /users/:userId
router.get("/users/me", authenticate, handleGetCurrentUser);
router.patch("/users/profile", authenticate, upload.single("picture"), handleUpdateProfile);

// User routes
router.post("/users", authenticate, requireManagerOrAdmin, upload.single("picture"), handleCreateUser);
router.get("/users", authenticate, requireAdminManagerOrQA, handleGetAllUsers);
router.get("/users/:userId", authenticate, requireAdminManagerOrQA, handleGetUserById);
router.patch("/users/:userId", authenticate, requireAdminManagerOrQA, upload.single("picture"), handleUpdateUser);
router.delete("/users/:userId", authenticate, requireAdminManagerOrQA, handleDeleteUser);

// Project management routes (only for managers , admins)
router.post("/projects", authenticate, requireManagerOrAdmin, upload.single("picture"), handleCreateProject);
router.get("/projects", authenticate, requireManagerOrAdmin, handleGetAllProjects);
router.get("/projects/:projectId", authenticate, requireAnyUser, handleGetProjectById);
router.patch("/projects/:projectId", authenticate, requireManagerOrAdmin, upload.single("picture"), handleUpdateProject);
router.delete("/projects/:projectId", authenticate, requireManagerOrAdmin, handleDeleteProject);

// Project access routes (for QA engineers and developers to see their assigned projects)
router.get("/assigned-projects", authenticate, requireAnyUser, handleGetAssignedProjects);

// Project assignment routes (only for managers , admins)
router.post("/projects/:projectId/assign-qa", authenticate, requireManagerOrAdmin, handleAssignQA);
router.post("/projects/:projectId/assign-developers", authenticate, requireManagerOrAdmin, handleAssignDevelopers);

// Bug management routes (for QA, managers, admins, developers)
router.post("/bugs", authenticate, requireAnyUser, upload.single("screenshot"), handleCreateBug);
router.get("/bugs", authenticate, requireAnyUser, handleGetAllBugs);
router.get("/bugs/:bugId", authenticate, requireAnyUser, handleGetBugById);
router.patch("/bugs/:bugId", authenticate, requireAnyUser, upload.single("screenshot"), handleUpdateBug);
router.delete("/bugs/:bugId", authenticate, requireAnyUser, handleDeleteBug);
router.patch("/bugs/:bugId/status", authenticate, requireAnyUser, handleUpdateBugStatus);
router.patch("/bugs/:bugId/reassign", authenticate, requireAnyUser, handleReassignBug);

module.exports = router; 