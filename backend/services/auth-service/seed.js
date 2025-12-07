import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarteats';

const demoUsers = [
    {
        email: 'customer@demo.com',
        password: 'password123',
        role: 'customer',
        profile: { firstName: 'Demo', lastName: 'Customer', phone: '1234567890' }
    },
    {
        email: 'restaurant@demo.com',
        password: 'password123',
        role: 'restaurant',
        profile: { firstName: 'Demo', lastName: 'Owner', phone: '1234567890' }
    },
    {
        email: 'driver@demo.com',
        password: 'password123',
        role: 'driver',
        profile: { firstName: 'Demo', lastName: 'Driver', phone: '1234567890' }
    },
    {
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin',
        profile: { firstName: 'Demo', lastName: 'Admin', phone: '1234567890' }
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const userData of demoUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.email} already exists`);
                // Update password just in case
                existingUser.password = userData.password;
                existingUser.role = userData.role;
                existingUser.profile = userData.profile;
                existingUser.isEmailVerified = true;
                await existingUser.save();
                console.log(`Updated ${userData.email}`);
            } else {
                const user = new User({
                    ...userData,
                    isEmailVerified: true
                });
                await user.save();
                console.log(`Created ${userData.email}`);
            }
        }

        console.log('\n✅ Demo users seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
