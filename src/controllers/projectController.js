const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, startDate, endDate } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        adminId: req.user.id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: { admin: { select: { name: true, email: true } } }
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { adminId: req.user.id },
      include: {
        admin: { select: { name: true, email: true } },
        tasks: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const projectsWithStats = projects.map(project => ({
      ...project,
      taskStats: {
        total: project.tasks.length,
        todo: project.tasks.filter(t => t.status === 'TODO').length,
        inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
        complete: project.tasks.filter(t => t.status === 'COMPLETE').length
      }
    }));

    res.json(projectsWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, adminId: req.user.id },
      include: {
        admin: { select: { name: true, email: true } },
        tasks: {
          include: {
            assignee: { select: { name: true, email: true, role: true } }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, startDate, endDate } = req.body;

    const project = await prisma.project.updateMany({
      where: { id, adminId: req.user.id },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });

    if (project.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: { admin: { select: { name: true, email: true } } }
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.deleteMany({
      where: { id, adminId: req.user.id }
    });

    if (project.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
};