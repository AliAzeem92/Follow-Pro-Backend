const express = require('express');
const { body } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

// Get all categories
router.get('/', auth, getCategories);

// Create category (admin only)
router.post('/',
  auth,
  adminOnly,
  [
    body('name').notEmpty().withMessage('Category name is required')
  ],
  createCategory
);

// Update category (admin only)
router.put('/:id',
  auth,
  adminOnly,
  [
    body('name').notEmpty().withMessage('Category name is required')
  ],
  updateCategory
);

// Delete category (admin only)
router.delete('/:id', auth, adminOnly, deleteCategory);

module.exports = router;