/**
 * SmartEats Database Seeding Script
 * 
 * Run with: node seed-database.js
 * 
 * This script creates:
 * 1. Admin account
 * 2. Restaurant owner accounts
 * 3. Restaurants
 * 4. Menu Items (as separate collection)
 * 
 * Admin Credentials:
 *   Email: admin@smarteats.com
 *   Password: admin123
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// =============================================
// MONGODB URI
// =============================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://SmartEatsTeam:Devmatrix123@smarteats25.lypxox6.mongodb.net/smarteats?retryWrites=true&w=majority&appName=smarteats25';

// =============================================
// SCHEMAS
// =============================================
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'restaurant', 'driver', 'admin'], required: true, default: 'customer' },
    profile: {
        firstName: String,
        lastName: String,
        phone: String,
        avatar: String
    },
    isEmailVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ownerEmail: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    cuisine_type: [String],
    address: String,
    city: String,
    latitude: Number,
    longitude: Number,
    phone: String,
    image_url: String,
    logo_url: String,
    average_rating: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 },
    delivery_time_mins: { type: Number, default: 30 },
    minimum_order: { type: Number, default: 200 },
    delivery_fee: { type: Number, default: 40 },
    opening_time: { type: String, default: '10:00' },
    closing_time: { type: String, default: '22:00' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'approved' },
    is_open: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false }
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
    restaurant_id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image_url: String,
    is_vegetarian: { type: Boolean, default: false },
    is_vegan: { type: Boolean, default: false },
    is_bestseller: { type: Boolean, default: false },
    is_available: { type: Boolean, default: true },
    spice_level: String,
    calories: Number,
    preparation_time_mins: Number
}, { timestamps: true });

// =============================================
// SEED DATA
// =============================================

const ADMIN_USER = {
    email: 'admin@smarteats.com',
    password: 'admin123',
    role: 'admin',
    profile: { firstName: 'Smart', lastName: 'Admin', phone: '+91 9999999999' }
};

const RESTAURANTS_DATA = [
    {
        ownerEmail: 'spicegarden@gmail.com',
        ownerPassword: 'spicegarden',
        ownerFirstName: 'Rahul',
        ownerLastName: 'Sharma',
        restaurant: {
            name: 'Spice Garden',
            description: 'Authentic North Indian cuisine with a modern twist',
            cuisine_type: ['Indian', 'North Indian', 'Mughlai'],
            address: '123 MG Road, Koramangala',
            city: 'Bangalore',
            latitude: 12.9352,
            longitude: 77.6245,
            phone: '+91 98765 43210',
            image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
            average_rating: 4.5,
            total_reviews: 234,
            delivery_time_mins: 30,
            minimum_order: 200,
            delivery_fee: 40,
            is_featured: true
        },
        menu: [
            { name: 'Butter Chicken', description: 'Tender chicken in rich, creamy tomato sauce', price: 350, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 450, preparation_time_mins: 25 },
            { name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled to perfection', price: 280, category: 'Starters', image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'medium', calories: 320, preparation_time_mins: 20 },
            { name: 'Dal Makhani', description: 'Slow-cooked black lentils in creamy gravy', price: 220, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80', is_vegetarian: true, spice_level: 'mild', calories: 380, preparation_time_mins: 30 },
            { name: 'Chicken Biryani', description: 'Fragrant basmati rice with spiced chicken', price: 320, category: 'Rice', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 520, preparation_time_mins: 35 },
            { name: 'Garlic Naan', description: 'Soft naan bread with garlic butter', price: 60, category: 'Breads', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 180, preparation_time_mins: 10 }
        ]
    },
    {
        ownerEmail: 'dragonpalace@gmail.com',
        ownerPassword: 'dragonpalace',
        ownerFirstName: 'Li',
        ownerLastName: 'Chen',
        restaurant: {
            name: 'Dragon Palace',
            description: 'Premium Chinese and Thai delicacies',
            cuisine_type: ['Chinese', 'Thai', 'Asian'],
            address: '456 Brigade Road',
            city: 'Bangalore',
            latitude: 12.9716,
            longitude: 77.5946,
            phone: '+91 98765 43211',
            image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200&q=80',
            average_rating: 4.3,
            total_reviews: 189,
            delivery_time_mins: 35,
            minimum_order: 250,
            delivery_fee: 50,
            is_featured: true
        },
        menu: [
            { name: 'Kung Pao Chicken', description: 'Stir-fried chicken with peanuts and chili', price: 380, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'hot', calories: 420, preparation_time_mins: 20 },
            { name: 'Veg Hakka Noodles', description: 'Stir-fried noodles with fresh vegetables', price: 220, category: 'Noodles', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', is_vegetarian: true, spice_level: 'medium', calories: 350, preparation_time_mins: 15 },
            { name: 'Spring Rolls', description: 'Crispy rolls filled with vegetables', price: 180, category: 'Starters', image_url: 'https://images.unsplash.com/photo-1548507200-d567e3f2bbce?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'mild', calories: 220, preparation_time_mins: 15 },
            { name: 'Thai Green Curry', description: 'Aromatic coconut curry with vegetables', price: 320, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80', is_vegetarian: true, spice_level: 'hot', calories: 380, preparation_time_mins: 25 }
        ]
    },
    {
        ownerEmail: 'pizzaparadise@gmail.com',
        ownerPassword: 'pizzaparadise',
        ownerFirstName: 'Mario',
        ownerLastName: 'Rossi',
        restaurant: {
            name: 'Pizza Paradise',
            description: 'Wood-fired pizzas and Italian classics',
            cuisine_type: ['Italian', 'Pizza', 'Pasta'],
            address: '789 Indiranagar',
            city: 'Bangalore',
            latitude: 12.9784,
            longitude: 77.6408,
            phone: '+91 98765 43212',
            image_url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=200&q=80',
            average_rating: 4.6,
            total_reviews: 456,
            delivery_time_mins: 25,
            minimum_order: 300,
            delivery_fee: 30,
            is_featured: true
        },
        menu: [
            { name: 'Margherita Pizza', description: 'Classic pizza with tomato, mozzarella and basil', price: 350, category: 'Pizza', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'mild', calories: 680, preparation_time_mins: 20 },
            { name: 'Pepperoni Pizza', description: 'Loaded with spicy pepperoni and cheese', price: 450, category: 'Pizza', image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 850, preparation_time_mins: 20 },
            { name: 'Pasta Alfredo', description: 'Creamy white sauce pasta with parmesan', price: 320, category: 'Pasta', image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&q=80', is_vegetarian: true, spice_level: 'mild', calories: 520, preparation_time_mins: 18 },
            { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 120, category: 'Sides', image_url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 220, preparation_time_mins: 10 }
        ]
    },
    {
        ownerEmail: 'biryanihouse@gmail.com',
        ownerPassword: 'biryanihouse',
        ownerFirstName: 'Ahmed',
        ownerLastName: 'Khan',
        restaurant: {
            name: 'Biryani House',
            description: 'Legendary Hyderabadi Biryani and Kebabs',
            cuisine_type: ['Biryani', 'Hyderabadi', 'Indian'],
            address: '321 Whitefield Main Road',
            city: 'Bangalore',
            latitude: 12.9698,
            longitude: 77.7499,
            phone: '+91 98765 43213',
            image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80',
            average_rating: 4.7,
            total_reviews: 567,
            delivery_time_mins: 40,
            minimum_order: 250,
            delivery_fee: 35,
            is_featured: true
        },
        menu: [
            { name: 'Hyderabadi Chicken Biryani', description: 'Authentic dum-style biryani with chicken', price: 380, category: 'Biryani', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 650, preparation_time_mins: 40 },
            { name: 'Mutton Biryani', description: 'Premium mutton biryani with aromatic spices', price: 450, category: 'Biryani', image_url: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'hot', calories: 720, preparation_time_mins: 45 },
            { name: 'Veg Biryani', description: 'Fragrant vegetable biryani', price: 280, category: 'Biryani', image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80', is_vegetarian: true, spice_level: 'medium', calories: 480, preparation_time_mins: 35 },
            { name: 'Seekh Kebab', description: 'Minced meat kebabs grilled on skewers', price: 320, category: 'Starters', image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 280, preparation_time_mins: 20 }
        ]
    },
    {
        ownerEmail: 'burgerbarn@gmail.com',
        ownerPassword: 'burgerbarn',
        ownerFirstName: 'John',
        ownerLastName: 'Smith',
        restaurant: {
            name: 'Burger Barn',
            description: 'Gourmet burgers and American classics',
            cuisine_type: ['American', 'Burgers', 'Fast Food'],
            address: '777 Electronic City',
            city: 'Bangalore',
            latitude: 12.8399,
            longitude: 77.6770,
            phone: '+91 98765 43215',
            image_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=200&q=80',
            average_rating: 4.2,
            total_reviews: 289,
            delivery_time_mins: 20,
            minimum_order: 200,
            delivery_fee: 40,
            is_featured: false
        },
        menu: [
            { name: 'Classic Cheeseburger', description: 'Juicy beef patty with cheese and special sauce', price: 280, category: 'Burgers', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'mild', calories: 650, preparation_time_mins: 15 },
            { name: 'Veggie Burger', description: 'Crispy vegetable patty with fresh toppings', price: 220, category: 'Burgers', image_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80', is_vegetarian: true, spice_level: 'mild', calories: 450, preparation_time_mins: 12 },
            { name: 'Loaded Fries', description: 'Crispy fries with cheese sauce and bacon', price: 180, category: 'Sides', image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 420, preparation_time_mins: 10 },
            { name: 'Chocolate Shake', description: 'Thick creamy chocolate milkshake', price: 150, category: 'Beverages', image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 380, preparation_time_mins: 5 }
        ]
    },
    {
        ownerEmail: 'dosacorner@gmail.com',
        ownerPassword: 'dosacorner',
        ownerFirstName: 'Venkat',
        ownerLastName: 'Raman',
        restaurant: {
            name: 'Dosa Corner',
            description: 'Traditional South Indian breakfast and meals',
            cuisine_type: ['South Indian', 'Dosa', 'Idli'],
            address: '999 BTM Layout',
            city: 'Bangalore',
            latitude: 12.9166,
            longitude: 77.6101,
            phone: '+91 98765 43217',
            image_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=200&q=80',
            average_rating: 4.6,
            total_reviews: 423,
            delivery_time_mins: 15,
            minimum_order: 100,
            delivery_fee: 20,
            is_featured: true
        },
        menu: [
            { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', price: 120, category: 'Dosa', image_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'medium', calories: 350, preparation_time_mins: 15 },
            { name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup (4 pcs)', price: 80, category: 'Idli', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'mild', calories: 280, preparation_time_mins: 10 },
            { name: 'Rava Upma', description: 'Savory semolina porridge with vegetables', price: 90, category: 'Breakfast', image_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80', is_vegetarian: true, is_vegan: true, spice_level: 'mild', calories: 320, preparation_time_mins: 12 },
            { name: 'Filter Coffee', description: 'Traditional South Indian filter coffee', price: 40, category: 'Beverages', image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 80, preparation_time_mins: 5 }
        ]
    }
];

// =============================================
// SEED FUNCTIONS
// =============================================

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function seedDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Create models
        const User = mongoose.model('User', userSchema);
        const Restaurant = mongoose.model('Restaurant', restaurantSchema);
        const MenuItem = mongoose.model('MenuItem', menuItemSchema);

        // Clear existing data for fresh start
        console.log('🧹 Clearing existing seed data...');
        await User.deleteMany({ email: 'admin@smarteats.com' });
        await User.deleteMany({ email: { $regex: /@gmail\.com$/, $options: 'i' }, role: 'restaurant' });
        await Restaurant.deleteMany({ ownerEmail: { $regex: /@gmail\.com$/, $options: 'i' } });
        await MenuItem.deleteMany({});
        console.log('   ✅ Cleared existing seed data\n');

        // =============================================
        // 1. CREATE ADMIN USER
        // =============================================
        console.log('👑 Creating Admin User...');
        const hashedAdminPassword = await hashPassword(ADMIN_USER.password);
        await User.create({
            ...ADMIN_USER,
            password: hashedAdminPassword
        });
        console.log('   ✅ Admin created: admin@smarteats.com / admin123\n');

        // =============================================
        // 2. CREATE RESTAURANT OWNERS & RESTAURANTS
        // =============================================
        console.log('🏪 Creating Restaurants & Menu Items...\n');

        let totalMenuItems = 0;

        for (const data of RESTAURANTS_DATA) {
            // Create restaurant owner user
            const hashedPassword = await hashPassword(data.ownerPassword);
            const owner = await User.create({
                email: data.ownerEmail,
                password: hashedPassword,
                role: 'restaurant',
                profile: {
                    firstName: data.ownerFirstName,
                    lastName: data.ownerLastName
                },
                isActive: true,
                approvalStatus: 'approved'
            });

            // Create restaurant
            const restaurant = await Restaurant.create({
                ownerId: owner._id,
                ownerEmail: data.ownerEmail,
                ...data.restaurant,
                status: 'approved',
                is_open: true
            });

            console.log(`   ✅ ${data.restaurant.name}`);
            console.log(`      Owner: ${data.ownerEmail} / ${data.ownerPassword}`);

            // Create menu items
            for (const item of data.menu) {
                await MenuItem.create({
                    restaurant_id: restaurant._id.toString(),
                    ...item,
                    is_available: true
                });
                totalMenuItems++;
            }
            console.log(`      Menu Items: ${data.menu.length}`);
            console.log('');
        }

        // =============================================
        // SUMMARY
        // =============================================
        const userCount = await User.countDocuments();
        const restaurantCount = await Restaurant.countDocuments();
        const menuItemCount = await MenuItem.countDocuments();

        console.log('='.repeat(60));
        console.log('📊 SEEDING COMPLETE');
        console.log('='.repeat(60));
        console.log(`   Total Users: ${userCount}`);
        console.log(`   Total Restaurants: ${restaurantCount}`);
        console.log(`   Total Menu Items: ${menuItemCount}`);
        console.log('');
        console.log('🔑 ADMIN CREDENTIALS:');
        console.log('   Email: admin@smarteats.com');
        console.log('   Password: admin123');
        console.log('');
        console.log('🏪 RESTAURANT OWNER CREDENTIALS:');
        console.log('-'.repeat(60));
        RESTAURANTS_DATA.forEach(r => {
            console.log(`   ${r.restaurant.name.padEnd(20)} ${r.ownerEmail.padEnd(28)} ${r.ownerPassword}`);
        });
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the seeding
seedDatabase();
