import Order from '../models/Order.js';
import { OrderEvents } from '../queue/index.js';

export const createOrder = async (req, res) => {
    try {
        const {
            restaurantId,
            items,
            deliveryAddress,
            restaurantAddress,
            pricing,
            paymentMethod,
            scheduledFor
        } = req.body;

        const customerId = req.user.userId;

        // Create order
        const order = new Order({
            customerId,
            restaurantId,
            items,
            deliveryAddress,
            restaurantAddress,
            pricing,
            paymentMethod,
            scheduledFor,
            status: 'pending'
        });

        // Calculate estimated delivery
        order.calculateEstimatedDelivery();

        await order.save();

        // Publish order created event
        await OrderEvents.created({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId,
            restaurantId,
            total: pricing.total,
            items: items.length
        });

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order', message: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Authorization check
        const isAuthorized =
            userRole === 'admin' ||
            (userRole === 'customer' && order.customerId.toString() === userId) ||
            (userRole === 'restaurant' && order.restaurantId.toString() === userId) ||
            (userRole === 'driver' && order.driverId && order.driverId.toString() === userId);

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to get order', message: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { status, limit = 20, page = 1 } = req.query;

        let query = {};

        // Filter based on role
        if (userRole === 'customer') {
            query.customerId = userId;
        } else if (userRole === 'restaurant') {
            query.restaurantId = userId;
        } else if (userRole === 'driver') {
            query.driverId = userId;
        }
        // Admin can see all orders

        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip),
            Order.countDocuments(query)
        ]);

        res.json({
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to get orders', message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Authorization check based on role and status transition
        const canUpdate =
            userRole === 'admin' ||
            (userRole === 'restaurant' && ['restaurant_accepted', 'preparing', 'ready_for_pickup'].includes(status)) ||
            (userRole === 'driver' && ['picked_up', 'out_for_delivery', 'delivered'].includes(status));

        if (!canUpdate) {
            return res.status(403).json({ error: 'Not authorized to update this status' });
        }

        // Update status
        order.status = status;

        // Set actual delivery time if delivered
        if (status === 'delivered') {
            order.actualDeliveryTime = new Date();
        }

        await order.save();

        // Publish status update event
        const eventMap = {
            'paid': OrderEvents.paid,
            'restaurant_accepted': OrderEvents.accepted,
            'preparing': OrderEvents.preparing,
            'ready_for_pickup': OrderEvents.ready,
            'assigned': OrderEvents.assigned,
            'picked_up': OrderEvents.pickedUp,
            'out_for_delivery': OrderEvents.outForDelivery,
            'delivered': OrderEvents.delivered,
            'completed': OrderEvents.completed
        };

        if (eventMap[status]) {
            await eventMap[status]({
                orderId: order._id,
                orderNumber: order.orderNumber,
                customerId: order.customerId,
                restaurantId: order.restaurantId,
                driverId: order.driverId,
                status
            });
        }

        res.json({
            message: 'Order status updated',
            order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status', message: error.message });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if order can be cancelled
        if (!order.canBeCancelled()) {
            return res.status(400).json({
                error: 'Order cannot be cancelled',
                message: 'Order is too far in the delivery process'
            });
        }

        // Authorization check
        const canCancel =
            userRole === 'admin' ||
            (userRole === 'customer' && order.customerId.toString() === userId) ||
            (userRole === 'restaurant' && order.restaurantId.toString() === userId);

        if (!canCancel) {
            return res.status(403).json({ error: 'Not authorized to cancel this order' });
        }

        // Update order
        order.status = 'cancelled';
        order.cancellationReason = reason;
        order.cancelledBy = userRole;
        order.refundStatus = order.status === 'paid' ? 'pending' : 'none';

        await order.save();

        // Publish cancellation event
        await OrderEvents.cancelled({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            restaurantId: order.restaurantId,
            cancelledBy: userRole,
            reason
        });

        res.json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order', message: error.message });
    }
};

export const assignDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { driverId } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'ready_for_pickup') {
            return res.status(400).json({
                error: 'Order not ready for assignment',
                message: 'Order must be ready for pickup'
            });
        }

        order.driverId = driverId;
        order.status = 'assigned';

        await order.save();

        // Publish assignment event
        await OrderEvents.assigned({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            restaurantId: order.restaurantId,
            driverId,
            deliveryAddress: order.deliveryAddress,
            restaurantAddress: order.restaurantAddress
        });

        res.json({
            message: 'Driver assigned successfully',
            order
        });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({ error: 'Failed to assign driver', message: error.message });
    }
};

export const rateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { food, delivery, comment } = req.body;
        const userId = req.user.userId;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Only customer can rate
        if (order.customerId.toString() !== userId) {
            return res.status(403).json({ error: 'Only the customer can rate this order' });
        }

        // Order must be delivered
        if (order.status !== 'delivered' && order.status !== 'completed') {
            return res.status(400).json({ error: 'Order must be delivered to rate' });
        }

        // Update rating
        order.rating = {
            food,
            delivery,
            overall: (food + delivery) / 2,
            comment
        };

        order.status = 'completed';

        await order.save();

        // Publish completion event
        await OrderEvents.completed({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            restaurantId: order.restaurantId,
            driverId: order.driverId,
            rating: order.rating
        });

        res.json({
            message: 'Order rated successfully',
            order
        });
    } catch (error) {
        console.error('Rate order error:', error);
        res.status(500).json({ error: 'Failed to rate order', message: error.message });
    }
};
