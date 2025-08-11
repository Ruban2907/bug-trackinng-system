const Project = require("../model/project");
const User = require("../model/user");

function serializeProject(projectDoc) {
  if (!projectDoc) return projectDoc;
  const project = projectDoc.toObject ? projectDoc.toObject() : projectDoc;
  
  // Serialize project picture
  if (project.picture && project.picture.data) {
    project.picture = {
      data: project.picture.data.toString('base64'),
      contentType: project.picture.contentType,
    };
  }
  
  // Serialize user pictures (createdBy, qaAssigned, developersAssigned)
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
}

async function handleCreateProject(req, res) {
  try {
    const { name, description } = req.body;
    // Parse optional arrays flexibly from either JSON or form fields
    let qaAssigned = [];
    let developersAssigned = [];

    if (req.body.qaAssigned) {
      try {
        qaAssigned = Array.isArray(req.body.qaAssigned)
          ? req.body.qaAssigned
          : JSON.parse(req.body.qaAssigned);
      } catch (_) {
        qaAssigned = [];
      }
    }

    if (req.body.developersAssigned) {
      try {
        developersAssigned = Array.isArray(req.body.developersAssigned)
          ? req.body.developersAssigned
          : JSON.parse(req.body.developersAssigned);
      } catch (_) {
        developersAssigned = [];
      }
    }
    
    // Use the user data from the middleware
    const currentUser = req.managerOrAdminUser;
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only managers and admins can create projects" 
      });
    }

    if (!name) {
      return res.status(400).json({ 
        message: "Project name is required" 
      });
    }

    if (qaAssigned && qaAssigned.length > 0) {
      for (const qaId of qaAssigned) {
        const qaUser = await User.findById(qaId);
        if (!qaUser || qaUser.role !== 'qa') {
          return res.status(400).json({ 
            message: `Invalid QA user ID: ${qaId}` 
          });
        }
      }
    }

    if (developersAssigned && developersAssigned.length > 0) {
      if (!qaAssigned || qaAssigned.length === 0) {
        return res.status(400).json({ 
          message: "Developers cannot be assigned before QA team members" 
        });
      }

      for (const devId of developersAssigned) {
        const devUser = await User.findById(devId);
        if (!devUser || devUser.role !== 'developer') {
          return res.status(400).json({ 
            message: `Invalid developer user ID: ${devId}` 
          });
        }
      }
    }

    const projectData = {
      name,
      description: description || '',
      createdBy: currentUser._id,
      qaAssigned: qaAssigned || [],
      developersAssigned: developersAssigned || [],
    };

    // Optional picture
    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'Only image files are allowed for project picture' });
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Project picture must be less than 5MB' });
      }
      projectData.picture = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const newProject = await Project.create(projectData);

    await newProject.populate([
      { path: 'createdBy', select: 'firstname lastname email role' },
      { path: 'qaAssigned', select: 'firstname lastname email role' },
      { path: 'developersAssigned', select: 'firstname lastname email role' }
    ]);

    return res.status(201).json({ 
      message: 'Project created successfully', 
      project: serializeProject(newProject) 
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Internal server error while creating project" });
  }
}

async function handleGetAllProjects(req, res) {
  try {
    // Use the user data from the middleware
    const currentUser = req.managerOrAdminUser;
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only managers and admins can view all projects" 
      });
    }

    const projects = await Project.find()
      .populate('createdBy', 'firstname lastname email role')
      .populate('qaAssigned', 'firstname lastname email role')
      .populate('developersAssigned', 'firstname lastname email role')
      .sort({ createdAt: -1 });

    const serialized = projects.map(serializeProject);

    return res.status(200).json({ 
      message: 'Projects retrieved successfully', 
      projects: serialized 
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({ message: "Internal server error while retrieving projects" });
  }
}

async function handleGetAssignedProjects(req, res) {
  try {
    // Use the user data from the middleware
    const currentUser = req.currentUser;
    if (!currentUser || !['qa', 'developer'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only QA engineers and developers can access this endpoint" 
      });
    }

    const projects = await Project.find()
      .populate('createdBy', 'firstname lastname email role')
      .populate('qaAssigned', 'firstname lastname email role picture')
      .populate('developersAssigned', 'firstname lastname email role picture')
      .sort({ createdAt: -1 });

    // Filter projects based on user role
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

    return res.status(200).json({ 
      message: 'Assigned projects retrieved successfully', 
      projects: serialized 
    });
  } catch (error) {
    console.error("Get assigned projects error:", error);
    res.status(500).json({ message: "Internal server error while retrieving assigned projects" });
  }
}

async function handleGetProjectById(req, res) {
  try {
    const { projectId } = req.params;
    
    // Use the user data from the middleware
    const currentUser = req.managerOrAdminUser;
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only managers and admins can view project details" 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        message: "Project ID is required" 
      });
    }

    const project = await Project.findById(projectId)
      .populate('createdBy', 'firstname lastname email role picture')
      .populate('qaAssigned', 'firstname lastname email role picture')
      .populate('developersAssigned', 'firstname lastname email role picture');

    if (!project) {
      return res.status(404).json({ 
        message: "Project not found" 
      });
    }

    return res.status(200).json({ 
      message: 'Project retrieved successfully', 
      project: serializeProject(project) 
    });
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({ message: "Internal server error while retrieving project" });
  }
}

