const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const category = await prisma.category.create({
      data: { name: name.toLowerCase() }
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name } = req.body;
    const oldCategory = await prisma.category.findUnique({ where: { id } });

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.toLowerCase() }
    });

    // Update all skills with the old category name to the new name
    if (oldCategory && oldCategory.name !== name.toLowerCase()) {
      await prisma.skill.updateMany({
        where: { category: oldCategory.name },
        data: { category: name.toLowerCase() }
      });
    }

    res.json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete all skills in this category first
    await prisma.skill.deleteMany({
      where: { category: category.name }
    });

    // Then delete the category
    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category and associated skills deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};