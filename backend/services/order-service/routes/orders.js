import express from 'express';
import { body, param, query } from 'express-validator';
import * as orderController from '../controllers/orderController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const createOrderValidation = [
    body('restaurantId').isMongoId(),
    body('items').isArray({ min: 1 }),
    body('items.*.menuItemId').isMongoId(),
    body('items.*.name').notEmpty(),
    body('items.*.price').isFloat({ min: 0 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('deliveryAddress.street').notEmpty(),
    body('deliveryAddress.city').notEmpty(),
    body('deliveryAddress.zipCode').notEmpty(),
    body('pricing.subtotal').isFloat({ min: 0 }),
    body('pricing.tax').isFloat({ min: 0 }),
    body('pricing.deliveryFee').isFloat({ min: 0 }),
    body('pricing.total').isFloat({ min: 0 }),
    body('paymentMethod').isIn(['card', 'cash', 'wallet']),
    validateRequest
];

const updateStatusValidation = [
    param('id').isMongoId(),
    body('status').isIn([
        'paid', 'restaurant_accepted', 'preparing', 'ready_for_pickup',
        'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'completed'
    ]),
    validateRequest
];

const cancelOrderValidation = [
    param('id').isMongoId(),
    body('reason').notEmpty(),
    validateRequest
];

const assignDriverValidation = [
    param('id').isMongoId(),
    body('driverId').isMongoId(),
    validateRequest
];

const rateOrderValidation = [
    param('id').isMongoId(),
    body('food').isInt({ min: 1, max: 5 }),
    body('delivery').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString(),
    validateRequest
];

// Routes
router.post('/', authenticateToken, createOrderValidation, orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.patch('/:id/status', authenticateToken, updateStatusValidation, orderController.updateOrderStatus);
router.post('/:id/cancel', authenticateToken, cancelOrderValidation, orderController.cancelOrder);
router.post('/:id/assign', authenticateToken, authorizeRoles('admin', 'restaurant'), assignDriverValidation, orderController.assignDriver);
router.post('/:id/rate', authenticateToken, authorizeRoles('customer'), rateOrderValidation, orderController.rateOrder);

export default router;
