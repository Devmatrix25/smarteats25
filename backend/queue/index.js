import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

let connection = null;
let channel = null;

/**
 * Initialize RabbitMQ connection and channel
 */
export async function initializeQueue() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
        channel = await connection.createChannel();

        // Declare exchanges
        await channel.assertExchange('orders', 'topic', { durable: true });
        await channel.assertExchange('payments', 'topic', { durable: true });
        await channel.assertExchange('deliveries', 'topic', { durable: true });
        await channel.assertExchange('notifications', 'topic', { durable: true });

        console.log('✅ RabbitMQ initialized');
        return channel;
    } catch (error) {
        console.error('❌ Failed to initialize RabbitMQ:', error);
        throw error;
    }
}

/**
 * Get the current channel (initialize if needed)
 */
export async function getChannel() {
    if (!channel) {
        await initializeQueue();
    }
    return channel;
}

/**
 * Publish an event to an exchange
 */
export async function publishEvent(exchange, routingKey, data) {
    try {
        const ch = await getChannel();
        const message = JSON.stringify(data);

        ch.publish(exchange, routingKey, Buffer.from(message), {
            persistent: true,
            timestamp: Date.now()
        });

        console.log(`📤 Published event: ${exchange}.${routingKey}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to publish event:', error);
        return false;
    }
}

/**
 * Consume messages from a queue
 */
export async function consumeQueue(queueName, exchange, routingKeys, callback) {
    try {
        const ch = await getChannel();

        await ch.assertQueue(queueName, { durable: true });

        // Bind queue to exchange with routing keys
        for (const key of routingKeys) {
            await ch.bindQueue(queueName, exchange, key);
        }

        ch.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    await callback(data, msg.fields.routingKey);
                    ch.ack(msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    // Reject and requeue the message
                    ch.nack(msg, false, true);
                }
            }
        });

        console.log(`✅ Consuming from queue: ${queueName}`);
    } catch (error) {
        console.error('❌ Failed to consume queue:', error);
        throw error;
    }
}

/**
 * Close RabbitMQ connection
 */
export async function closeQueue() {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        console.log('✅ RabbitMQ connection closed');
    } catch (error) {
        console.error('❌ Error closing RabbitMQ:', error);
    }
}

// Event publishers for common events
export const OrderEvents = {
    created: (data) => publishEvent('orders', 'order.created', data),
    paid: (data) => publishEvent('orders', 'order.paid', data),
    accepted: (data) => publishEvent('orders', 'order.accepted', data),
    preparing: (data) => publishEvent('orders', 'order.preparing', data),
    ready: (data) => publishEvent('orders', 'order.ready', data),
    assigned: (data) => publishEvent('orders', 'order.assigned', data),
    pickedUp: (data) => publishEvent('orders', 'order.picked_up', data),
    outForDelivery: (data) => publishEvent('orders', 'order.out_for_delivery', data),
    delivered: (data) => publishEvent('orders', 'order.delivered', data),
    cancelled: (data) => publishEvent('orders', 'order.cancelled', data),
    completed: (data) => publishEvent('orders', 'order.completed', data),
};

export const PaymentEvents = {
    completed: (data) => publishEvent('payments', 'payment.completed', data),
    failed: (data) => publishEvent('payments', 'payment.failed', data),
    refunded: (data) => publishEvent('payments', 'refund.processed', data),
};

export const DeliveryEvents = {
    accepted: (data) => publishEvent('deliveries', 'delivery.accepted', data),
    rejected: (data) => publishEvent('deliveries', 'delivery.rejected', data),
    pickedUp: (data) => publishEvent('deliveries', 'delivery.picked_up', data),
    delivered: (data) => publishEvent('deliveries', 'delivery.delivered', data),
    locationUpdated: (data) => publishEvent('deliveries', 'driver.location_updated', data),
};

export const NotificationEvents = {
    send: (data) => publishEvent('notifications', 'notification.send', data),
};

export default {
    initializeQueue,
    getChannel,
    publishEvent,
    consumeQueue,
    closeQueue,
    OrderEvents,
    PaymentEvents,
    DeliveryEvents,
    NotificationEvents
};
