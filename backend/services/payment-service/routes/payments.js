import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, paymentController.createPaymentIntent);
router.post('/:id/confirm', authenticateToken, paymentController.confirmPayment);
router.post('/:id/refund', authenticateToken, authorizeRoles('admin'), paymentController.processRefund);
router.get('/:id', authenticateToken, paymentController.getPayment);
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

export default router;
