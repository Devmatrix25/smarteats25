import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    customizations: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    specialInstructions: String
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: [
            'pending',
            'paid',
            'restaurant_accepted',
            'preparing',
            'ready_for_pickup',
            'assigned',
            'picked_up',
            'out_for_delivery',
            'delivered',
            'completed',
            'cancelled'
        ],
        default: 'pending',
        index: true
    },
    pricing: {
        subtotal: { type: Number, required: true },
        tax: { type: Number, required: true },
        deliveryFee: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        instructions: String
    },
    restaurantAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    paymentId: {
        type: String,
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'cash', 'wallet']
    },
    scheduledFor: Date,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    cancellationReason: String,
    cancelledBy: {
        type: String,
        enum: ['customer', 'restaurant', 'admin']
    },
    refundAmount: Number,
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed']
    },
    rating: {
        food: Number,
        delivery: Number,
        overall: Number,
        comment: String
    },
    notes: String
}, {
    timestamps: true
});

// Generate order number
orderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD${Date.now()}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Calculate estimated delivery time
orderSchema.methods.calculateEstimatedDelivery = function () {
    const now = new Date();
    // Base time: 15 minutes prep + 20 minutes delivery
    const estimatedMinutes = 35;
    this.estimatedDeliveryTime = new Date(now.getTime() + estimatedMinutes * 60000);
};

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function () {
    const cancellableStatuses = ['pending', 'paid', 'restaurant_accepted', 'preparing'];
    return cancellableStatuses.includes(this.status);
};

// Get order timeline
orderSchema.methods.getTimeline = function () {
    return {
        ordered: this.createdAt,
        paid: this.status !== 'pending' ? this.createdAt : null,
        accepted: this.status === 'restaurant_accepted' || this.isAfterStatus('restaurant_accepted') ? this.updatedAt : null,
        preparing: this.status === 'preparing' || this.isAfterStatus('preparing') ? this.updatedAt : null,
        ready: this.status === 'ready_for_pickup' || this.isAfterStatus('ready_for_pickup') ? this.updatedAt : null,
        pickedUp: this.status === 'picked_up' || this.isAfterStatus('picked_up') ? this.updatedAt : null,
        delivered: this.actualDeliveryTime,
        completed: this.status === 'completed' ? this.updatedAt : null
    };
};

// Helper to check if order is past a certain status
orderSchema.methods.isAfterStatus = function (targetStatus) {
    const statusOrder = [
        'pending', 'paid', 'restaurant_accepted', 'preparing',
        'ready_for_pickup', 'assigned', 'picked_up',
        'out_for_delivery', 'delivered', 'completed'
    ];
    const currentIndex = statusOrder.indexOf(this.status);
    const targetIndex = statusOrder.indexOf(targetStatus);
    return currentIndex > targetIndex;
};

// Indexes for performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ driverId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
