import express from 'express';
import * as communionController from '../controllers/communion.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/communion/active
 * @desc    Get active communion service for public participation
 * @access  Public
 */
router.get('/active', communionController.getActiveCommunionService);

/**
 * @route   POST /api/communion/participate
 * @desc    Self-register for communion (members and visitors)
 * @access  Public
 */
router.post('/participate', communionController.participateInCommunion);

/**
 * @route   GET /api/communion/members/:email
 * @desc    Get member's communion history
 * @access  Public
 */
router.get('/members/:email', communionController.getMemberCommunionHistory);

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

/**
 * @route   GET /api/communion/services
 * @desc    Get all communion services
 * @access  Private (Admin)
 */
router.get('/services', authenticate, communionController.getCommunionServices);

/**
 * @route   GET /api/communion/services/:id
 * @desc    Get communion service by ID
 * @access  Private (Admin)
 */
router.get('/services/:id', authenticate, communionController.getCommunionServiceById);

/**
 * @route   POST /api/communion/services
 * @desc    Create new communion service
 * @access  Private (Admin)
 */
router.post('/services', authenticate, communionController.createCommunionService);

/**
 * @route   PUT /api/communion/services/:id
 * @desc    Update communion service
 * @access  Private (Admin)
 */
router.put('/services/:id', authenticate, communionController.updateCommunionService);

/**
 * @route   PUT /api/communion/services/:id/open
 * @desc    Open communion service for participation
 * @access  Private (Admin)
 */
router.put('/services/:id/open', authenticate, communionController.openCommunionService);

/**
 * @route   PUT /api/communion/services/:id/close
 * @desc    Close communion service
 * @access  Private (Admin)
 */
router.put('/services/:id/close', authenticate, communionController.closeCommunionService);

/**
 * @route   DELETE /api/communion/services/:id
 * @desc    Delete communion service
 * @access  Private (ELDER only)
 */
router.delete('/services/:id', authenticate, authorize('ELDER'), communionController.deleteCommunionService);

/**
 * @route   POST /api/communion/services/:id/participants
 * @desc    Add participant to communion service (Admin)
 * @access  Private (Admin)
 */
router.post('/services/:id/participants', authenticate, communionController.addCommunionParticipant);

/**
 * @route   DELETE /api/communion/participants/:id
 * @desc    Remove participant from communion
 * @access  Private (Admin)
 */
router.delete('/participants/:id', authenticate, communionController.deleteCommunionParticipant);

/**
 * @route   GET /api/communion/stats
 * @desc    Get communion statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, communionController.getCommunionStats);

export default router;