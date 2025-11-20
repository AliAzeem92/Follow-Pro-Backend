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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running healthy'
  });
});

// Basic test route
app.get('/', (req, res) => {
  res.json({
    message: 'FollowPro Backend API',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

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

// Real auth routes with database
app.post('/api/auth/login', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    if (!user.verified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }
    
    // Simple token for now
    res.json({
      accessToken: 'real-token-' + user.id,
      refreshToken: 'real-refresh-' + user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        verified: user.verified,
        profileCompleted: user.profileCompleted
      }
    });
    
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: 'Login error: ' + error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { email, password } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        role: 'USER',
        verified: true // Skip email verification for now
      }
    });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: user.id 
    });
    
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: 'Registration error: ' + error.message });
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