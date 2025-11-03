import express from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance (simple one-click with fraud prevention)
 * @access  Public
 */
router.post('/mark', attendanceController.markAttendance);

/**
 * @route   GET /api/attendance/status
 * @desc    Get current service status and schedule
 * @access  Public
 */
router.get('/status', attendanceController.getServiceStatus);

/**
 * @route   GET /api/attendance/member/:email
 * @desc    Get member's attendance history
 * @access  Public
 */
router.get('/member/:email', attendanceController.getMemberAttendance);

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

/**
 * @route   GET /api/attendance
 * @desc    Get all attendance records with filters
 * @access  Private (Admin)
 */
router.get('/', authenticate, attendanceController.getAttendance);

/**
 * @route   GET /api/attendance/locations/active
 * @desc    Get currently active locations for all services
 * @access  Private (Admin)
 */
router.get('/locations/active', authenticate, attendanceController.getActiveLocations);

/**
 * @route   GET /api/attendance/locations
 * @desc    Get all saved locations
 * @access  Private (Admin)
 */
router.get('/locations', authenticate, attendanceController.getAllLocations);

/**
 * @route   POST /api/attendance/locations
 * @desc    Create new church location
 * @access  Private (CLERK, ELDER)
 */
router.post('/locations', authenticate, attendanceController.createLocation);

/**
 * @route   PUT /api/attendance/locations/:id/activate
 * @desc    Set active location for specific services
 * @access  Private (CLERK, ELDER)
 */
router.put('/locations/:id/activate', authenticate, attendanceController.setActiveLocation);

/**
 * @route   PUT /api/attendance/locations/:id
 * @desc    Update church location
 * @access  Private (CLERK, ELDER)
 */
router.put('/locations/:id', authenticate, attendanceController.updateLocation);

/**
 * @route   DELETE /api/attendance/locations/:id
 * @desc    Delete church location
 * @access  Private (ELDER only)
 */
router.delete('/locations/:id', authenticate, authorize('ELDER'), attendanceController.deleteLocation);

export default router;