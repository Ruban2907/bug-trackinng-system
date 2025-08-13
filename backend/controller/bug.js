const Bug = require("../model/bug");
const Project = require("../model/project");
const User = require("../model/user");
const { successResponse, createdResponse, errorResponse, notFoundResponse, forbiddenResponse, validationErrorResponse } = require("../utils/responseHandler");
const { ValidationError, AuthorizationError, NotFoundError } = require("../utils/errors");
const { asyncHandler } = require("../middleware/errorHandler");

const serializeBug = (bug) => {
  const bugObj = bug.toObject();
  if (bugObj.screenshot && bugObj.screenshot.data) {
    bugObj.screenshot.data = bugObj.screenshot.data.toString('base64');
  }
  return bugObj;
};

const checkProjectAccess = (currentUser, project) => {
  return currentUser.role === 'admin' ||
         currentUser.role === 'manager' ||
         project.qaAssigned.some(qa => qa._id ? qa._id.toString() === currentUser._id.toString() : qa.toString() === currentUser._id.toString()) ||
         project.developersAssigned.some(dev => dev._id ? dev._id.toString() === currentUser._id.toString() : dev.toString() === currentUser._id.toString());
};

const isDeveloperInProject = (project, developerId) => {
  return project.developersAssigned.some(dev => 
    dev._id ? dev._id.toString() === developerId : dev.toString() === developerId
  );
};

const populateBug = async (bug) => {
  return await bug.populate([
    { path: 'createdBy', select: 'firstname lastname email role' },
    { path: 'assignedTo', select: 'firstname lastname email role' },
    { path: 'projectId', select: 'name developersAssigned' }
  ]);
};

async function handleCreateBug(req, res) {
  const { title, type, status, description, deadline, projectId, assignedTo } = req.body;

  const currentUser = req.user;
  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  if (currentUser.role === 'developer') {
    throw new AuthorizationError("Access denied: Developers cannot create bugs");
  }

  if (!title || !type || !projectId) {
    throw new ValidationError("Title, type, and projectId are required");
  }

  const project = await Project.findById(projectId)
    .populate('qaAssigned', '_id')
    .populate('developersAssigned', '_id');

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!checkProjectAccess(currentUser, project)) {
    throw new AuthorizationError("Access denied: You can only create bugs in projects assigned to you");
  }

  if (!project.developersAssigned || project.developersAssigned.length === 0) {
    throw new ValidationError("Cannot create bug: No developers are assigned to this project");
  }

  let assignedDeveloperId;

  if (assignedTo) {
    if (!isDeveloperInProject(project, assignedTo)) {
      throw new ValidationError("Assigned developer is not part of this project");
    }

    const assignedDeveloper = await User.findById(assignedTo);
    if (!assignedDeveloper || assignedDeveloper.role !== 'developer') {
      throw new ValidationError("Assigned user must be a developer");
    }

    assignedDeveloperId = assignedTo;
  } else {
    assignedDeveloperId = project.developersAssigned[0]._id;
  }

  const bugData = {
    title,
    type,
    status: status || 'new',
    description: description || '',
    deadline: deadline || null,
    projectId,
    createdBy: currentUser._id,
    assignedTo: assignedDeveloperId,
  };

  if (req.file) {
    bugData.screenshot = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  const newBug = await Bug.create(bugData);
  await populateBug(newBug);

  return createdResponse(res, 'Bug created successfully', serializeBug(newBug));
}

async function handleGetAllBugs(req, res) {
  const { projectId } = req.query;
  const currentUser = req.user;

  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  let query = {};
  if (projectId) {
    query.projectId = projectId;
  }

  if (currentUser.role === 'developer') {
    query.assignedTo = currentUser._id;
  } else if (currentUser.role === 'qa') {
    const userProjects = await Project.find({
      qaAssigned: currentUser._id
    }).select('_id');
    query.projectId = { $in: userProjects.map(p => p._id) };
  }

  const bugs = await Bug.find(query)
    .populate('createdBy', 'firstname lastname email role')
    .populate('assignedTo', 'firstname lastname email role')
    .populate('projectId', 'name developersAssigned')
    .sort({ createdAt: -1 });

  const serialized = bugs.map(serializeBug);

  return successResponse(res, 200, 'Bugs retrieved successfully', serialized);
}

