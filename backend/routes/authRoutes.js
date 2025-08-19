const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { 
  validateRequiredFields, 
  validateEmail, 
  validateRole, 

  sanitizeStrings 
} = require("../middleware/validation");

const { handleUserlogin, handleForgotPassword, handleResetPassword } = require("../controller/auth");
const { handleCreateUser } = require("../controller/user");

// Auth routes
router.post("/signup", 
  upload.single("picture"), 
  validateRequiredFields(['firstname', 'email', 'password']),
  validateEmail,
  validateRole,
  sanitizeStrings(['firstname', 'lastname', 'email']),
  handleCreateUser
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

module.exports = router;
