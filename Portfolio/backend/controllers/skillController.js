import prisma from '../config/database.js';

// Public: Get all skills
export const getAllSkills = async (req, res) => {
  try {
    const { category } = req.query;

    const where = category ? { category } : {};

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { proficiency: 'desc' }
    });

    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Create skill
export const createSkill = async (req, res) => {
  try {
    const { name, category, proficiency, icon } = req.body;

    const skill = await prisma.skill.create({
      data: { name, category, proficiency, icon }
    });

    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Update skill
export const updateSkill = async (req, res) => {
  try {
    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Delete skill
export const deleteSkill = async (req, res) => {
  try {
    await prisma.skill.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};