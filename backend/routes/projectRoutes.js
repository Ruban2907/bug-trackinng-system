const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { 
  validateRequiredFields, 
  validateObjectId, 
  validateArrayFields, 
  sanitizeStrings 
} = require("../middleware/validation");

const { handleCreateProject, handleGetAllProjects, handleGetAssignedProjects, handleGetProjectById, handleUpdateProject, handleDeleteProject, handleAssignQA, handleAssignDevelopers } = require("../controller/project");
const {
  authenticate,
  requireManagerOrAdmin,
  requireAnyUser
} = require("../middleware/authentication");

// Project management routes (only for managers, admins)
router.post("/", 
  authenticate, 
  requireManagerOrAdmin, 
  upload.single("picture"), 
  validateRequiredFields(['name']),
  sanitizeStrings(['name', 'description']),
  handleCreateProject
);

router.get("/", authenticate, requireManagerOrAdmin, handleGetAllProjects);

// Project access routes (for QA engineers and developers to see their assigned projects)
router.get("/assigned-projects", authenticate, requireAnyUser, handleGetAssignedProjects);

// Project assignment routes (only for managers, admins)
router.post("/:projectId/assign-qa", 
  authenticate, 
  requireManagerOrAdmin, 
  validateObjectId('projectId'),
  validateRequiredFields(['qaIds']),
  validateArrayFields(['qaIds']),
  handleAssignQA
);

router.post("/:projectId/assign-developers", 
  authenticate, 
  requireManagerOrAdmin, 
  validateObjectId('projectId'),
  validateRequiredFields(['developerIds']),
  validateArrayFields(['developerIds']),
  handleAssignDevelopers
);

router.get("/:projectId", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('projectId'),
  handleGetProjectById
);

router.patch("/:projectId", 
  authenticate, 
  requireManagerOrAdmin, 
  upload.single("picture"), 
  validateObjectId('projectId'),
  sanitizeStrings(['name', 'description']),
  handleUpdateProject
);

router.delete("/:projectId", 
  authenticate, 
  requireManagerOrAdmin, 
  validateObjectId('projectId'),
  handleDeleteProject
);

module.exports = router;
