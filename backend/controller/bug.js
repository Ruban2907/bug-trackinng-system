const Bug = require("../model/bug");
const Project = require("../model/project");
const User = require("../model/user");

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
    { path: 'projectId', select: 'name' }
  ]);
};

async function handleCreateBug(req, res) {
  try {
    const { title, type, status, description, deadline, projectId, assignedTo } = req.body;

    const currentUser = req.currentUser;
    if (!currentUser) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    if (currentUser.role === 'developer') {
      return res.status(403).json({
        message: "Access denied: Developers cannot create bugs"
      });
    }

    if (!title || !type || !projectId) {
      return res.status(400).json({
        message: "Title, type, and projectId are required"
      });
    }

    const project = await Project.findById(projectId)
      .populate('qaAssigned', '_id')
      .populate('developersAssigned', '_id');

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    if (!checkProjectAccess(currentUser, project)) {
      return res.status(403).json({
        message: "Access denied: You can only create bugs in projects assigned to you"
      });
    }

    if (!project.developersAssigned || project.developersAssigned.length === 0) {
      return res.status(400).json({
        message: "Cannot create bug: No developers are assigned to this project"
      });
    }

    let assignedDeveloperId;

    if (assignedTo) {
      if (!isDeveloperInProject(project, assignedTo)) {
        return res.status(400).json({
          message: "Assigned developer is not part of this project"
        });
      }

      const assignedDeveloper = await User.findById(assignedTo);
      if (!assignedDeveloper || assignedDeveloper.role !== 'developer') {
        return res.status(400).json({
          message: "Assigned user must be a developer"
        });
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
      projectId: project._id,
      createdBy: currentUser._id,
      assignedTo: assignedDeveloperId
    };

    if (req.file) {
      bugData.screenshot = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const newBug = await Bug.create(bugData);

    await populateBug(newBug);

    return res.status(201).json({
      message: 'Bug/Feature created successfully',
      bug: serializeBug(newBug)
    });
  } catch (error) {
    console.error("Create bug error:", error);
    res.status(500).json({ message: "Internal server error while creating bug" });
  }
}

async function handleGetAllBugs(req, res) {
  try {
    const { projectId } = req.query;

    const currentUser = req.currentUser;
    if (!currentUser) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    let query = {};

    if (projectId) {
      const project = await Project.findById(projectId)
        .populate('qaAssigned', '_id')
        .populate('developersAssigned', '_id');

      if (!project) {
        return res.status(404).json({
          message: "Project not found"
        });
      }

      if (!checkProjectAccess(currentUser, project)) {
        return res.status(403).json({
          message: "Access denied: You can only view bugs in projects assigned to you"
        });
      }

      query.projectId = projectId;
    } else {
      const projects = await Project.find({
        $or: [
          { qaAssigned: currentUser._id },
          { developersAssigned: currentUser._id }
        ]
      });

      if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        if (projects.length === 0) {
          return res.status(403).json({
            message: "Access denied: You don't have access to any projects"
          });
        }
        query.projectId = { $in: projects.map(p => p._id) };
      }
    }

    const bugs = await Bug.find(query)
      .populate('createdBy', 'firstname lastname email role')
      .populate('assignedTo', 'firstname lastname email role')
      .populate('projectId', 'name')
      .select('+screenshot')
      .sort({ createdAt: -1 });

    const serializedBugs = bugs.map(bug => serializeBug(bug));

    return res.status(200).json({
      message: 'Bugs retrieved successfully',
      bugs: serializedBugs
    });
  } catch (error) {
    console.error("Get all bugs error:", error);
    res.status(500).json({ message: "Internal server error while retrieving bugs" });
  }
}

async function handleGetBugById(req, res) {
  try {
    const { bugId } = req.params;

    const currentUser = req.currentUser;
    if (!currentUser) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    if (!bugId) {
      return res.status(400).json({
        message: "Bug ID is required"
      });
    }

    const bug = await Bug.findById(bugId)
      .populate('createdBy', 'firstname lastname email role')
      .populate('assignedTo', 'firstname lastname email role')
      .populate('projectId', 'name qaAssigned developersAssigned');

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found"
      });
    }

    const project = bug.projectId;
    if (!checkProjectAccess(currentUser, project)) {
      return res.status(403).json({
        message: "Access denied: You can only view bugs in projects assigned to you"
      });
    }

    return res.status(200).json({
      message: 'Bug retrieved successfully',
      bug: serializeBug(bug)
    });
  } catch (error) {
    console.error("Get bug by ID error:", error);
    res.status(500).json({ message: "Internal server error while retrieving bug" });
  }
}

