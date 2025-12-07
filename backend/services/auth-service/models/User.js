import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: function () {
            return !this.oauthProvider; // Password not required for OAuth users
        }
    },
    role: {
        type: String,
        enum: ['customer', 'restaurant', 'driver', 'admin'],
        required: true,
        default: 'customer'
    },
    profile: {
        firstName: String,
        lastName: String,
        phone: String,
        avatar: String
    },
    oauthProvider: {
        type: String,
        enum: ['google', 'facebook', null],
        default: null
    },
    oauthId: {
        type: String,
        sparse: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: function () {
            // Drivers and restaurants start as inactive until approved
            if (this.role === 'driver' || this.role === 'restaurant') {
                return false;
            }
            return true;
        }
    },
    approvalStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: function () {
            // Only drivers and restaurants need approval
            if (this.role === 'driver' || this.role === 'restaurant') {
                return 'pending';
            }
            return 'none';
        }
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    lastLogin: {
        type: Date
    },
    refreshTokens: [{
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date
    }],
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate tokens
userSchema.methods.generateTokens = function () {

    const accessToken = jwt.sign(
        {
            userId: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
        {
            userId: this._id,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    return { accessToken, refreshToken };
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshTokens;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
