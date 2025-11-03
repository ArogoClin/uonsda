import express from 'express';
import * as authController from '../controllers/auth.controllers.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   POST /api/auth/login
 * @desc    Login admin user
 * @access  Public
 */
router.post('/login', authController.loginAdmin);

// ============================================
// PROTECTED ROUTES (Require Authentication)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/auth/password
 * @desc    Update admin password
 * @access  Private
 */
router.put('/password', authenticate, authController.updatePassword);

// ============================================
// ELDER ONLY ROUTES
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register new admin (ELDER only)
 * @access  Private (ELDER)
 */
router.post('/register', authenticate, authorize('ELDER'), authController.registerAdmin);

/**
 * @route   GET /api/auth/admins
 * @desc    Get all admins (ELDER only)
 * @access  Private (ELDER)
 */
router.get('/admins', authenticate, authorize('ELDER'), authController.getAllAdmins);

/**
 * @route   PUT /api/auth/admins/:id/status
 * @desc    Update admin status - activate/deactivate (ELDER only)
 * @access  Private (ELDER)
 */
router.put('/admins/:id/status', authenticate, authorize('ELDER'), authController.updateAdminStatus);

export default router;