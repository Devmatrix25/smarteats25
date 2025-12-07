import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true
    },
    profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        photo: String,
        dateOfBirth: Date
    },
    vehicle: {
        type: { type: String, enum: ['bike', 'scooter', 'car'], required: true },
        make: String,
        model: String,
        year: Number,
        licensePlate: { type: String, required: true },
        color: String,
        photo: String
    },
    documents: {
        driverLicense: {
            number: String,
            expiryDate: Date,
            photo: String,
            verified: { type: Boolean, default: false }
        },
        vehicleRegistration: {
            number: String,
            expiryDate: Date,
            photo: String,
            verified: { type: Boolean, default: false }
        },
        insurance: {
            number: String,
            expiryDate: Date,
            photo: String,
            verified: { type: Boolean, default: false }
        },
        backgroundCheck: {
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            completedDate: Date
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'active', 'inactive', 'suspended', 'rejected'],
        default: 'pending',
        index: true
    },
    availability: {
        isOnline: { type: Boolean, default: false, index: true },
        isAvailable: { type: Boolean, default: false },
        lastOnline: Date
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        },
        address: String,
        lastUpdated: { type: Date, default: Date.now }
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    stats: {
        totalDeliveries: { type: Number, default: 0 },
        completedDeliveries: { type: Number, default: 0 },
        cancelledDeliveries: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 },
        totalDistance: { type: Number, default: 0 } // in kilometers
    },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        routingNumber: String,
        bankName: String,
        verified: { type: Boolean, default: false }
    },
    preferences: {
        maxDeliveryRadius: { type: Number, default: 10 }, // in kilometers
        preferredAreas: [String],
        workingHours: {
            monday: { start: String, end: String, available: Boolean },
            tuesday: { start: String, end: String, available: Boolean },
            wednesday: { start: String, end: String, available: Boolean },
            thursday: { start: String, end: String, available: Boolean },
            friday: { start: String, end: String, available: Boolean },
            saturday: { start: String, end: String, available: Boolean },
            sunday: { start: String, end: String, available: Boolean }
        }
    }
}, {
    timestamps: true
});

// Update rating
driverSchema.methods.updateRating = function (newRating) {
    const totalRating = this.ratings.average * this.ratings.count;
    this.ratings.count += 1;
    this.ratings.average = (totalRating + newRating) / this.ratings.count;
};

// Update location
driverSchema.methods.updateLocation = function (longitude, latitude, address) {
    this.location.coordinates = [longitude, latitude];
    this.location.address = address;
    this.location.lastUpdated = new Date();
};

const deliverySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'failed'],
        default: 'assigned',
        index: true
    },
    pickupLocation: {
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    deliveryLocation: {
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    distance: Number, // in kilometers
    estimatedDuration: Number, // in minutes
    actualDuration: Number,
    earnings: {
        baseFee: Number,
        distanceFee: Number,
        tip: { type: Number, default: 0 },
        total: Number
    },
    timeline: {
        assigned: Date,
        accepted: Date,
        pickedUp: Date,
        delivered: Date
    },
    notes: String,
    proof: {
        photo: String,
        signature: String
    }
}, {
    timestamps: true
});

// Calculate earnings
deliverySchema.methods.calculateEarnings = function () {
    const baseFee = 3.00;
    const perKmFee = 0.50;
    this.earnings.baseFee = baseFee;
    this.earnings.distanceFee = this.distance * perKmFee;
    this.earnings.total = this.earnings.baseFee + this.earnings.distanceFee + (this.earnings.tip || 0);
};

const Driver = mongoose.model('Driver', driverSchema);
const Delivery = mongoose.model('Delivery', deliverySchema);

export { Driver, Delivery };
