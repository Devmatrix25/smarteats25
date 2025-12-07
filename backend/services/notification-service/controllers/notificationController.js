import Notification from '../models/Notification.js';
import { consumeQueue } from '../../../queue/index.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { read, limit = 20, page = 1 } = req.query;

        let query = { userId };
        if (read !== undefined) {
            query.read = read === 'true';
        }

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip),
            Notification.countDocuments(query)
        ]);

        const unreadCount = await Notification.countDocuments({ userId, read: false });

        res.json({
            notifications,
            unreadCount,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications', message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const notification = await Notification.findOne({ _id: id, userId });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark as read', message: error.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await Notification.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read', message: error.message });
    }
};

export const createNotification = async (userId, type, title, message, data = {}, channels = ['in-app']) => {
    try {
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            data,
            channels
        });

        await notification.save();

        // TODO: Send via other channels (email, push, SMS)
        // For now, just mark in-app as sent
        notification.sentChannels.push({
            channel: 'in-app',
            sentAt: new Date(),
            success: true
        });
        await notification.save();

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

// Initialize RabbitMQ consumer
export const initializeNotificationConsumer = async () => {
    try {
        // Consume order events
        await consumeQueue('notification-order-queue', 'orders', ['order.*'], async (data, routingKey) => {
            console.log(`📨 Processing order event: ${routingKey}`, data);

            let title, message;

            switch (routingKey) {
                case 'order.created':
                    title = 'Order Placed';
                    message = `Your order #${data.orderNumber} has been placed successfully.`;
                    break;
                case 'order.accepted':
                    title = 'Order Accepted';
                    message = `Restaurant has accepted your order #${data.orderNumber}.`;
                    break;
                case 'order.preparing':
                    title = 'Order Being Prepared';
                    message = `Your order #${data.orderNumber} is being prepared.`;
                    break;
                case 'order.ready':
                    title = 'Order Ready';
                    message = `Your order #${data.orderNumber} is ready for pickup.`;
                    break;
                case 'order.assigned':
                    title = 'Driver Assigned';
                    message = `A driver has been assigned to deliver your order #${data.orderNumber}.`;
                    break;
                case 'order.picked_up':
                    title = 'Order Picked Up';
                    message = `Your order #${data.orderNumber} has been picked up and is on the way.`;
                    break;
                case 'order.out_for_delivery':
                    title = 'Out for Delivery';
                    message = `Your order #${data.orderNumber} is out for delivery.`;
                    break;
                case 'order.delivered':
                    title = 'Order Delivered';
                    message = `Your order #${data.orderNumber} has been delivered. Enjoy your meal!`;
                    break;
                case 'order.cancelled':
                    title = 'Order Cancelled';
                    message = `Your order #${data.orderNumber} has been cancelled.`;
                    break;
                default:
                    return;
            }

            if (data.customerId) {
                await createNotification(data.customerId, 'order', title, message, { orderId: data.orderId, orderNumber: data.orderNumber });
            }
        });

        // Consume payment events
        await consumeQueue('notification-payment-queue', 'payments', ['payment.*'], async (data, routingKey) => {
            console.log(`📨 Processing payment event: ${routingKey}`, data);

            if (routingKey === 'payment.completed' && data.customerId) {
                await createNotification(
                    data.customerId,
                    'payment',
                    'Payment Successful',
                    `Your payment of $${data.amount} has been processed successfully.`,
                    { paymentId: data.paymentId, orderId: data.orderId }
                );
            } else if (routingKey === 'refund.processed' && data.customerId) {
                await createNotification(
                    data.customerId,
                    'payment',
                    'Refund Processed',
                    `A refund of $${data.amount} has been processed to your account.`,
                    { paymentId: data.paymentId, orderId: data.orderId }
                );
            }
        });

        console.log('✅ Notification consumers initialized');
    } catch (error) {
        console.error('Failed to initialize notification consumers:', error);
    }
};
