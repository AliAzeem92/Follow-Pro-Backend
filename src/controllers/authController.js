const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const role = 'USER'; // All registrations are USER role

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role }
    });

    const otp = generateOTP();
    await prisma.oTPToken.create({
      data: {
        userId: user.id,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        type: 'VERIFICATION'
      }
    });

    await sendOTPEmail(email, otp, 'VERIFICATION');

    res.status(201).json({ 
      message: 'User registered. Please verify your email.',
      userId: user.id 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { userId, otp, type } = req.body;

    const otpToken = await prisma.oTPToken.findFirst({
      where: { userId, otp, type, expiresAt: { gt: new Date() } }
    });

    if (!otpToken) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { verified: true }
    });

    await prisma.oTPToken.delete({ where: { id: otpToken.id } });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        verified: user.verified,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    await prisma.oTPToken.create({
      data: {
        userId: user.id,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        type: 'PASSWORD_RESET'
      }
    });

    await sendOTPEmail(email, otp, 'PASSWORD_RESET');

    res.json({ message: 'Password reset OTP sent to email', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const otpToken = await prisma.oTPToken.findFirst({
      where: { userId, otp, type: 'PASSWORD_RESET', expiresAt: { gt: new Date() } }
    });

    if (!otpToken) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    await prisma.oTPToken.delete({ where: { id: otpToken.id } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokens = generateTokens(decoded.userId);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { userId, email, type } = req.body;

    // Delete existing OTP tokens for this user and type
    await prisma.oTPToken.deleteMany({
      where: { userId, type }
    });

    const otp = generateOTP();
    await prisma.oTPToken.create({
      data: {
        userId,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        type
      }
    });

    await sendOTPEmail(email, otp, type);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  resendOTP
};