import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    method: {
        type: String,
        enum: ['card', 'cash', 'wallet'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending',
        index: true
    },
    stripePaymentIntentId: String,
    stripeChargeId: String,
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    failureReason: String,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
