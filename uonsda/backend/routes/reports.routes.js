import express from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/reports/comprehensive
 * @desc    Get comprehensive report data
 * @access  Private (Admin)
 */
router.get('/comprehensive', reportsController.getComprehensiveReport);

/**
 * @route   GET /api/reports/members
 * @desc    Get members report
 * @access  Private (Admin)
 */
router.get('/members', reportsController.getMembersReport);

/**
 * @route   GET /api/reports/attendance
 * @desc    Get attendance report
 * @access  Private (Admin)
 */
router.get('/attendance', reportsController.getAttendanceReport);

/**
 * @route   GET /api/reports/communion
 * @desc    Get communion report
 * @access  Private (Admin)
 */
router.get('/communion', reportsController.getCommunionReport);

export default router;