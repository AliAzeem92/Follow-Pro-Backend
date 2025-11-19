const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, title, description, assignedTo, category, deadline } = req.body;

    // Verify project belongs to admin
    const project = await prisma.project.findFirst({
      where: { id: projectId, adminId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assignedTo: assignedTo || null,
        category,
        deadline: deadline ? new Date(deadline) : null
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true, email: true, role: true } }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId, status, assignedTo } = req.query;
    
    const where = {};
    if (projectId) {
      // Verify project belongs to admin
      const project = await prisma.project.findFirst({
        where: { id: projectId, adminId: req.user.id }
      });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      where.projectId = projectId;
    } else {
      // Get tasks from all admin's projects
      const adminProjects = await prisma.project.findMany({
        where: { adminId: req.user.id },
        select: { id: true }
      });
      where.projectId = { in: adminProjects.map(p => p.id) };
    }

    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { 
          select: { title: true, adminId: true }
        },
        assignee: { select: { name: true, email: true, role: true } }
      }
    });

    if (!task || task.project.adminId !== req.user.id) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, assignedTo, status, category, deadline } = req.body;

    // Verify task belongs to admin's project
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!existingTask || existingTask.project.adminId !== req.user.id) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        assignedTo: assignedTo || null,
        status,
        category,
        deadline: deadline ? new Date(deadline) : null
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true, email: true, role: true } }
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify task belongs to admin's project
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!task || task.project.adminId !== req.user.id) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask
};