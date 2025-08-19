const User = require("../model/user");
const { setUser } = require("../services/secret");
const bcrypt = require('bcrypt');
const { ValidationError, AuthenticationError } = require("../utils/errors");
const { successResponse } = require("../utils/responseHandler");
const { sanitizeUser } = require("../utils/helpers");
const { asyncHandler } = require("../middleware/errorHandler");

const findUserByEmail = (email) => User.findOne({ email });

async function handleUserlogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and Password are required");
  }

  const foundUser = await findUserByEmail(email);
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


async function handleForgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError("Email is required");
  }

  const foundUser = await findUserByEmail(email);
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

  const foundUser = await findUserByEmail(email);
  if (!foundUser) {
    throw new ValidationError("Email not found in our database");
  }

  const hashpass = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(foundUser._id, { password: hashpass });

  return successResponse(res, 200, "Password reset successfully");
}

module.exports = {
  handleUserlogin: asyncHandler(handleUserlogin),
  handleForgotPassword: asyncHandler(handleForgotPassword),
  handleResetPassword: asyncHandler(handleResetPassword),
}