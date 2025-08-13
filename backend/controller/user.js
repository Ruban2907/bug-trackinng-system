const User = require("../model/user");
const bcrypt = require('bcrypt');
const { successResponse, createdResponse, errorResponse, notFoundResponse, forbiddenResponse, validationErrorResponse } = require("../utils/responseHandler");
const { ValidationError, AuthorizationError, NotFoundError, ConflictError } = require("../utils/errors");
const { asyncHandler } = require("../middleware/errorHandler");

const canManageRole = (currentUserRole, targetRole) => {
  switch (currentUserRole) {
    case 'admin':
      return ['manager', 'qa', 'developer'].includes(targetRole);
    case 'manager':
      return ['qa', 'developer'].includes(targetRole);
    default:
      return false;
  }
};

async function handleCreateUser(req, res) {
  const { firstname, lastname, email, password, role } = req.body;

  const currentUser = req.user;
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only admins and managers can create user accounts");
  }

  if (!firstname || !email || !password || !role) {
    throw new ValidationError("First name, email, password, and role are required");
  }

  if (!canManageRole(currentUser.role, role)) {
    throw new AuthorizationError(`Access denied: You cannot create ${role} users`);
  }

  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  const hashpass = await bcrypt.hash(password, 10);
  const userData = {
    firstname: firstname,
    lastname: lastname || '',
    email: email,
    password: hashpass,
    role: role,
  };

  if (req.file) {
    userData.picture = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  const newUser = await User.create(userData);

  let pictureData = null;
  if (newUser.picture && newUser.picture.data) {
    pictureData = {
      data: newUser.picture.data.toString('base64'),
      contentType: newUser.picture.contentType
    };
  }

  const userResponse = {
    _id: newUser._id,
    firstname: newUser.firstname,
    lastname: newUser.lastname,
    email: newUser.email,
    role: newUser.role,
    picture: pictureData,
    createdAt: newUser.createdAt
  };

  return createdResponse(res, 'User created successfully', userResponse);
}

async function handleGetAllUsers(req, res) {
  const currentUser = await User.findById(req.user._id);
  if (!currentUser || !['admin', 'manager', 'qa'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only admins, managers, and QA can view users");
  }

  const { role } = req.query;
  let query = {};

  if (role) {
    if (!canManageRole(currentUser.role, role)) {
      throw new AuthorizationError(`Access denied: You cannot view ${role} users`);
    }
    query.role = role;
  } else {
    if (currentUser.role === 'manager') {
      query.role = { $in: ['qa', 'developer'] };
    } else if (currentUser.role === 'qa') {
      query.role = 'developer';
    }
  }

  const users = await User.find(query).select('-password').sort({ createdAt: -1 });

  const serializedUsers = users.map(user => {
    let pictureData = null;
    if (user.picture && user.picture.data) {
      pictureData = {
        data: user.picture.data.toString('base64'),
        contentType: user.picture.contentType
      };
    }

    return {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      picture: pictureData,
      createdAt: user.createdAt
    };
  });

  return successResponse(res, 200, 'Users retrieved successfully', serializedUsers);
}

async function handleGetUserById(req, res) {
  const { userId } = req.params;
  const currentUser = await User.findById(req.user._id);

  if (!currentUser || !['admin', 'manager', 'qa'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only admins, managers, and QA can view user details");
  }

  if (!userId) {
    throw new ValidationError("User ID is required");
  }

  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!canManageRole(currentUser.role, user.role)) {
    throw new AuthorizationError("Access denied: You cannot view this user");
  }

  let pictureData = null;
  if (user.picture && user.picture.data) {
    pictureData = {
      data: user.picture.data.toString('base64'),
      contentType: user.picture.contentType
    };
  }

  const userResponse = {
    _id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    picture: pictureData,
    createdAt: user.createdAt
  };

  return successResponse(res, 200, 'User retrieved successfully', userResponse);
}

async function handleUpdateUser(req, res) {
  const { userId } = req.params;
  const { firstname, lastname, email, role } = req.body;
  const currentUser = await User.findById(req.user._id);

  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only admins and managers can update users");
  }

  if (!userId) {
    throw new ValidationError("User ID is required");
  }

  const userToUpdate = await User.findById(userId);
  if (!userToUpdate) {
    throw new NotFoundError("User not found");
  }

  if (!canManageRole(currentUser.role, userToUpdate.role)) {
    throw new AuthorizationError("Access denied: You cannot update this user");
  }

  if (role && !canManageRole(currentUser.role, role)) {
    throw new AuthorizationError(`Access denied: You cannot assign ${role} role`);
  }

  if (email && email !== userToUpdate.email) {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }
  }

  if (firstname) userToUpdate.firstname = firstname;
  if (lastname !== undefined) userToUpdate.lastname = lastname;
  if (email) userToUpdate.email = email;
  if (role) userToUpdate.role = role;

  if (req.file) {
    userToUpdate.picture = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  await userToUpdate.save();

  let pictureData = null;
  if (userToUpdate.picture && userToUpdate.picture.data) {
    pictureData = {
      data: userToUpdate.picture.data.toString('base64'),
      contentType: userToUpdate.picture.contentType
    };
  }

  const userResponse = {
    _id: userToUpdate._id,
    firstname: userToUpdate.firstname,
    lastname: userToUpdate.lastname,
    email: userToUpdate.email,
    role: userToUpdate.role,
    picture: pictureData,
    createdAt: userToUpdate.createdAt
  };

  return successResponse(res, 200, 'User updated successfully', userResponse);
}

