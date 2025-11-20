const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    res.json({ status: 'Database connected', userCount });
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Basic test route
app.get('/', (req, res) => {
  res.json({
    message: 'FollowPro Backend API',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

// Import and setup routes
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

// Setup auth routes
authRoutes(app);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    res.json({ status: 'Database connected', userCount });
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// USER ROUTES
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true, skills: true, verified: true, profileCompleted: true, createdAt: true }
    });
    res.json(user);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { name, skills } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, skills, profileCompleted: true },
      select: { id: true, name: true, email: true, role: true, skills: true, verified: true, profileCompleted: true, createdAt: true }
    });
    res.json(user);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/all', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, skills: true, verified: true, profileCompleted: true, createdAt: true }
    });
    res.json(users);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/tasks', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const tasks = await prisma.task.findMany({
      where: { assignedTo: req.userId },
      include: { project: { select: { title: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/tasks/:taskId/status', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { taskId } = req.params;
    const { status } = req.body;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assignedTo !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: { project: { select: { title: true } } }
    });
    res.json(updatedTask);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN ROUTES - Projects
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { title, description, startDate, endDate } = req.body;
    const project = await prisma.project.create({
      data: {
        title, description, adminId: req.userId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: { admin: { select: { name: true, email: true } } }
    });
    res.status(201).json(project);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const projects = await prisma.project.findMany({
      where: { adminId: req.userId },
      include: {
        admin: { select: { name: true, email: true } },
        tasks: { select: { id: true, status: true } }
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
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, adminId: req.userId },
      include: {
        admin: { select: { name: true, email: true } },
        tasks: { include: { assignee: { select: { name: true, email: true, role: true } } } }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { title, description, startDate, endDate } = req.body;
    const project = await prisma.project.updateMany({
      where: { id: req.params.id, adminId: req.userId },
      data: {
        title, description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });
    if (project.count === 0) return res.status(404).json({ error: 'Project not found' });
    const updatedProject = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { admin: { select: { name: true, email: true } } }
    });
    res.json(updatedProject);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const project = await prisma.project.deleteMany({
      where: { id: req.params.id, adminId: req.userId }
    });
    if (project.count === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN ROUTES - Tasks
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { projectId, title, description, assignedTo, category, deadline } = req.body;
    const project = await prisma.project.findFirst({ where: { id: projectId, adminId: req.userId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const task = await prisma.task.create({
      data: {
        projectId, title, description,
        assignedTo: assignedTo || null, category,
        deadline: deadline ? new Date(deadline) : null
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true, email: true, role: true } }
      }
    });
    res.status(201).json(task);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const adminProjects = await prisma.project.findMany({
      where: { adminId: req.userId },
      select: { id: true }
    });
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: adminProjects.map(p => p.id) } },
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { title: true, adminId: true } },
        assignee: { select: { name: true, email: true, role: true } }
      }
    });
    if (!task || task.project.adminId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { title, description, assignedTo, status, category, deadline } = req.body;
    const existingTask = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    });
    if (!existingTask || existingTask.project.adminId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title, description, assignedTo: assignedTo || null,
        status, category, deadline: deadline ? new Date(deadline) : null
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true, email: true, role: true } }
      }
    });
    res.json(task);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    });
    if (!task || task.project.adminId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted successfully' });
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN ROUTES - Skills
app.get('/api/admin/skills', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
    res.json(skills);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/skills', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { name, category } = req.body;
    const skill = await prisma.skill.create({ data: { name, category } });
    res.status(201).json(skill);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/skills/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { name, category } = req.body;
    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data: { name, category }
    });
    res.json(skill);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/skills/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.skill.delete({ where: { id: req.params.id } });
    res.json({ message: 'Skill deleted successfully' });
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN ROUTES - Categories
app.get('/api/admin/categories', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/categories', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { name } = req.body;
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { name } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.json(category);
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted successfully' });
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

try {
  const userRoutes = require('../src/routes/users');
  const projectRoutes = require('../src/routes/projects');
  const taskRoutes = require('../src/routes/tasks');
  const skillRoutes = require('../src/routes/skills');
  const categoryRoutes = require('../src/routes/categories');

  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/admin/skills', skillRoutes);
  app.use('/api/admin/categories', categoryRoutes);
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Failed to load some routes:', error.message);
}

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;