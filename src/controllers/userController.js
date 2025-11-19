const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        skills: true, 
        verified: true,
        profileCompleted: true,
        createdAt: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, skills } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        name, 
        skills, 
        profileCompleted: true 
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        skills: true, 
        verified: true,
        profileCompleted: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (!await bcrypt.compare(currentPassword, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        skills: true, 
        verified: true,
        profileCompleted: true,
        createdAt: true 
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { assignedTo: req.user.id };
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: { project: { select: { title: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    
    if (!task || task.assignedTo !== req.user.id) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: { project: { select: { title: true } } }
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserTasks,
  updateTaskStatus
};