async function handleGetBugById(req, res) {
  const { bugId } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  if (!bugId) {
    throw new ValidationError("Bug ID is required");
  }

  const bug = await Bug.findById(bugId)
    .populate('createdBy', 'firstname lastname email role')
    .populate('assignedTo', 'firstname lastname email role')
    .populate('projectId', 'name developersAssigned');

  if (!bug) {
    throw new NotFoundError("Bug not found");
  }

  if (currentUser.role === 'developer' && bug.assignedTo._id.toString() !== currentUser._id.toString()) {
    throw new AuthorizationError("Access denied: You can only view bugs assigned to you");
  }

  if (currentUser.role === 'qa') {
    const project = await Project.findById(bug.projectId._id);
    if (!project.qaAssigned.some(qa => qa.toString() === currentUser._id.toString())) {
      throw new AuthorizationError("Access denied: You can only view bugs in projects assigned to you");
    }
  }

  return successResponse(res, 200, 'Bug retrieved successfully', serializeBug(bug));
}

async function handleUpdateBug(req, res) {
  const { bugId } = req.params;
  const { title, type, status, description, deadline, assignedTo } = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  if (!bugId) {
    throw new ValidationError("Bug ID is required");
  }

  const bug = await Bug.findById(bugId);
  if (!bug) {
    throw new NotFoundError("Bug not found");
  }

  if (currentUser.role === 'developer') {
    if (bug.assignedTo.toString() !== currentUser._id.toString()) {
      throw new AuthorizationError("Access denied: You can only update bugs assigned to you");
    }
    if (title || type || assignedTo) {
      throw new AuthorizationError("Access denied: Developers can only update status and description");
    }
  }

  if (currentUser.role === 'qa') {
    const project = await Project.findById(bug.projectId);
    if (!project.qaAssigned.some(qa => qa.toString() === currentUser._id.toString())) {
      throw new AuthorizationError("Access denied: You can only update bugs in projects assigned to you");
    }
  }

  if (title) bug.title = title;
  if (type) bug.type = type;
  if (status) bug.status = status;
  if (description !== undefined) bug.description = description;
  if (deadline !== undefined) bug.deadline = deadline;

  if (assignedTo && currentUser.role !== 'developer') {
    const project = await Project.findById(bug.projectId);
    if (!project.developersAssigned.some(dev => dev.toString() === assignedTo)) {
      throw new ValidationError("Assigned developer must be part of the project");
    }
    bug.assignedTo = assignedTo;
  }

  if (req.file) {
    bug.screenshot = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  await bug.save();
  await populateBug(bug);

  return successResponse(res, 200, 'Bug updated successfully', serializeBug(bug));
}

async function handleDeleteBug(req, res) {
  const { bugId } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  if (!bugId) {
    throw new ValidationError("Bug ID is required");
  }

  const bug = await Bug.findById(bugId);
  if (!bug) {
    throw new NotFoundError("Bug not found");
  }

  if (currentUser.role === 'developer') {
    throw new AuthorizationError("Access denied: Developers cannot delete bugs");
  }

  if (currentUser.role === 'qa') {
    const project = await Project.findById(bug.projectId);
    if (!project.qaAssigned.some(qa => qa.toString() === currentUser._id.toString())) {
      throw new AuthorizationError("Access denied: You can only delete bugs in projects assigned to you");
    }
  }

  await Bug.findByIdAndDelete(bugId);

  return successResponse(res, 200, 'Bug deleted successfully');
}

async function handleUpdateBugStatus(req, res) {
  const { bugId } = req.params;
  const { status } = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new AuthorizationError("User not authenticated");
  }

  if (!bugId) {
    throw new ValidationError("Bug ID is required");
  }

  if (!status) {
    throw new ValidationError("Status is required");
  }

  const bug = await Bug.findById(bugId);
  if (!bug) {
    throw new NotFoundError("Bug not found");
  }

  if (currentUser.role === 'developer') {
    if (bug.assignedTo.toString() !== currentUser._id.toString()) {
      throw new AuthorizationError("Access denied: You can only update bugs assigned to you");
    }
  }

  if (currentUser.role === 'qa') {
    const project = await Project.findById(bug.projectId);
    if (!project.qaAssigned.some(qa => qa.toString() === currentUser._id.toString())) {
      throw new AuthorizationError("Access denied: You can only update bugs in projects assigned to you");
    }
  }

  bug.status = status;
  await bug.save();
  await populateBug(bug);

  return successResponse(res, 200, 'Bug status updated successfully', serializeBug(bug));
}



module.exports = {
  handleCreateBug: asyncHandler(handleCreateBug),
  handleGetAllBugs: asyncHandler(handleGetAllBugs),
  handleGetBugById: asyncHandler(handleGetBugById),
  handleUpdateBug: asyncHandler(handleUpdateBug),
  handleDeleteBug: asyncHandler(handleDeleteBug),
  handleUpdateBugStatus: asyncHandler(handleUpdateBugStatus)
};
