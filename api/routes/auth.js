const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authRoutes = (app) => {
  app.post('/api/auth/login', async (req, res) => {
    try {
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
      const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', { expiresIn: '7d' });
      res.json({
        accessToken, refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, skills: user.skills, verified: user.verified, profileCompleted: user.profileCompleted }
      });
      await prisma.$disconnect();
    } catch (error) {
      res.status(500).json({ error: 'Login error: ' + error.message });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const { email, password } = req.body;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ error: 'User already exists' });
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, role: 'USER', verified: true }
      });
      res.status(201).json({ message: 'User registered successfully', userId: user.id });
      await prisma.$disconnect();
    } catch (error) {
      res.status(500).json({ error: 'Registration error: ' + error.message });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.oTPToken.create({
        data: { userId: user.id, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), type: 'PASSWORD_RESET' }
      });
      const { sendOTPEmail } = require('../../src/utils/email');
      await sendOTPEmail(email, otp, 'PASSWORD_RESET');
      res.json({ message: 'Password reset OTP sent to email', userId: user.id });
      await prisma.$disconnect();
    } catch (error) {
      res.status(500).json({ error: 'Forgot password error: ' + error.message });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const { userId, otp, newPassword } = req.body;
      const otpToken = await prisma.oTPToken.findFirst({
        where: { userId, otp, type: 'PASSWORD_RESET', expiresAt: { gt: new Date() } }
      });
      if (!otpToken) return res.status(400).json({ error: 'Invalid or expired OTP' });
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
      await prisma.oTPToken.delete({ where: { id: otpToken.id } });
      res.json({ message: 'Password reset successfully' });
      await prisma.$disconnect();
    } catch (error) {
      res.status(500).json({ error: 'Reset password error: ' + error.message });
    }
  });
};

module.exports = authRoutes;