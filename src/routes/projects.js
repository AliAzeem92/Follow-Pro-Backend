const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.post('/', [
  authenticate,
  authorize(['ADMIN']),
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], projectController.createProject);

router.get('/', authenticate, authorize(['ADMIN']), projectController.getProjects);

router.get('/:id', authenticate, authorize(['ADMIN']), projectController.getProject);

router.put('/:id', [
  authenticate,
  authorize(['ADMIN']),
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], projectController.updateProject);

router.delete('/:id', authenticate, authorize(['ADMIN']), projectController.deleteProject);

module.exports = router;