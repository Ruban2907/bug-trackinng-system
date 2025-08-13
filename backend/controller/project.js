const Project = require("../model/project");
const User = require("../model/user");
const { successResponse, createdResponse, errorResponse, notFoundResponse, forbiddenResponse, validationErrorResponse } = require("../utils/responseHandler");
const { ValidationError, AuthorizationError, NotFoundError } = require("../utils/errors");
const { asyncHandler } = require("../middleware/errorHandler");

const serializeProject = (projectDoc) => {
  if (!projectDoc) return projectDoc;
  const project = projectDoc.toObject ? projectDoc.toObject() : projectDoc;

  if (project.picture && project.picture.data) {
    project.picture = {
      data: project.picture.data.toString('base64'),
      contentType: project.picture.contentType,
    };
  }

  if (project.createdBy && project.createdBy.picture && project.createdBy.picture.data) {
    project.createdBy.picture = {
      data: project.createdBy.picture.data.toString('base64'),
      contentType: project.createdBy.picture.contentType,
    };
  }

  if (project.qaAssigned) {
    project.qaAssigned = project.qaAssigned.map(user => {
      if (user.picture && user.picture.data) {
        return {
          ...user,
          picture: {
            data: user.picture.data.toString('base64'),
            contentType: user.picture.contentType,
          }
        };
      }
      return user;
    });
  }

  if (project.developersAssigned) {
    project.developersAssigned = project.developersAssigned.map(user => {
      if (user.picture && user.picture.data) {
        return {
          ...user,
          picture: {
            data: user.picture.data.toString('base64'),
            contentType: user.picture.contentType,
          }
        };
      }
      return user;
    });
  }

  return project;
};

const validateQAUsers = async (qaIds) => {
  if (!qaIds || qaIds.length === 0) return true;
  
  for (const qaId of qaIds) {
    const qaUser = await User.findById(qaId);
    if (!qaUser || qaUser.role !== 'qa') {
      throw new Error(`Invalid QA user ID: ${qaId}`);
    }
  }
  return true;
};

const validateDeveloperUsers = async (developerIds) => {
  if (!developerIds || developerIds.length === 0) return true;
  
  for (const devId of developerIds) {
    const devUser = await User.findById(devId);
    if (!devUser || devUser.role !== 'developer') {
      throw new Error(`Invalid developer user ID: ${devId}`);
    }
  }
  return true;
};

const populateProject = async (project) => {
  return await project.populate([
    { path: 'createdBy', select: 'firstname lastname email role' },
    { path: 'qaAssigned', select: 'firstname lastname email role' },
    { path: 'developersAssigned', select: 'firstname lastname email role' }
  ]);
};

const populateProjectWithPictures = async (project) => {
  return await project.populate([
    { path: 'createdBy', select: 'firstname lastname email role picture' },
    { path: 'qaAssigned', select: 'firstname lastname email role picture' },
    { path: 'developersAssigned', select: 'firstname lastname email role picture' }
  ]);
};

const validateImageFile = (file) => {
  if (!file.mimetype.startsWith('image/')) {
    throw new Error('Only image files are allowed for project picture');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Project picture must be less than 5MB');
  }
};

const parseArrayField = (fieldValue) => {
  if (!fieldValue) return [];
  
  try {
    return Array.isArray(fieldValue) ? fieldValue : JSON.parse(fieldValue);
  } catch (_) {
    return [];
  }
};

const checkQARequired = (qaAssigned, currentProjectQA = []) => {
  const finalQA = qaAssigned || currentProjectQA;
  if (!finalQA || finalQA.length === 0) {
    throw new Error("Developers cannot be assigned before QA team members");
  }
};

async function handleCreateProject(req, res) {
  const { name, description } = req.body;
  const qaAssigned = parseArrayField(req.body.qaAssigned);
  const developersAssigned = parseArrayField(req.body.developersAssigned);

  const currentUser = req.user;
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only managers and admins can create projects");
  }

  if (!name) {
    throw new ValidationError("Project name is required");
  }

  await validateQAUsers(qaAssigned);

  if (developersAssigned.length > 0) {
    checkQARequired(qaAssigned);
    await validateDeveloperUsers(developersAssigned);
  }

  const projectData = {
    name,
    description: description || '',
    createdBy: currentUser._id,
    qaAssigned: qaAssigned || [],
    developersAssigned: developersAssigned || [],
  };

  if (req.file) {
    try {
      validateImageFile(req.file);
      projectData.picture = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    } catch (error) {
      throw new ValidationError(error.message);
    }
  }

  const newProject = await Project.create(projectData);
  await populateProject(newProject);

  return createdResponse(res, 'Project created successfully', serializeProject(newProject));
}

async function handleGetAllProjects(req, res) {
  const currentUser = req.user;
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only managers and admins can view all projects");
  }

  const projects = await Project.find()
    .populate('createdBy', 'firstname lastname email role')
    .populate('qaAssigned', 'firstname lastname email role')
    .populate('developersAssigned', 'firstname lastname email role')
    .sort({ createdAt: -1 });

  const serialized = projects.map(serializeProject);

  return successResponse(res, 200, "Projects retrieved successfully", serialized);
}

