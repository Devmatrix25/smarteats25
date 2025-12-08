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

export default { publishEvent, OrderEvents };
