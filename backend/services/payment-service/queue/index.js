// Stub implementation for queue events
// In production without RabbitMQ, these are no-ops that log instead

export async function publishEvent(exchange, routingKey, data) {
    console.log(`📤 [Queue Stub] Would publish: ${exchange}.${routingKey}`, data);
    return true;
}

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
    publishEvent,
    OrderEvents,
    PaymentEvents,
    DeliveryEvents,
    NotificationEvents
};
