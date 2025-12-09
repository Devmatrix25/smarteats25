/**
 * SmartEats Database Seeding Script
 * 
 * Run with: node seed-database.js
 * 
 * Creates data in the format expected by the FRONTEND (snake_case)
 * 
 * Admin Credentials:
 *   Email: admin@smarteats.com
 *   Password: admin123
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://SmartEatsTeam:Devmatrix123@smarteats25.lypxox6.mongodb.net/smarteats?retryWrites=true&w=majority&appName=smarteats25';

// =============================================
// SEED DATA - Matches FRONTEND format (snake_case)
// =============================================

const ADMIN_USER = {
    email: 'admin@smarteats.com',
    password: 'admin123',
    role: 'admin',
    profile: { firstName: 'Smart', lastName: 'Admin', phone: '+91 9999999999' },
    isEmailVerified: true,
    isActive: true,
    approvalStatus: 'none'
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
            opening_time: '10:00',
            closing_time: '23:00',
            is_featured: true,
            is_open: true
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
            opening_time: '11:00',
            closing_time: '22:30',
            is_featured: true,
            is_open: true
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
            opening_time: '11:00',
            closing_time: '23:30',
            is_featured: true,
            is_open: true
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
            opening_time: '11:00',
            closing_time: '23:00',
            is_featured: true,
            is_open: true
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
            opening_time: '10:00',
            closing_time: '00:00',
            is_featured: false,
            is_open: true
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
            opening_time: '06:00',
            closing_time: '22:00',
            is_featured: true,
            is_open: true
        },
        menu: [
            { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', price: 120, category: 'Dosa', image_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'medium', calories: 350, preparation_time_mins: 15 },
            { name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup (4 pcs)', price: 80, category: 'Idli', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'mild', calories: 280, preparation_time_mins: 10 },
            { name: 'Rava Upma', description: 'Savory semolina porridge with vegetables', price: 90, category: 'Breakfast', image_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80', is_vegetarian: true, is_vegan: true, spice_level: 'mild', calories: 320, preparation_time_mins: 12 },
            { name: 'Filter Coffee', description: 'Traditional South Indian filter coffee', price: 40, category: 'Beverages', image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 80, preparation_time_mins: 5 }
        ]
    },
    // ============ 10 MORE RESTAURANTS ============
    {
        ownerEmail: 'sushiworld@gmail.com',
        ownerPassword: 'sushiworld',
        ownerFirstName: 'Yuki',
        ownerLastName: 'Tanaka',
        restaurant: {
            name: 'Sushi World',
            description: 'Fresh Japanese sushi and ramen',
            cuisine_type: ['Japanese', 'Sushi', 'Asian'],
            address: '123 HSR Layout',
            city: 'Bangalore',
            latitude: 12.9116,
            longitude: 77.6389,
            phone: '+91 98765 43218',
            image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&q=80',
            average_rating: 4.4,
            total_reviews: 312,
            delivery_time_mins: 35,
            minimum_order: 400,
            delivery_fee: 50,
            opening_time: '12:00',
            closing_time: '22:00',
            is_featured: true,
            is_open: true
        },
        menu: [
            { name: 'California Roll', description: 'Crab, avocado, cucumber roll', price: 420, category: 'Sushi', image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'mild', calories: 280, preparation_time_mins: 15 },
            { name: 'Salmon Nigiri', description: 'Fresh salmon on seasoned rice', price: 380, category: 'Sushi', image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&q=80', is_vegetarian: false, spice_level: 'none', calories: 220, preparation_time_mins: 10 },
            { name: 'Tonkotsu Ramen', description: 'Rich pork bone broth with noodles', price: 350, category: 'Ramen', image_url: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 520, preparation_time_mins: 20 }
        ]
    },
    {
        ownerEmail: 'tacobellexpress@gmail.com',
        ownerPassword: 'tacobell',
        ownerFirstName: 'Carlos',
        ownerLastName: 'Martinez',
        restaurant: {
            name: 'Taco Bell Express',
            description: 'Authentic Mexican tacos and burritos',
            cuisine_type: ['Mexican', 'Tex-Mex', 'Fast Food'],
            address: '456 Jayanagar',
            city: 'Bangalore',
            latitude: 12.9299,
            longitude: 77.5824,
            phone: '+91 98765 43219',
            image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80',
            average_rating: 4.1,
            total_reviews: 198,
            delivery_time_mins: 25,
            minimum_order: 200,
            delivery_fee: 30,
            opening_time: '10:00',
            closing_time: '23:00',
            is_featured: false,
            is_open: true
        },
        menu: [
            { name: 'Chicken Tacos', description: 'Soft shell tacos with grilled chicken', price: 180, category: 'Tacos', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 320, preparation_time_mins: 12 },
            { name: 'Veggie Burrito', description: 'Large burrito with beans and veggies', price: 220, category: 'Burritos', image_url: 'https://images.unsplash.com/photo-1584208632869-05fa2b2a5934?w=400&q=80', is_vegetarian: true, spice_level: 'medium', calories: 450, preparation_time_mins: 15 },
            { name: 'Nachos Supreme', description: 'Loaded nachos with cheese and salsa', price: 250, category: 'Sides', image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'hot', calories: 480, preparation_time_mins: 10 }
        ]
    },
    {
        ownerEmail: 'thaikitchen@gmail.com',
        ownerPassword: 'thaikitchen',
        ownerFirstName: 'Sopa',
        ownerLastName: 'Thanarat',
        restaurant: {
            name: 'Thai Kitchen',
            description: 'Authentic Thai curries and street food',
            cuisine_type: ['Thai', 'Asian', 'Street Food'],
            address: '789 Marathahalli',
            city: 'Bangalore',
            latitude: 12.9559,
            longitude: 77.7019,
            phone: '+91 98765 43220',
            image_url: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=200&q=80',
            average_rating: 4.5,
            total_reviews: 267,
            delivery_time_mins: 30,
            minimum_order: 250,
            delivery_fee: 40,
            opening_time: '11:00',
            closing_time: '22:30',
            is_featured: true,
            is_open: true
        },
        menu: [
            { name: 'Pad Thai', description: 'Stir-fried rice noodles with prawns', price: 320, category: 'Noodles', image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 420, preparation_time_mins: 18 },
            { name: 'Tom Yum Soup', description: 'Spicy and sour Thai soup with shrimp', price: 280, category: 'Soups', image_url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&q=80', is_vegetarian: false, spice_level: 'hot', calories: 180, preparation_time_mins: 15 },
            { name: 'Mango Sticky Rice', description: 'Sweet coconut rice with fresh mango', price: 180, category: 'Desserts', image_url: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'none', calories: 350, preparation_time_mins: 10 }
        ]
    },
    {
        ownerEmail: 'mediterraneangrill@gmail.com',
        ownerPassword: 'medgrill',
        ownerFirstName: 'Yusuf',
        ownerLastName: 'Hassan',
        restaurant: {
            name: 'Mediterranean Grill',
            description: 'Fresh Mediterranean and Middle Eastern cuisine',
            cuisine_type: ['Mediterranean', 'Arabic', 'Healthy'],
            address: '321 Sadashivanagar',
            city: 'Bangalore',
            latitude: 13.0067,
            longitude: 77.5806,
            phone: '+91 98765 43221',
            image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
            average_rating: 4.6,
            total_reviews: 345,
            delivery_time_mins: 35,
            minimum_order: 300,
            delivery_fee: 45,
            opening_time: '11:00',
            closing_time: '23:00',
            is_featured: true,
            is_open: true
        },
        menu: [
            { name: 'Chicken Shawarma', description: 'Marinated chicken wrapped in pita', price: 220, category: 'Wraps', image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 480, preparation_time_mins: 15 },
            { name: 'Falafel Plate', description: 'Crispy chickpea balls with hummus', price: 280, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb6?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'mild', calories: 380, preparation_time_mins: 18 },
            { name: 'Hummus with Pita', description: 'Creamy chickpea dip with warm pita', price: 180, category: 'Starters', image_url: 'https://images.unsplash.com/photo-1637949385162-e416ea04cf72?w=400&q=80', is_vegetarian: true, is_vegan: true, spice_level: 'none', calories: 280, preparation_time_mins: 8 }
        ]
    },
    {
        ownerEmail: 'wokstation@gmail.com',
        ownerPassword: 'wokstation',
        ownerFirstName: 'Wei',
        ownerLastName: 'Zhang',
        restaurant: {
            name: 'Wok Station',
            description: 'Fast wok-tossed Asian cuisine',
            cuisine_type: ['Chinese', 'Pan-Asian', 'Fast Food'],
            address: '555 Bellandur',
            city: 'Bangalore',
            latitude: 12.9260,
            longitude: 77.6762,
            phone: '+91 98765 43222',
            image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80',
            average_rating: 4.2,
            total_reviews: 189,
            delivery_time_mins: 22,
            minimum_order: 180,
            delivery_fee: 35,
            opening_time: '11:00',
            closing_time: '22:00',
            is_featured: false,
            is_open: true
        },
        menu: [
            { name: 'Kung Pao Tofu', description: 'Crispy tofu with peanuts and chili', price: 260, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'hot', calories: 340, preparation_time_mins: 15 },
            { name: 'Schezwan Fried Rice', description: 'Spicy fried rice with vegetables', price: 220, category: 'Rice', image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', is_vegetarian: true, spice_level: 'hot', calories: 420, preparation_time_mins: 12 },
            { name: 'Dim Sum Basket', description: 'Assorted steamed dumplings (6 pcs)', price: 280, category: 'Starters', image_url: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'mild', calories: 280, preparation_time_mins: 20 }
        ]
    },
    {
        ownerEmail: 'cafemocha@gmail.com',
        ownerPassword: 'cafemocha',
        ownerFirstName: 'Priya',
        ownerLastName: 'Nair',
        restaurant: {
            name: 'Cafe Mocha',
            description: 'Artisan coffee and continental delights',
            cuisine_type: ['Cafe', 'Continental', 'Desserts'],
            address: '888 Church Street',
            city: 'Bangalore',
            latitude: 12.9747,
            longitude: 77.6094,
            phone: '+91 98765 43223',
            image_url: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=200&q=80',
            average_rating: 4.5,
            total_reviews: 412,
            delivery_time_mins: 25,
            minimum_order: 200,
            delivery_fee: 30,
            opening_time: '08:00',
            closing_time: '23:00',
            is_featured: true,
            is_open: true
        },
        menu: [
            { name: 'Cappuccino', description: 'Classic Italian coffee with foam', price: 150, category: 'Coffee', image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'none', calories: 120, preparation_time_mins: 5 },
            { name: 'Club Sandwich', description: 'Triple-decker with chicken and veggies', price: 280, category: 'Sandwiches', image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'mild', calories: 420, preparation_time_mins: 15 },
            { name: 'Chocolate Brownie', description: 'Warm brownie with vanilla ice cream', price: 220, category: 'Desserts', image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 450, preparation_time_mins: 8 }
        ]
    },
    {
        ownerEmail: 'keralakitchen@gmail.com',
        ownerPassword: 'keralakitchen',
        ownerFirstName: 'Thomas',
        ownerLastName: 'Mathew',
        restaurant: {
            name: 'Kerala Kitchen',
            description: 'Traditional Kerala cuisine and seafood',
            cuisine_type: ['Kerala', 'South Indian', 'Seafood'],
            address: '111 Richmond Road',
            city: 'Bangalore',
            latitude: 12.9622,
            longitude: 77.6078,
            phone: '+91 98765 43224',
            image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80',
            average_rating: 4.7,
            total_reviews: 523,
            delivery_time_mins: 40,
            minimum_order: 300,
            delivery_fee: 45,
            opening_time: '11:00',
            closing_time: '22:00',
            is_featured: true,
            is_open: true
        },
        menu: [
            { name: 'Kerala Fish Curry', description: 'Tangy fish curry with coconut milk', price: 380, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'medium', calories: 320, preparation_time_mins: 25 },
            { name: 'Appam with Stew', description: 'Soft rice pancake with vegetable stew', price: 180, category: 'Breakfast', image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'mild', calories: 280, preparation_time_mins: 15 },
            { name: 'Prawn Masala', description: 'Spicy masala prawns Kerala style', price: 420, category: 'Seafood', image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', is_vegetarian: false, spice_level: 'hot', calories: 280, preparation_time_mins: 20 }
        ]
    },
    {
        ownerEmail: 'healthybowl@gmail.com',
        ownerPassword: 'healthybowl',
        ownerFirstName: 'Ananya',
        ownerLastName: 'Gupta',
        restaurant: {
            name: 'Healthy Bowl',
            description: 'Nutritious salads and protein bowls',
            cuisine_type: ['Healthy', 'Salads', 'Vegan'],
            address: '222 Koramangala 5th Block',
            city: 'Bangalore',
            latitude: 12.9341,
            longitude: 77.6178,
            phone: '+91 98765 43225',
            image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80',
            average_rating: 4.4,
            total_reviews: 289,
            delivery_time_mins: 20,
            minimum_order: 250,
            delivery_fee: 25,
            opening_time: '09:00',
            closing_time: '21:00',
            is_featured: false,
            is_open: true,
            pure_veg: true
        },
        menu: [
            { name: 'Quinoa Buddha Bowl', description: 'Quinoa with roasted veggies and tahini', price: 320, category: 'Bowls', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'mild', calories: 380, preparation_time_mins: 12 },
            { name: 'Grilled Chicken Salad', description: 'Fresh greens with grilled chicken breast', price: 340, category: 'Salads', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', is_vegetarian: false, is_bestseller: true, spice_level: 'none', calories: 320, preparation_time_mins: 15 },
            { name: 'Acai Smoothie Bowl', description: 'Acai blend with granola and fruits', price: 280, category: 'Smoothie Bowls', image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80', is_vegetarian: true, is_vegan: true, spice_level: 'none', calories: 280, preparation_time_mins: 8 }
        ]
    },
    {
        ownerEmail: 'punjabidhaaba@gmail.com',
        ownerPassword: 'punjabidhaaba',
        ownerFirstName: 'Harpreet',
        ownerLastName: 'Singh',
        restaurant: {
            name: 'Punjabi Dhaba',
            description: 'Authentic Punjabi highway-style food',
            cuisine_type: ['Punjabi', 'North Indian', 'Dhaba'],
            address: '333 Yeshwanthpur',
            city: 'Bangalore',
            latitude: 13.0289,
            longitude: 77.5416,
            phone: '+91 98765 43226',
            image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80',
            average_rating: 4.3,
            total_reviews: 678,
            delivery_time_mins: 35,
            minimum_order: 200,
            delivery_fee: 40,
            opening_time: '10:00',
            closing_time: '00:00',
            is_featured: false,
            is_open: true
        },
        menu: [
            { name: 'Butter Naan', description: 'Soft tandoor-baked bread with butter', price: 50, category: 'Breads', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'none', calories: 180, preparation_time_mins: 8 },
            { name: 'Sarson Da Saag', description: 'Mustard greens with makki roti', price: 220, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'mild', calories: 320, preparation_time_mins: 20 },
            { name: 'Lassi', description: 'Traditional sweet yogurt drink', price: 80, category: 'Beverages', image_url: 'https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 180, preparation_time_mins: 5 }
        ]
    },
    {
        ownerEmail: 'icecreamdreams@gmail.com',
        ownerPassword: 'icecreamdreams',
        ownerFirstName: 'Rohan',
        ownerLastName: 'Mehta',
        restaurant: {
            name: 'Ice Cream Dreams',
            description: 'Premium ice creams and frozen desserts',
            cuisine_type: ['Desserts', 'Ice Cream', 'Cafe'],
            address: '444 JP Nagar',
            city: 'Bangalore',
            latitude: 12.9063,
            longitude: 77.5857,
            phone: '+91 98765 43227',
            image_url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
            logo_url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=80',
            average_rating: 4.8,
            total_reviews: 892,
            delivery_time_mins: 15,
            minimum_order: 150,
            delivery_fee: 20,
            opening_time: '11:00',
            closing_time: '23:00',
            is_featured: true,
            is_open: true,
            pure_veg: true
        },
        menu: [
            { name: 'Belgian Chocolate', description: 'Rich Belgian chocolate ice cream', price: 120, category: 'Ice Cream', image_url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80', is_vegetarian: true, is_bestseller: true, spice_level: 'none', calories: 280, preparation_time_mins: 3 },
            { name: 'Mango Sorbet', description: 'Fresh Alphonso mango sorbet', price: 100, category: 'Sorbets', image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&q=80', is_vegetarian: true, is_vegan: true, is_bestseller: true, spice_level: 'none', calories: 150, preparation_time_mins: 3 },
            { name: 'Sundae Supreme', description: 'Three scoops with brownie and sauce', price: 220, category: 'Sundaes', image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', is_vegetarian: true, spice_level: 'none', calories: 580, preparation_time_mins: 5 }
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

        const db = mongoose.connection.db;

        // =============================================
        // CLEAR EXISTING SEED DATA
        // =============================================
        console.log('🧹 Clearing existing seed data...');
        await db.collection('users').deleteOne({ email: 'admin@smarteats.com' });

        for (const data of RESTAURANTS_DATA) {
            await db.collection('users').deleteOne({ email: data.ownerEmail });
            await db.collection('restaurants').deleteOne({ owner_email: data.ownerEmail });
        }
        await db.collection('menuitems').deleteMany({});
        console.log('   ✅ Cleared\n');

        // =============================================
        // 1. CREATE ADMIN USER
        // =============================================
        console.log('👑 Creating Admin User...');
        const hashedAdminPassword = await hashPassword(ADMIN_USER.password);
        await db.collection('users').insertOne({
            ...ADMIN_USER,
            password: hashedAdminPassword,
            createdAt: new Date(),
            updatedAt: new Date()
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
            const ownerResult = await db.collection('users').insertOne({
                email: data.ownerEmail,
                password: hashedPassword,
                role: 'restaurant',
                profile: {
                    firstName: data.ownerFirstName,
                    lastName: data.ownerLastName
                },
                isEmailVerified: true,
                isActive: true,
                approvalStatus: 'approved',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Create restaurant with FRONTEND format (snake_case, owner_email, status: approved)
            const restaurantResult = await db.collection('restaurants').insertOne({
                owner_email: data.ownerEmail,  // IMPORTANT: snake_case for frontend
                ownerId: ownerResult.insertedId,
                ...data.restaurant,
                status: 'approved',  // IMPORTANT: 'approved' for frontend
                created_date: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const restaurantId = restaurantResult.insertedId.toString();

            console.log(`   ✅ ${data.restaurant.name}`);
            console.log(`      Owner: ${data.ownerEmail} / ${data.ownerPassword}`);

            // Create menu items
            for (const item of data.menu) {
                await db.collection('menuitems').insertOne({
                    restaurant_id: restaurantId,
                    ...item,
                    is_available: true,
                    created_date: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                totalMenuItems++;
            }
            console.log(`      Menu Items: ${data.menu.length}\n`);
        }

        // =============================================
        // SUMMARY
        // =============================================
        const userCount = await db.collection('users').countDocuments();
        const restaurantCount = await db.collection('restaurants').countDocuments();
        const menuItemCount = await db.collection('menuitems').countDocuments();

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
