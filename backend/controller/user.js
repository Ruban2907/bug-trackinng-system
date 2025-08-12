const User = require("../model/user");
const bcrypt = require('bcrypt');

async function handleCreateUser(req, res) {
  try {
    const { firstname, lastname, email, password, role } = req.body;

    const currentUser = await User.findById(req.user._id);
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({
        message: "Access denied: Only admins and managers can create user accounts"
      });
    }

    if (!firstname || !email || !password || !role) {
      return res.status(400).json({
        message: "First name, email, password, and role are required"
      });
    }

    const canCreateRole = (currentUserRole, requestedRole) => {
      switch (currentUserRole) {
        case 'admin':
          return ['manager', 'qa', 'developer'].includes(requestedRole);
        case 'manager':
          return ['qa', 'developer'].includes(requestedRole);
        default:
          return false;
      }
    };

    if (!canCreateRole(currentUser.role, role)) {
      return res.status(403).json({
        message: `Access denied: You cannot create ${role} users`
      });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
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

    return res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error while creating user" });
  }
}

async function handleGetAllUsers(req, res) {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser || !['admin', 'manager', 'qa'].includes(currentUser.role)) {
      return res.status(403).json({
        message: "Access denied: Only admins, managers, and QA can view users"
      });
    }

    const { role } = req.query;

    let query = {};

    if (role) {
      const canAccessRole = (currentUserRole, requestedRole) => {
        switch (currentUserRole) {
          case 'admin':
            return ['manager', 'qa', 'developer'].includes(requestedRole);
          case 'manager':
            return ['qa', 'developer'].includes(requestedRole);
          default:
            return false;
        }
      };

      if (!canAccessRole(currentUser.role, role)) {
        return res.status(403).json({
          message: `Access denied: You cannot view ${role} users`
        });
      }

      query.role = role;
    } else {
      switch (currentUser.role) {
        case 'admin':
          query.role = { $in: ['manager', 'qa', 'developer'] };
          break;
        case 'manager':
          query.role = { $in: ['qa', 'developer'] };
          break;
        default:
          return res.status(403).json({
            message: "Access denied: You cannot view any users"
          });
      }
    }

    const users = await User.find(query, { password: 0 }).sort({ createdAt: -1 });

    const usersWithBase64Pictures = users.map(user => {
      const userObj = user.toObject();
      if (userObj.picture && userObj.picture.data) {
        userObj.picture = {
          data: userObj.picture.data.toString('base64'),
          contentType: userObj.picture.contentType
        };
      }
      return userObj;
    });

    return res.status(200).json({
      message: 'Users retrieved successfully',
      users: usersWithBase64Pictures
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error while retrieving users" });
  }
}

async function handleGetUserById(req, res) {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id);
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({
        message: "Access denied: Only managers and admins can view user details"
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required"
      });
    }

    const user = await User.findById(userId, { password: 0 });
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!['qa', 'developer'].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied: Can only view QA and Developer users"
      });
    }

    const userObj = user.toObject();
    if (userObj.picture && userObj.picture.data) {
      userObj.picture = {
        data: userObj.picture.data.toString('base64'),
        contentType: userObj.picture.contentType
      };
    }

    return res.status(200).json({
      message: 'User retrieved successfully',
      user: userObj
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Internal server error while retrieving user" });
  }
}

async function handleUpdateUser(req, res) {
  try {
    const { userId } = req.params;
    const { firstname, lastname, email, password, role } = req.body;

    const currentUser = req.currentUser;
    if (!currentUser || !['admin', 'manager', 'qa'].includes(currentUser.role)) {
      return res.status(403).json({
        message: "Access denied: Only admins, managers, and QA can update users"
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required"
      });
    }



    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const canUpdateRole = (currentUserRole, targetUserRole) => {
      switch (currentUserRole) {
        case 'admin':
          return ['manager', 'qa', 'developer'].includes(targetUserRole);
        case 'manager':
          return ['qa', 'developer'].includes(targetUserRole);
        default:
          return false;
      }
    };

    if (!canUpdateRole(currentUser.role, user.role)) {
      return res.status(403).json({
        message: `Access denied: You cannot update ${user.role} users`
      });
    }

    if (role && role !== user.role) {
      const canCreateRole = (currentUserRole, requestedRole) => {
        switch (currentUserRole) {
          case 'admin':
            return ['manager', 'qa', 'developer'].includes(requestedRole);
          case 'manager':
            return ['qa', 'developer'].includes(requestedRole);
          default:
            return false;
        }
      };

      if (!canCreateRole(currentUser.role, role)) {
        return res.status(403).json({
          message: `Access denied: You cannot assign ${role} role`
        });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({
          message: "User with this email already exists"
        });
      }
    }

    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) {
      const hashpass = await bcrypt.hash(password, 10);
      user.password = hashpass;
    }
    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          message: "Only image files are allowed"
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          message: "Image size should be less than 5MB"
        });
      }

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

    return res.status(200).json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error("Update user error:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid user ID format"
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    res.status(500).json({ message: "Internal server error while updating user" });
  }
}

async function handleGetCurrentUser(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Invalid authentication token"
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
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

    return res.status(200).json({
      message: 'User data retrieved successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: "Internal server error while retrieving user data" });
  }
}



async function handleUpdateProfile(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Invalid authentication token"
      });
    }

    const { firstname, lastname, email } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!firstname || !email) {
      return res.status(400).json({
        message: "First name and email are required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    if (email !== user.email) {
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({
          message: "User with this email already exists"
        });
      }
    }

    user.firstname = firstname.trim();
    user.lastname = (lastname || '').trim();
    user.email = email.trim();

    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          message: "Only image files are allowed"
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          message: "File size must be less than 5MB"
        });
      }

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
      picture: pictureData
    };

    return res.status(200).json({
      message: 'Profile updated successfully',
      foundUser: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        details: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid user ID format"
      });
    }

    res.status(500).json({ message: "Internal server error while updating profile" });
  }
}

async function handleDeleteUser(req, res) {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id);
    if (!currentUser || !['admin', 'manager', 'qa'].includes(currentUser.role)) {
      return res.status(403).json({
        message: "Access denied: Only admins, managers, and QA can delete users"
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const canDeleteRole = (currentUserRole, targetUserRole) => {
      switch (currentUserRole) {
        case 'admin':
          return ['manager', 'qa', 'developer'].includes(targetUserRole);
        case 'manager':
          return ['qa', 'developer'].includes(targetUserRole);
        default:
          return false;
      }
    };

    if (!canDeleteRole(currentUser.role, user.role)) {
      return res.status(403).json({
        message: `Access denied: You cannot delete ${user.role} users`
      });
    }

    if (userId === req.user._id) {
      return res.status(400).json({
        message: "Cannot delete your own account"
      });
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error while deleting user" });
  }
}



module.exports = {
  handleCreateUser,
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
  handleUpdateProfile,
  handleGetCurrentUser,
  handleDeleteUser
};
