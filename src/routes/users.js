const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/profile', authenticate, userController.getProfile);

router.put('/profile', [
  authenticate,
  body('name').notEmpty().trim(),
  body('skills').optional().isArray()
], userController.updateProfile);

router.put('/change-password', [
  authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], userController.changePassword);

router.get('/all', authenticate, authorize(['ADMIN']), userController.getAllUsers);

router.get('/tasks', authenticate, userController.getUserTasks);

router.put('/tasks/:taskId/status', [
  authenticate,
  body('status').isIn(['TODO', 'IN_PROGRESS', 'COMPLETE'])
], userController.updateTaskStatus);

module.exports = router;