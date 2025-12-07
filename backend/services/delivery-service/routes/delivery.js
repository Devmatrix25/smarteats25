import express from 'express';
import { body, param } from 'express-validator';
import * as deliveryController from '../controllers/deliveryController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Driver routes
router.post('/drivers', authenticateToken, authorizeRoles('driver'), deliveryController.registerDriver);
router.get('/drivers', authenticateToken, authorizeRoles('admin'), deliveryController.getDrivers);
router.get('/drivers/:id', authenticateToken, deliveryController.getDriverById);
router.patch('/drivers/:id', authenticateToken, deliveryController.updateDriver);
router.patch('/drivers/:id/status', authenticateToken, authorizeRoles('admin'), deliveryController.updateDriverStatus);
router.post('/drivers/:id/toggle-availability', authenticateToken, authorizeRoles('driver'), deliveryController.toggleAvailability);
router.post('/drivers/:id/location', authenticateToken, authorizeRoles('driver'), [
    body('longitude').isFloat(),
    body('latitude').isFloat(),
    validateRequest
], deliveryController.updateLocation);

// Delivery routes
router.get('/deliveries/available', authenticateToken, authorizeRoles('driver'), deliveryController.getAvailableDeliveries);
router.post('/deliveries/:id/accept', authenticateToken, authorizeRoles('driver'), deliveryController.acceptDelivery);
router.patch('/deliveries/:id/status', authenticateToken, authorizeRoles('driver'), deliveryController.updateDeliveryStatus);
router.get('/drivers/:id/earnings', authenticateToken, deliveryController.getDriverEarnings);

export default router;