async function handleGetAssignedProjects(req, res) {
  const currentUser = req.user;
  if (!currentUser || !['qa', 'developer'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only QA engineers and developers can access this endpoint");
  }

  const projects = await Project.find()
    .populate('createdBy', 'firstname lastname email role')
    .populate('qaAssigned', 'firstname lastname email role picture')
    .populate('developersAssigned', 'firstname lastname email role picture')
    .sort({ createdAt: -1 });

  let assignedProjects = [];
  if (currentUser.role === 'qa') {
    assignedProjects = projects.filter(project =>
      project.qaAssigned &&
      project.qaAssigned.some(qa => qa._id.toString() === currentUser._id.toString())
    );
  } else if (currentUser.role === 'developer') {
    assignedProjects = projects.filter(project =>
      project.developersAssigned &&
      project.developersAssigned.some(dev => dev._id.toString() === currentUser._id.toString())
    );
  }

  const serialized = assignedProjects.map(serializeProject);

  return successResponse(res, 200, 'Assigned projects retrieved successfully', serialized);
}

async function handleGetProjectById(req, res) {
  const { projectId } = req.params;

  if (!projectId) {
    throw new ValidationError("Project ID is required");
  }

  const project = await Project.findById(projectId)
    .populate('createdBy', 'firstname lastname email role picture')
    .populate('qaAssigned', 'firstname lastname email role picture')
    .populate('developersAssigned', 'firstname lastname email role picture');

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return successResponse(res, 200, 'Project retrieved successfully', serializeProject(project));
}

async function handleUpdateProject(req, res) {
  const { projectId } = req.params;
  const { name, description } = req.body;
  const qaAssigned = req.body.qaAssigned !== undefined ? parseArrayField(req.body.qaAssigned) : undefined;
  const developersAssigned = req.body.developersAssigned !== undefined ? parseArrayField(req.body.developersAssigned) : undefined;

  const currentUser = req.user;
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only managers and admins can update projects");
  }

  if (!projectId) {
    throw new ValidationError("Project ID is required");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (qaAssigned && qaAssigned.length > 0) {
    await validateQAUsers(qaAssigned);
  }

  if (developersAssigned && developersAssigned.length > 0) {
    checkQARequired(qaAssigned, project.qaAssigned);
    await validateDeveloperUsers(developersAssigned);
  }

  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (qaAssigned !== undefined) project.qaAssigned = qaAssigned;
  if (developersAssigned !== undefined) project.developersAssigned = developersAssigned;

  if (req.file) {
    try {
      validateImageFile(req.file);
      project.picture = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    } catch (error) {
      throw new ValidationError(error.message);
    }
  }

  await project.save();
  await populateProject(project);

  return successResponse(res, 200, 'Project updated successfully', serializeProject(project));
}

async function handleDeleteProject(req, res) {
  const { projectId } = req.params;

  const currentUser = req.user;
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only managers and admins can delete projects");
  }

  if (!projectId) {
    throw new ValidationError("Project ID is required");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  await Project.findByIdAndDelete(projectId);

  return successResponse(res, 200, 'Project deleted successfully');
}

async function handleAssignQA(req, res) {
  const { projectId } = req.params;
  const { qaIds } = req.body;

  const currentUser = req.user;
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only managers and admins can assign QA to projects");
  }

  if (!projectId) {
    throw new ValidationError("Project ID is required");
  }

  if (!qaIds || !Array.isArray(qaIds) || qaIds.length === 0) {
    throw new ValidationError("QA IDs array is required and must not be empty");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  await validateQAUsers(qaIds);

  project.qaAssigned = qaIds;
  await project.save();
  await populateProject(project);

  return successResponse(res, 200, 'QA team assigned successfully', serializeProject(project));
}

async function handleAssignDevelopers(req, res) {
  const { projectId } = req.params;
  const { developerIds } = req.body;

  const currentUser = req.user;
  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    throw new AuthorizationError("Access denied: Only managers and admins can assign developers to projects");
  }

  if (!projectId) {
    throw new ValidationError("Project ID is required");
  }

  if (!developerIds || !Array.isArray(developerIds) || developerIds.length === 0) {
    throw new ValidationError("Developer IDs array is required and must not be empty");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  checkQARequired(undefined, project.qaAssigned);
  await validateDeveloperUsers(developerIds);

  project.developersAssigned = developerIds;
  await project.save();
  await populateProject(project);

  return successResponse(res, 200, 'Developers assigned successfully', serializeProject(project));
}

module.exports = {
  handleCreateProject: asyncHandler(handleCreateProject),
  handleGetAllProjects: asyncHandler(handleGetAllProjects),
  handleGetAssignedProjects: asyncHandler(handleGetAssignedProjects),
  handleGetProjectById: asyncHandler(handleGetProjectById),
  handleUpdateProject: asyncHandler(handleUpdateProject),
  handleDeleteProject: asyncHandler(handleDeleteProject),
  handleAssignQA: asyncHandler(handleAssignQA),
  handleAssignDevelopers: asyncHandler(handleAssignDevelopers)
};
