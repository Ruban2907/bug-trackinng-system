const { getUser } = require("../services/secret");
const User = require("../model/user");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  const user = getUser(token);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
  req.user = user;
  next();
}

async function requireManagerOrAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const userData = getUser(token);
    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(userData._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied: Only managers and admins can perform this action"
      });
    }

    req.user = userData;
    req.managerOrAdminUser = user;
    next();
  } catch (error) {
    console.error("Manager/Admin authentication error:", error);
    return res.status(500).json({ message: "Authentication error", error: error.message });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];

    const userData = getUser(token);

    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    const user = await User.findById(userData._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    req.user = userData;
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    return res.status(500).json({ message: "Authentication error", error: error.message });
  }
}

async function requireUser(req, res, next) {
  try {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const userData = getUser(token);
    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(userData._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: "Access denied: Admin users cannot perform this action" });
    }

    req.user = userData;
    req.regularUser = user;
    next();
  } catch (error) {
    console.error("User authentication error:", error);
    return res.status(500).json({ message: "Authentication error", error: error.message });
  }
}

async function requireAnyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const userData = getUser(token);
    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(userData._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = userData;
    req.currentUser = user;
    next();
  } catch (error) {
    console.error("User authentication error:", error);
    return res.status(500).json({ message: "Authentication error", error: error.message });
  }
}

const requireAdminManagerOrQA = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const userData = getUser(token);
    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(userData._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!['admin', 'manager', 'qa'].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied: Only admins, managers, and QA can access this resource"
      });
    }

    req.user = userData;
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('requireAdminManagerOrQA error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireUser,
  requireManagerOrAdmin,
  requireAnyUser,
  requireAdminManagerOrQA
}; 