import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    image: String,
    isAvailable: {
        type: Boolean,
        default: true
    },
    isVegetarian: Boolean,
    isVegan: Boolean,
    isGlutenFree: Boolean,
    spiceLevel: {
        type: Number,
        min: 0,
        max: 5
    },
    calories: Number,
    preparationTime: Number, // in minutes
    customizations: [{
        name: String,
        options: [{
            name: String,
            price: Number
        }],
        required: Boolean,
        multiSelect: Boolean
    }],
    tags: [String]
}, {
    timestamps: true
});

const restaurantSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    description: String,
    cuisine: [{
        type: String,
        required: true
    }],
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    contact: {
        phone: { type: String, required: true },
        email: { type: String, required: true }
    },
    images: {
        logo: String,
        banner: String,
        gallery: [String]
    },
    menu: [menuItemSchema],
    operatingHours: {
        monday: { open: String, close: String, closed: Boolean },
        tuesday: { open: String, close: String, closed: Boolean },
        wednesday: { open: String, close: String, closed: Boolean },
        thursday: { open: String, close: String, closed: Boolean },
        friday: { open: String, close: String, closed: Boolean },
        saturday: { open: String, close: String, closed: Boolean },
        sunday: { open: String, close: String, closed: Boolean }
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        food: { type: Number, default: 0 },
        service: { type: Number, default: 0 },
        delivery: { type: Number, default: 0 }
    },
    pricing: {
        deliveryFee: { type: Number, default: 0 },
        minimumOrder: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended', 'active'],
        default: 'pending',
        index: true
    },
    isOpen: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    deliveryRadius: {
        type: Number,
        default: 5 // in kilometers
    },
    averagePreparationTime: {
        type: Number,
        default: 30 // in minutes
    },
    tags: [String],
    specialties: [String],
    certifications: [String], // e.g., "Halal", "Kosher", "Organic"
    paymentMethods: [String],
    documents: {
        businessLicense: String,
        foodSafetyCertificate: String,
        taxId: String
    }
}, {
    timestamps: true
});

// Check if restaurant is currently open
restaurantSchema.methods.isCurrentlyOpen = function () {
    const now = new Date();
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const hours = this.operatingHours[day];

    if (!hours || hours.closed) {
        return false;
    }

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= hours.open && currentTime <= hours.close;
};

// Update average rating
restaurantSchema.methods.updateRating = function (newRating) {
    const totalRating = this.ratings.average * this.ratings.count;
    this.ratings.count += 1;
    this.ratings.average = (totalRating + newRating.overall) / this.ratings.count;

    if (newRating.food) {
        this.ratings.food = ((this.ratings.food * (this.ratings.count - 1)) + newRating.food) / this.ratings.count;
    }
    if (newRating.service) {
        this.ratings.service = ((this.ratings.service * (this.ratings.count - 1)) + newRating.service) / this.ratings.count;
    }
    if (newRating.delivery) {
        this.ratings.delivery = ((this.ratings.delivery * (this.ratings.count - 1)) + newRating.delivery) / this.ratings.count;
    }
};

// Indexes for search and filtering
restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });
restaurantSchema.index({ 'address.city': 1, status: 1 });
restaurantSchema.index({ cuisine: 1, 'ratings.average': -1 });
restaurantSchema.index({ status: 1, isFeatured: -1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
