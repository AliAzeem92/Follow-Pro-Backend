const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

const router = express.Router();

router.post('/', [
  authenticate,
  authorize(['ADMIN']),
  body('projectId').notEmpty(),
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('assignedTo').optional(),
  body('category').optional().trim(),
  body('deadline').optional().isISO8601()
], taskController.createTask);

router.get('/', authenticate, authorize(['ADMIN']), taskController.getTasks);

router.get('/:id', authenticate, authorize(['ADMIN']), taskController.getTask);

router.put('/:id', [
  authenticate,
  authorize(['ADMIN']),
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('assignedTo').optional(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'COMPLETE']),
  body('category').optional().trim(),
  body('deadline').optional().isISO8601()
], taskController.updateTask);

router.delete('/:id', authenticate, authorize(['ADMIN']), taskController.deleteTask);

module.exports = router;