const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { 
  validateRequiredFields, 
  validateObjectId, 
  validateBodyObjectId, 
  validateBugType, 
  validateBugStatus, 
  sanitizeStrings 
} = require("../middleware/validation");

const { handleCreateBug, handleGetAllBugs, handleGetBugById, handleUpdateBug, handleDeleteBug, handleUpdateBugStatus } = require("../controller/bug");
const {
  authenticate,
  requireAnyUser
} = require("../middleware/authentication");

// Bug management routes (for QA, managers, admins, developers)
router.post("/", 
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

router.get("/", authenticate, requireAnyUser, handleGetAllBugs);

router.get("/:bugId", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('bugId'),
  handleGetBugById
);

router.patch("/:bugId", 
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

router.delete("/:bugId", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('bugId'),
  handleDeleteBug
);

router.patch("/:bugId/status", 
  authenticate, 
  requireAnyUser, 
  validateObjectId('bugId'),
  validateRequiredFields(['status']),
  validateBugStatus,
  handleUpdateBugStatus
);

module.exports = router;
