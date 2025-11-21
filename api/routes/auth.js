const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, type) => {
  const subject = type === 'VERIFICATION' ? '✅ Verify Your FollowPro Account' : '🔐 Reset Your FollowPro Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">FollowPro</h1>
          <p style="color: #6B7280; margin: 5px 0 0 0;">Project Management System</p>
        </div>
        
        <h2 style="color: #1F2937;">${type === 'VERIFICATION' ? 'Welcome to FollowPro!' : 'Password Reset Request'}</h2>
        
        <p style="color: #374151; font-size: 16px;">
          ${type === 'VERIFICATION' ? 'Thank you for registering! Use this code to verify:' : 'Use this code to reset your password:'}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #4F46E5; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 10px; letter-spacing: 3px; display: inline-block;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #F59E0B; font-size: 14px;">⏰ This code expires in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this, ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© 2024 FollowPro. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"FollowPro Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
    headers: {
      'X-Priority': '1',
      'Importance': 'high'
    }
  });
};

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
        return res.status(200).json({ 
          needsVerification: true,
          userId: user.id,
          email: user.email,
          message: 'Please verify your email first' 
        });
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
        data: { email, password: hashedPassword, role: 'USER', verified: false }
      });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.oTPToken.create({
        data: { userId: user.id, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), type: 'VERIFICATION' }
      });
      await sendOTPEmail(email, otp, 'VERIFICATION');
      res.status(201).json({ message: 'Registration successful! Please check your email for verification code.', userId: user.id });
      await prisma.$disconnect();
    } catch (error) {
      res.status(500).json({ error: 'Registration error: ' + error.message });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const { userId, otp } = req.body;
      const otpToken = await prisma.oTPToken.findFirst({
        where: { userId, otp, type: 'VERIFICATION', expiresAt: { gt: new Date() } }
      });
      if (!otpToken) return res.status(400).json({ error: 'Invalid or expired OTP' });
      await prisma.user.update({ where: { id: userId }, data: { verified: true } });
      await prisma.oTPToken.delete({ where: { id: otpToken.id } });
      res.json({ message: 'Email verified successfully! You can now login.' });
      await prisma.$disconnect();
    } catch (error) {
      res.status(500).json({ error: 'Verification error: ' + error.message });
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