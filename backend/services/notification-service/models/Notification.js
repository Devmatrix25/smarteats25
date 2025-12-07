import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['order', 'delivery', 'payment', 'promotion', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: mongoose.Schema.Types.Mixed,
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: Date,
    channels: [{
        type: String,
        enum: ['in-app', 'email', 'push', 'sms']
    }],
    sentChannels: [{
        channel: String,
        sentAt: Date,
        success: Boolean
    }]
}, {
    timestamps: true
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
