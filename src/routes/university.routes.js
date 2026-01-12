const express = require('express');
const router = express.Router();
const universityController = require('../controllers/university.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

/**
 * @route   GET /api/university
 * @desc    Get all universities
 * @access  Public
 */
router.get('/', universityController.getAllUniversities);

/**
 * @route   GET /api/university/:id
 * @desc    Get university by ID
 * @access  Public
 */
router.get('/:id', universityController.getUniversityById);

/**
 * @route   POST /api/university
 * @desc    Create new university
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, universityController.createUniversity);

/**
 * @route   PUT /api/university/:id
 * @desc    Update university
 * @access  Admin only
 */
router.put('/:id', authenticate, requireAdmin, universityController.updateUniversity);

/**
 * @route   DELETE /api/university/:id
 * @desc    Delete university
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, universityController.deleteUniversity);

module.exports = router;
