import express from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Admin routes
router.post('/', authenticate, authorizeAdmin, createProject);
router.put('/:id', authenticate, authorizeAdmin, updateProject);
router.delete('/:id', authenticate, authorizeAdmin, deleteProject);

export default router;