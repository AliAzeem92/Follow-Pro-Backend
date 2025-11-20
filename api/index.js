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

// Test route to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Import and use routes
const authRoutes = require('../src/routes/auth');
const userRoutes = require('../src/routes/users');
const projectRoutes = require('../src/routes/projects');
const taskRoutes = require('../src/routes/tasks');
const skillRoutes = require('../src/routes/skills');
const categoryRoutes = require('../src/routes/categories');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin/skills', skillRoutes);
app.use('/api/admin/categories', categoryRoutes);

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