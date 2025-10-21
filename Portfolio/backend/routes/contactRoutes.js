import express from 'express';
import {
  submitContact,
  getAllContacts,
  markAsRead,
  deleteContact
} from '../controllers/contactController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.post('/', submitContact);

// Admin routes
router.get('/', authenticate, authorizeAdmin, getAllContacts);
router.patch('/:id/read', authenticate, authorizeAdmin, markAsRead);
router.delete('/:id', authenticate, authorizeAdmin, deleteContact);

export default router;