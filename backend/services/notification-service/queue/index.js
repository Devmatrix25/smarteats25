// Stub implementation for queue - no-op when RabbitMQ is not available

export async function consumeQueue(queueName, exchange, routingKeys, callback) {
    console.log(`📥 [Queue Stub] Would consume from: ${queueName} on ${exchange}`);
    // No-op - just log that we would be consuming
    return true;
}

export async function publishEvent(exchange, routingKey, data) {
    console.log(`📤 [Queue Stub] Would publish: ${exchange}.${routingKey}`, data);
    return true;
}

export const NotificationEvents = {
    send: (data) => publishEvent('notifications', 'notification.send', data),
};

export default { consumeQueue, publishEvent, NotificationEvents };
