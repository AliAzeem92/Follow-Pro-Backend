const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later.' }
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: { error: 'Too many OTP requests, please try again later.' }
});

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], authController.register);

router.post('/verify-otp', [
  body('userId').notEmpty(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('type').isIn(['VERIFICATION', 'PASSWORD_RESET'])
], otpLimiter, authController.verifyOTP);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authLimiter, authController.login);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], otpLimiter, authController.forgotPassword);

router.post('/reset-password', [
  body('userId').notEmpty(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 6 })
], authController.resetPassword);

router.post('/refresh-token', [
  body('refreshToken').notEmpty()
], authController.refreshToken);

router.post('/resend-otp', [
  body('userId').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('type').isIn(['VERIFICATION', 'PASSWORD_RESET'])
], otpLimiter, authController.resendOTP);

module.exports = router;