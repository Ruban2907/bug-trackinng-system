const User = require("../model/user");
const { setUser } = require("../services/secret");
const bcrypt = require('bcrypt');
const { ValidationError, AuthenticationError, ConflictError } = require("../utils/errors");
const { successResponse, createdResponse } = require("../utils/responseHandler");
const { sanitizeUser } = require("../utils/helpers");
const { asyncHandler } = require("../middleware/errorHandler");

async function handleUserlogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and Password are required");
  }

  const foundUser = await User.findOne({ email: email });
  if (!foundUser) {
    throw new AuthenticationError('Invalid Username or Password');
  }

  const match = await bcrypt.compare(password, foundUser.password);
  if (!match) {
    throw new AuthenticationError('Invalid Username or Password');
  }

  const token = setUser(foundUser);
  const userData = sanitizeUser(foundUser);

  return successResponse(res, 200, "User logged in", { token, foundUser: userData });
}

async function handleUserSignup(req, res) {
  const { firstname, lastname, email, password, role } = req.body;

  if (role && !['admin', 'manager'].includes(role)) {
    throw new ValidationError("Only admin and manager accounts can be created during signup.");
  }

  const hashpass = await bcrypt.hash(password, 10);
  const userData = {
    firstname: firstname,
    lastname: lastname,
    email: email,
    password: hashpass,
    role: role || 'manager',
  };

  if (req.file) {
    userData.picture = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  const newUser = await User.create(userData);
  const token = setUser(newUser);
  const userResponse = sanitizeUser(newUser);

  return createdResponse(res, "User registered successfully", { token, foundUser: userResponse });
}

async function handleForgotPassword(req, res) {
  const { email } = req.body;
  
  if (!email) {
    throw new ValidationError("Email is required");
  }

  const foundUser = await User.findOne({ email: email });
  if (!foundUser) {
    throw new ValidationError("Email not found in our database");
  }

  return successResponse(res, 200, "Email verified successfully");
}

async function handleResetPassword(req, res) {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    throw new ValidationError("Email and new password are required");
  }

  const foundUser = await User.findOne({ email: email });
  if (!foundUser) {
    throw new ValidationError("Email not found in our database");
  }

  const hashpass = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(foundUser._id, { password: hashpass });

  return successResponse(res, 200, "Password reset successfully");
}

module.exports = {
  handleUserlogin: asyncHandler(handleUserlogin),
  handleUserSignup: asyncHandler(handleUserSignup),
  handleForgotPassword: asyncHandler(handleForgotPassword),
  handleResetPassword: asyncHandler(handleResetPassword),
}