async function handleUpdateBug(req, res) {
  try {
    const { bugId } = req.params;
    const { title, type, status, description, deadline, assignedTo } = req.body;

    const currentUser = req.currentUser;
    if (!currentUser) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    if (!bugId) {
      return res.status(400).json({
        message: "Bug ID is required"
      });
    }

    const bug = await Bug.findById(bugId)
      .populate('projectId', 'qaAssigned developersAssigned');

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found"
      });
    }

    const project = bug.projectId;
    if (!checkProjectAccess(currentUser, project)) {
      return res.status(403).json({
        message: "Access denied: You can only update bugs in projects assigned to you"
      });
    }

    if (currentUser.role === 'developer') {
      if (status) {
        bug.status = status;
      } else {
        return res.status(400).json({
          message: "Developers can only update bug status"
        });
      }
    } else {
      if (title) bug.title = title;
      if (type) bug.type = type;
      if (status) bug.status = status;
      if (description !== undefined) bug.description = description;
      if (deadline !== undefined) bug.deadline = deadline;

      if (assignedTo) {
        if (!isDeveloperInProject(project, assignedTo)) {
          return res.status(400).json({
            message: "Assigned developer must be part of this project"
          });
        }

        bug.assignedTo = assignedTo;
      }

      if (req.file) {
        bug.screenshot = {
          data: req.file.buffer,
          contentType: req.file.mimetype
        };
      }
    }

    await bug.save();

    await populateBug(bug);

    return res.status(200).json({
      message: 'Bug updated successfully',
      bug: serializeBug(bug)
    });
  } catch (error) {
    console.error("Update bug error:", error);
    res.status(500).json({ message: "Internal server error while updating bug" });
  }
}

async function handleDeleteBug(req, res) {
  try {
    const { bugId } = req.params;

    const currentUser = req.currentUser;
    if (!currentUser) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    if (!bugId) {
      return res.status(400).json({
        message: "Bug ID is required"
      });
    }

    const bug = await Bug.findById(bugId)
      .populate('projectId', 'qaAssigned developersAssigned');

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found"
      });
    }

    const project = bug.projectId;
    const hasAccess = 
      currentUser.role === 'admin' ||
      currentUser.role === 'manager' ||
      project.qaAssigned.some(qa => qa.toString() === currentUser._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        message: "Access denied: Only QA, managers, and admins can delete bugs"
      });
    }

    await Bug.findByIdAndDelete(bugId);

    return res.status(200).json({
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    console.error("Delete bug error:", error);
    res.status(500).json({ message: "Internal server error while deleting bug" });
  }
}

async function handleUpdateBugStatus(req, res) {
  try {
    const { bugId } = req.params;
    const { status } = req.body;

    const currentUser = req.currentUser;
    if (!currentUser) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    if (!bugId) {
      return res.status(400).json({
        message: "Bug ID is required"
      });
    }

    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    const bug = await Bug.findById(bugId)
      .populate('projectId', 'qaAssigned developersAssigned');

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found"
      });
    }

    const project = bug.projectId;
    if (!checkProjectAccess(currentUser, project)) {
      return res.status(403).json({
        message: "Access denied: You can only update bugs in projects assigned to you"
      });
    }

    bug.status = status;
    await bug.save();

    await populateBug(bug);

    return res.status(200).json({
      message: 'Bug status updated successfully',
      bug: serializeBug(bug)
    });
  } catch (error) {
    console.error("Update bug status error:", error);
    res.status(500).json({ message: "Internal server error while updating bug status" });
  }
}

async function handleReassignBug(req, res) {
  try {
    const { bugId } = req.params;
    const { assignedTo } = req.body;

    const currentUser = req.currentUser;
    if (!currentUser) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    if (!bugId) {
      return res.status(400).json({
        message: "Bug ID is required"
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        message: "Assigned developer ID is required"
      });
    }

    const bug = await Bug.findById(bugId)
      .populate('projectId', 'qaAssigned developersAssigned');

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found"
      });
    }

    const project = bug.projectId;
    const hasAccess = 
      currentUser.role === 'admin' ||
      currentUser.role === 'manager' ||
      project.qaAssigned.some(qa => qa.toString() === currentUser._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        message: "Access denied: Only QA, managers, and admins can reassign bugs"
      });
    }

    if (!isDeveloperInProject(project, assignedTo)) {
      return res.status(400).json({
        message: "Assigned developer is not part of this project"
      });
    }

    const assignedDeveloper = await User.findById(assignedTo);
    if (!assignedDeveloper || assignedDeveloper.role !== 'developer') {
      return res.status(400).json({
        message: "Assigned user must be a developer"
      });
    }

    bug.assignedTo = assignedTo;
    await bug.save();

    await populateBug(bug);

    return res.status(200).json({
      message: 'Bug reassigned successfully',
      bug: serializeBug(bug)
    });
  } catch (error) {
    console.error("Reassign bug error:", error);
    res.status(500).json({ message: "Internal server error while reassigning bug" });
  }
}

module.exports = {
  handleCreateBug,
  handleGetAllBugs,
  handleGetBugById,
  handleUpdateBug,
  handleDeleteBug,
  handleUpdateBugStatus,
  handleReassignBug
};
