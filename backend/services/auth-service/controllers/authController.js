import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const register = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            role: role || 'customer',
            profile: {
                firstName,
                lastName,
                phone
            }
        });

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = user.generateTokens();

        // Store refresh token
        user.refreshTokens.push({
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        await user.save();

        // TODO: Send verification email (integrate with Celery worker)

        res.status(201).json({
            message: 'User registered successfully',
            user: user.toJSON(),
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                error: 'Account is deactivated',
                approvalStatus: user.approvalStatus
            });
        }

        // Check approval status for drivers and restaurants
        if (user.role === 'driver' || user.role === 'restaurant') {
            if (user.approvalStatus === 'pending') {
                return res.status(403).json({
                    error: 'Your application is pending admin approval. You will be notified once approved.',
                    approvalStatus: 'pending'
                });
            }
            if (user.approvalStatus === 'rejected') {
                return res.status(403).json({
                    error: user.rejectionReason || 'Your application was rejected. Please contact support for more information.',
                    approvalStatus: 'rejected'
                });
            }
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = user.generateTokens();

        // Store refresh token
        user.refreshTokens.push({
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        res.json({
            message: 'Login successful',
            user: user.toJSON(),
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user.userId;

        // Remove refresh token
        await User.findByIdAndUpdate(userId, {
            $pull: { refreshTokens: { token: refreshToken } }
        });

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed', message: error.message });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Find user and check if refresh token exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
        if (!tokenExists) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Generate new tokens
        const tokens = user.generateTokens();

        // Replace old refresh token with new one
        user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
        user.refreshTokens.push({
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        await user.save();

        res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            return res.json({ message: 'If email exists, password reset link has been sent' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        await user.save();

        // TODO: Send reset email (integrate with Celery worker)

        res.json({ message: 'If email exists, password reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.refreshTokens = []; // Invalidate all sessions

        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: user.toJSON() });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};

export const googleOAuth = async (req, res) => {
    try {
        const { credential, role } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential required' });
        }

        // Decode the JWT token from Google (credential is the ID token)
        // In production, verify the signature with Google's public keys
        const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

        const { email, given_name, family_name, sub: googleId, picture } = decoded;

        if (!email) {
            return res.status(400).json({ error: 'Unable to get email from Google' });
        }

        // Find or create user
        let user = await User.findOne({ email });

        if (user) {
            // User exists - update OAuth info if needed
            if (!user.oauthProvider) {
                user.oauthProvider = 'google';
                user.oauthId = googleId;
                user.isEmailVerified = true; // Google emails are verified
            }
            user.lastLogin = new Date();
            await user.save();
        } else {
            // Create new user
            const userRole = role || 'customer';

            // Validate role
            if (!['customer', 'restaurant', 'driver'].includes(userRole)) {
                return res.status(400).json({ error: 'Invalid role. Must be customer, restaurant, or driver' });
            }

            // Determine approval status based on role
            let approvalStatus = 'none';
            let isActive = true;

            if (userRole === 'driver' || userRole === 'restaurant') {
                approvalStatus = 'pending';
                isActive = false;
            }

            user = new User({
                email,
                role: userRole,
                profile: {
                    firstName: given_name || '',
                    lastName: family_name || '',
                    avatar: picture || ''
                },
                oauthProvider: 'google',
                oauthId: googleId,
                isEmailVerified: true,
                isActive: isActive,
                approvalStatus: approvalStatus
            });

            await user.save();
        }

        // Check approval status before allowing login
        if (user.role === 'driver' || user.role === 'restaurant') {
            if (user.approvalStatus === 'pending') {
                return res.status(403).json({
                    error: 'Your application is pending admin approval. You will be notified once approved.',
                    approvalStatus: 'pending'
                });
            }
            if (user.approvalStatus === 'rejected') {
                return res.status(403).json({
                    error: user.rejectionReason || 'Your application was rejected.',
                    approvalStatus: 'rejected'
                });
            }
        }

        // Generate tokens
        const { accessToken, refreshToken } = user.generateTokens();

        // Store refresh token
        user.refreshTokens.push({
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        await user.save();

        res.json({
            message: 'Login successful',
            user: user.toJSON(),
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({
            error: 'OAuth failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Authentication failed'
        });
    }
};

// =============================================
// ADMIN APPROVAL FUNCTIONS
// =============================================

export const getPendingUsers = async (req, res) => {
    try {
        const { role } = req.query; // 'driver' or 'restaurant'

        const query = { approvalStatus: 'pending' };
        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ error: 'Failed to fetch pending users' });
    }
};

export const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.approvalStatus !== 'pending') {
            return res.status(400).json({ error: 'User is not pending approval' });
        }

        // Approve user
        user.approvalStatus = 'approved';
        user.isActive = true;
        user.approvedBy = adminId;
        user.approvedAt = new Date();
        await user.save();

        // TODO: Send approval email/SMS notification

        res.json({
            message: 'User approved successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
};

export const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.approvalStatus !== 'pending') {
            return res.status(400).json({ error: 'User is not pending approval' });
        }

        // Reject user
        user.approvalStatus = 'rejected';
        user.isActive = false;
        user.rejectionReason = reason || 'Application did not meet requirements';
        user.approvedBy = adminId;
        user.approvedAt = new Date();
        await user.save();

        // TODO: Send rejection email/SMS notification

        res.json({
            message: 'User rejected successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ error: 'Failed to reject user' });
    }
};

export const getAllUsersByRole = async (req, res) => {
    try {
        const { role, approvalStatus } = req.query;

        const query = {};
        if (role) query.role = role;
        if (approvalStatus) query.approvalStatus = approvalStatus;

        const users = await User.find(query)
            .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
            .populate('approvedBy', 'profile.firstName profile.lastName email')
            .sort({ createdAt: -1 });

        res.json({ users, count: users.length });
    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
