const User = require("../model/user");
const bcrypt = require("bcrypt");
const {
  successResponse,
  createdResponse,
} = require("../utils/responseHandler");
const {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");
const { asyncHandler } = require("../middleware/errorHandler");
const { canManageRole } = require("../utils/helpers");

const ADMIN_OR_MANAGER = ["admin", "manager"];
const ADMIN_MANAGER_QA = ["admin", "manager", "qa"];

const buildPictureData = (user) => {
  if (user && user.picture && user.picture.data) {
    return {
      data: user.picture.data.toString("base64"),
      contentType: user.picture.contentType,
    };
  }
  return null;
};

const serializeUser = (user) => ({
  _id: user._id,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
  role: user.role,
  picture: buildPictureData(user),
  createdAt: user.createdAt,
});

const ensureDbUser = async (maybeUser) => {
  if (maybeUser && maybeUser.role) return maybeUser; // already a full user from middleware
  const user = await User.findById(maybeUser?._id).select("-password");
  if (!user) throw new AuthorizationError("User not authenticated");
  return user;
};

async function handleCreateUser(req, res) {
  const { firstname, lastname, email, password, role } = req.body;

  const currentUser = await ensureDbUser(req.user);
  if (!currentUser || !ADMIN_OR_MANAGER.includes(currentUser.role)) {
    throw new AuthorizationError(
      "Access denied: Only admins and managers can create user accounts"
    );
  }

  if (!firstname || !email || !password || !role) {
    throw new ValidationError(
      "First name, email, password, and role are required"
    );
  }

  if (!canManageRole(currentUser.role, role)) {
    throw new AuthorizationError(
      `Access denied: You cannot create ${role} users`
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  const hashpass = await bcrypt.hash(password, 10);
  const userData = {
    firstname,
    lastname: lastname || "",
    email,
    password: hashpass,
    role,
  };

  if (req.file) {
    userData.picture = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  const newUser = await User.create(userData);

  return createdResponse(
    res,
    "User created successfully",
    serializeUser(newUser)
  );
}

async function handleGetAllUsers(req, res) {
  const currentUser = await ensureDbUser(req.user);
  if (!currentUser || !ADMIN_MANAGER_QA.includes(currentUser.role)) {
    throw new AuthorizationError(
      "Access denied: Only admins, managers, and QA can view users"
    );
  }

  const { role } = req.query;
  if (!role || !canManageRole(currentUser.role, role)) {
    throw new AuthorizationError(
      `Access denied: You cannot view ${role} users`
    );
  }
  let query = { role };

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 });

  const serializedUsers = users.map(serializeUser);
  return successResponse(
    res,
    200,
    "Users retrieved successfully",
    serializedUsers
  );
}

async function handleGetUserById(req, res) {
  const { userId } = req.params;
  const currentUser = await ensureDbUser(req.user);

  if (!currentUser || !ADMIN_MANAGER_QA.includes(currentUser.role)) {
    throw new AuthorizationError(
      "Access denied: Only admins, managers, and QA can view user details"
    );
  }

  if (!userId) {
    throw new ValidationError("User ID is required");
  }

  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!canManageRole(currentUser.role, user.role)) {
    throw new AuthorizationError("Access denied: You cannot view this user");
  }

  return successResponse(
    res,
    200,
    "User retrieved successfully",
    serializeUser(user)
  );
}

async function handleUpdateUser(req, res) {
  const { userId } = req.params;
  const { firstname, lastname, email, role } = req.body;
  const currentUser = await ensureDbUser(req.user);

  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  let userToUpdate;
  let isProfileUpdate = false;

  if (userId) {
    // Updating another user - requires admin/manager role
    if (!ADMIN_OR_MANAGER.includes(currentUser.role)) {
      throw new AuthorizationError(
        "Access denied: Only admins and managers can update other users"
      );
    }

    userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      throw new NotFoundError("User not found");
    }

    if (!canManageRole(currentUser.role, userToUpdate.role)) {
      throw new AuthorizationError(
        "Access denied: You cannot update this user"
      );
    }

    if (role && !canManageRole(currentUser.role, role)) {
      throw new AuthorizationError(
        `Access denied: You cannot assign ${role} role`
      );
    }
  } else {
    // Updating own profile - any authenticated user
    isProfileUpdate = true;
    userToUpdate = currentUser;

    // Profile updates don't allow role changes
    if (role) {
      throw new ValidationError("Role cannot be changed in profile updates");
    }
  }

  if (email && email !== userToUpdate.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }
  }

  if (firstname) userToUpdate.firstname = firstname;
  if (lastname !== undefined) userToUpdate.lastname = lastname;
  if (email) userToUpdate.email = email;
  if (role && !isProfileUpdate) userToUpdate.role = role;

  if (req.file) {
    userToUpdate.picture = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  await userToUpdate.save();

  const message = isProfileUpdate
    ? "Profile updated successfully"
    : "User updated successfully";
  return successResponse(res, 200, message, serializeUser(userToUpdate));
}

async function handleDeleteUser(req, res) {
  const { userId } = req.params;
  const currentUser = await ensureDbUser(req.user);

  if (!currentUser || !ADMIN_OR_MANAGER.includes(currentUser.role)) {
    throw new AuthorizationError(
      "Access denied: Only admins and managers can delete users"
    );
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

  return successResponse(res, 200, "User deleted successfully");
}

async function handleGetCurrentUser(req, res) {
  const user = await ensureDbUser(req.user);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return successResponse(
    res,
    200,
    "Current user retrieved successfully",
    serializeUser(user)
  );
}

module.exports = {
  handleCreateUser: asyncHandler(handleCreateUser),
  handleGetAllUsers: asyncHandler(handleGetAllUsers),
  handleGetUserById: asyncHandler(handleGetUserById),
  handleUpdateUser: asyncHandler(handleUpdateUser),
  handleDeleteUser: asyncHandler(handleDeleteUser),
  handleGetCurrentUser: asyncHandler(handleGetCurrentUser),
};