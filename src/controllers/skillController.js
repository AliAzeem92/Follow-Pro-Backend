const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const createSkill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category } = req.body;

    const skill = await prisma.skill.create({
      data: { name, category }
    });

    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getSkills = async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateSkill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, category } = req.body;

    const skill = await prisma.skill.update({
      where: { id },
      data: { name, category }
    });

    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.skill.delete({
      where: { id }
    });

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill
};