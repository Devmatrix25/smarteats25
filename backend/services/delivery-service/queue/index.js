// Stub implementation for queue events
// In production without RabbitMQ, these are no-ops that log instead

export async function publishEvent(exchange, routingKey, data) {
    console.log(`📤 [Queue Stub] Would publish: ${exchange}.${routingKey}`, data);
    return true;
}

export const DeliveryEvents = {
    accepted: (data) => publishEvent('deliveries', 'delivery.accepted', data),
    rejected: (data) => publishEvent('deliveries', 'delivery.rejected', data),
    pickedUp: (data) => publishEvent('deliveries', 'delivery.picked_up', data),
    delivered: (data) => publishEvent('deliveries', 'delivery.delivered', data),
    locationUpdated: (data) => publishEvent('deliveries', 'driver.location_updated', data),
};

export default { publishEvent, DeliveryEvents };