async function handleUpdateProject(req, res) {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    let qaAssigned = undefined;
    let developersAssigned = undefined;

    if (req.body.qaAssigned !== undefined) {
      try {
        qaAssigned = Array.isArray(req.body.qaAssigned)
          ? req.body.qaAssigned
          : JSON.parse(req.body.qaAssigned);
      } catch (_) {
        qaAssigned = [];
      }
    }
    if (req.body.developersAssigned !== undefined) {
      try {
        developersAssigned = Array.isArray(req.body.developersAssigned)
          ? req.body.developersAssigned
          : JSON.parse(req.body.developersAssigned);
      } catch (_) {
        developersAssigned = [];
      }
    }
    
    // Use the user data from the middleware
    const currentUser = req.managerOrAdminUser;
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only managers and admins can update projects" 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        message: "Project ID is required" 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        message: "Project not found" 
      });
    }

    if (qaAssigned && qaAssigned.length > 0) {
      for (const qaId of qaAssigned) {
        const qaUser = await User.findById(qaId);
        if (!qaUser || qaUser.role !== 'qa') {
          return res.status(400).json({ 
            message: `Invalid QA user ID: ${qaId}` 
          });
        }
      }
    }

    if (developersAssigned && developersAssigned.length > 0) {
      const finalQaAssigned = qaAssigned || project.qaAssigned;
      if (!finalQaAssigned || finalQaAssigned.length === 0) {
        return res.status(400).json({ 
          message: "Developers cannot be assigned before QA team members" 
        });
      }

      for (const devId of developersAssigned) {
        const devUser = await User.findById(devId);
        if (!devUser || devUser.role !== 'developer') {
          return res.status(400).json({ 
            message: `Invalid developer user ID: ${devId}` 
          });
        }
      }
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (qaAssigned !== undefined) project.qaAssigned = qaAssigned;
    if (developersAssigned !== undefined) project.developersAssigned = developersAssigned;

    // Optional picture update
    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'Only image files are allowed for project picture' });
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Project picture must be less than 5MB' });
      }
      project.picture = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await project.save();

    await project.populate([
      { path: 'createdBy', select: 'firstname lastname email role' },
      { path: 'qaAssigned', select: 'firstname lastname email role' },
      { path: 'developersAssigned', select: 'firstname lastname email role' }
    ]);

    return res.status(200).json({ 
      message: 'Project updated successfully', 
      project: serializeProject(project) 
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ message: "Internal server error while updating project" });
  }
}

async function handleDeleteProject(req, res) {
  try {
    const { projectId } = req.params;
    
    // Use the user data from the middleware
    const currentUser = req.managerOrAdminUser;
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only managers and admins can delete projects" 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        message: "Project ID is required" 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        message: "Project not found" 
      });
    }

    await Project.findByIdAndDelete(projectId);

    return res.status(200).json({ 
      message: 'Project deleted successfully' 
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Internal server error while deleting project" });
  }
}

async function handleAssignQA(req, res) {
  try {
    const { projectId } = req.params;
    const { qaIds } = req.body; 
    
    // Use the user data from the middleware
    const currentUser = req.managerOrAdminUser;
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only managers and admins can assign QA to projects" 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        message: "Project ID is required" 
      });
    }

    if (!qaIds || !Array.isArray(qaIds) || qaIds.length === 0) {
      return res.status(400).json({ 
        message: "QA IDs array is required and must not be empty" 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        message: "Project not found" 
      });
    }

    for (const qaId of qaIds) {
      const qaUser = await User.findById(qaId);
      if (!qaUser || qaUser.role !== 'qa') {
        return res.status(400).json({ 
          message: `Invalid QA user ID: ${qaId}` 
        });
      }
    }

    project.qaAssigned = qaIds;
    await project.save();

    await project.populate([
      { path: 'createdBy', select: 'firstname lastname email role' },
      { path: 'qaAssigned', select: 'firstname lastname email role' },
      { path: 'developersAssigned', select: 'firstname lastname email role' }
    ]);

    return res.status(200).json({ 
      message: 'QA team assigned successfully', 
      project: serializeProject(project) 
    });
  } catch (error) {
    console.error("Assign QA error:", error);
    res.status(500).json({ message: "Internal server error while assigning QA" });
  }
}

async function handleAssignDevelopers(req, res) {
  try {
    const { projectId } = req.params;
    const { developerIds } = req.body; 
    
    // Use the user data from the middleware
    const currentUser = req.managerOrAdminUser;
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ 
        message: "Access denied: Only managers and admins can assign developers to projects" 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        message: "Project ID is required" 
      });
    }

    if (!developerIds || !Array.isArray(developerIds) || developerIds.length === 0) {
      return res.status(400).json({ 
        message: "Developer IDs array is required and must not be empty" 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        message: "Project not found" 
      });
    }

    if (!project.qaAssigned || project.qaAssigned.length === 0) {
      return res.status(400).json({ 
        message: "Developers cannot be assigned before QA team members" 
      });
    }

    for (const devId of developerIds) {
      const devUser = await User.findById(devId);
      if (!devUser || devUser.role !== 'developer') {
        return res.status(400).json({ 
          message: `Invalid developer user ID: ${devId}` 
        });
      }
    }

    project.developersAssigned = developerIds;
    await project.save();

    await project.populate([
      { path: 'createdBy', select: 'firstname lastname email role' },
      { path: 'qaAssigned', select: 'firstname lastname email role' },
      { path: 'developersAssigned', select: 'firstname lastname email role' }
    ]);

    return res.status(200).json({ 
      message: 'Developers assigned successfully', 
      project: serializeProject(project) 
    });
  } catch (error) {
    console.error("Assign developers error:", error);
    res.status(500).json({ message: "Internal server error while assigning developers" });
  }
}

module.exports = {
  handleCreateProject,
  handleGetAllProjects,
  handleGetAssignedProjects,
  handleGetProjectById,
  handleUpdateProject,
  handleDeleteProject,
  handleAssignQA,
  handleAssignDevelopers
};
