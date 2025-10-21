import express from 'express';
import {
  getAllSkills,
  createSkill,
  updateSkill,
  deleteSkill
} from '../controllers/skillController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.get('/', getAllSkills);

// Admin routes
router.post('/', authenticate, authorizeAdmin, createSkill);
router.put('/:id', authenticate, authorizeAdmin, updateSkill);
router.delete('/:id', authenticate, authorizeAdmin, deleteSkill);

export default router;
