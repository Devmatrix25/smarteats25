import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Load environment variables from root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarteats';

const verifyUser = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'customer@demo.com';
        const password = 'password123';

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`❌ User ${email} NOT FOUND`);
        } else {
            console.log(`✅ User ${email} FOUND`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Is Active: ${user.isActive}`);
            console.log(`   Is Verified: ${user.isEmailVerified}`);

            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                console.log(`✅ Password match: SUCCESS`);
            } else {
                console.log(`❌ Password match: FAILED`);
                console.log(`   Stored Hash: ${user.password}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error verifying user:', error);
        process.exit(1);
    }
};

verifyUser();
