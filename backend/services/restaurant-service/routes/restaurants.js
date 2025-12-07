import express from 'express';
import { body, param } from 'express-validator';
import * as restaurantController from '../controllers/restaurantController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateToken, authorizeRoles, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Restaurant routes
router.post('/',
    authenticateToken,
    authorizeRoles('restaurant', 'admin'),
    [
        body('name').notEmpty(),
        body('cuisine').isArray({ min: 1 }),
        body('address.street').notEmpty(),
        body('address.city').notEmpty(),
        body('address.state').notEmpty(),
        body('address.zipCode').notEmpty(),
        body('contact.phone').notEmpty(),
        body('contact.email').isEmail(),
        validateRequest
    ],
    restaurantController.createRestaurant
);

router.get('/', optionalAuth, restaurantController.getRestaurants);
router.get('/:id', optionalAuth, restaurantController.getRestaurantById);

router.patch('/:id',
    authenticateToken,
    param('id').isMongoId(),
    restaurantController.updateRestaurant
);

router.patch('/:id/status',
    authenticateToken,
    authorizeRoles('admin'),
    [
        param('id').isMongoId(),
        body('status').isIn(['pending', 'approved', 'rejected', 'suspended', 'active']),
        validateRequest
    ],
    restaurantController.updateRestaurantStatus
);

router.post('/:id/toggle-open',
    authenticateToken,
    authorizeRoles('restaurant', 'admin'),
    param('id').isMongoId(),
    restaurantController.toggleRestaurantOpen
);

// Menu routes
router.get('/:id/menu', optionalAuth, restaurantController.getMenu);
router.get('/:id/menu/categories', restaurantController.getCategories);

router.post('/:id/menu',
    authenticateToken,
    authorizeRoles('restaurant', 'admin'),
    [
        param('id').isMongoId(),
        body('name').notEmpty(),
        body('price').isFloat({ min: 0 }),
        body('category').notEmpty(),
        validateRequest
    ],
    restaurantController.addMenuItem
);

router.patch('/:id/menu/:itemId',
    authenticateToken,
    authorizeRoles('restaurant', 'admin'),
    [
        param('id').isMongoId(),
        param('itemId').isMongoId(),
        validateRequest
    ],
    restaurantController.updateMenuItem
);

router.delete('/:id/menu/:itemId',
    authenticateToken,
    authorizeRoles('restaurant', 'admin'),
    [
        param('id').isMongoId(),
        param('itemId').isMongoId(),
        validateRequest
    ],
    restaurantController.deleteMenuItem
);

export default router;
