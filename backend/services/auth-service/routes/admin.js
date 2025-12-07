import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Validation rules
const rejectUserValidation = [
    body('reason').optional().trim().isLength({ min: 1, max: 500 }),
    validateRequest
];

// Admin Routes for User Approval Management
router.get('/pending-users', authController.getPendingUsers);
router.get('/users', authController.getAllUsersByRole);
router.post('/approve/:userId', authController.approveUser);
router.post('/reject/:userId', rejectUserValidation, authController.rejectUser);

export default router;
