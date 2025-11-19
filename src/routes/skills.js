const express = require('express');
const { body } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill
} = require('../controllers/skillController');

const router = express.Router();

// Get all skills
router.get('/', auth, getSkills);

// Create skill (admin only)
router.post('/',
  auth,
  adminOnly,
  [
    body('name').notEmpty().withMessage('Skill name is required'),
    body('category').notEmpty().withMessage('Category is required')
  ],
  createSkill
);

// Update skill (admin only)
router.put('/:id',
  auth,
  adminOnly,
  [
    body('name').notEmpty().withMessage('Skill name is required'),
    body('category').notEmpty().withMessage('Category is required')
  ],
  updateSkill
);

// Delete skill (admin only)
router.delete('/:id', auth, adminOnly, deleteSkill);

module.exports = router;