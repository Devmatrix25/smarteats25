import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('phone').optional().trim(),
    body('role').optional().isIn(['customer', 'restaurant', 'driver']),
    validateRequest
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validateRequest
];

const forgotPasswordValidation = [
    body('email').isEmail().normalizeEmail(),
    validateRequest
];

const resetPasswordValidation = [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validateRequest
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/oauth/google', authController.googleOAuth);

export default router;
