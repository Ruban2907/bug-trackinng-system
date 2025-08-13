const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { 
  validateRequiredFields, 
  validateEmail, 
  validateObjectId, 
  validateRole, 
  sanitizeStrings 
} = require("../middleware/validation");

const { handleCreateUser, handleGetAllUsers, handleGetUserById, handleUpdateUser, handleGetCurrentUser, handleDeleteUser } = require("../controller/user");
const {
  authenticate,
  requireManagerOrAdmin,
  requireAdminManagerOrQA
} = require("../middleware/authentication");

// User profile routes (for all authenticated users) - MUST come before /:userId
router.get("/me", authenticate, handleGetCurrentUser);

router.patch("/profile", 
  authenticate, 
  upload.single("picture"), 
  validateRequiredFields(['firstname', 'email']),
  validateEmail,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleUpdateUser
);

// User management routes
router.post("/", 
  authenticate, 
  requireManagerOrAdmin, 
  upload.single("picture"), 
  validateRequiredFields(['firstname', 'email', 'password', 'role']),
  validateEmail,
  validateRole,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleCreateUser
);

router.get("/", authenticate, requireAdminManagerOrQA, handleGetAllUsers);

router.get("/:userId", 
  authenticate, 
  requireAdminManagerOrQA, 
  validateObjectId('userId'),
  handleGetUserById
);

router.patch("/:userId", 
  authenticate, 
  requireAdminManagerOrQA, 
  upload.single("picture"), 
  validateObjectId('userId'),
  validateEmail,
  validateRole,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleUpdateUser
);

router.delete("/:userId", 
  authenticate, 
  requireAdminManagerOrQA, 
  validateObjectId('userId'),
  handleDeleteUser
);

module.exports = router;