async function handleDeleteUser(req, res) {
  const { userId } = req.params;
  const currentUser = await User.findById(req.user._id);

  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only admins and managers can delete users");
  }

  if (!userId) {
    throw new ValidationError("User ID is required");
  }

  if (userId === currentUser._id.toString()) {
    throw new ValidationError("You cannot delete your own account");
  }

  const userToDelete = await User.findById(userId);
  if (!userToDelete) {
    throw new NotFoundError("User not found");
  }

  if (!canManageRole(currentUser.role, userToDelete.role)) {
    throw new AuthorizationError("Access denied: You cannot delete this user");
  }

  await User.findByIdAndDelete(userId);

  return successResponse(res, 200, 'User deleted successfully');
}

async function handleGetCurrentUser(req, res) {
  const currentUser = req.user;
  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  const user = await User.findById(currentUser._id).select('-password');
  if (!user) {
    throw new NotFoundError("User not found");
  }

  let pictureData = null;
  if (user.picture && user.picture.data) {
    pictureData = {
      data: user.picture.data.toString('base64'),
      contentType: user.picture.contentType
    };
  }

  const userResponse = {
    _id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    picture: pictureData,
    createdAt: user.createdAt
  };

  return successResponse(res, 200, 'Current user retrieved successfully', userResponse);
}

async function handleUpdateProfile(req, res) {
  const currentUser = req.user;
  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  const { firstname, lastname, email } = req.body;

  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }
  }

  if (firstname) user.firstname = firstname;
  if (lastname !== undefined) user.lastname = lastname;
  if (email) user.email = email;

  if (req.file) {
    user.picture = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  await user.save();

  let pictureData = null;
  if (user.picture && user.picture.data) {
    pictureData = {
      data: user.picture.data.toString('base64'),
      contentType: user.picture.contentType
    };
  }

  const userResponse = {
    _id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    picture: pictureData,
    createdAt: user.createdAt
  };

  return successResponse(res, 200, 'Profile updated successfully', userResponse);
}

module.exports = {
  handleCreateUser: asyncHandler(handleCreateUser),
  handleGetAllUsers: asyncHandler(handleGetAllUsers),
  handleGetUserById: asyncHandler(handleGetUserById),
  handleUpdateUser: asyncHandler(handleUpdateUser),
  handleDeleteUser: asyncHandler(handleDeleteUser),
  handleGetCurrentUser: asyncHandler(handleGetCurrentUser),
  handleUpdateProfile: asyncHandler(handleUpdateProfile)
};
