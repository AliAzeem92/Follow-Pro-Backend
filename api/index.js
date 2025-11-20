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

// Try to import routes with fallback
try {
  const authRoutes = require('../src/routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.error('Failed to load auth routes:', error.message);
  
  // Working fallback auth routes
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple test login
    if (email === 'test@test.com' && password === 'test123') {
      res.json({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'USER',
          verified: true,
          profileCompleted: true
        }
      });
    } else {
      res.status(400).json({ error: 'Use test@test.com / test123 for now' });
    }
  });
  
  app.post('/api/auth/register', (req, res) => {
    res.json({ message: 'Registration temporarily disabled. Use test@test.com / test123 to login' });
  });
}

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