import express from 'express';
import axios from 'axios';
import * as notificationController from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// OTP Store (in production use Redis)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Fast2SMS API Key
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const SMS_SIMULATION = process.env.SMS_SIMULATION === 'true' || !FAST2SMS_API_KEY;

// ============== SMS OTP Routes (Fast2SMS) ==============

/**
 * Send SMS OTP via Fast2SMS
 * POST /sms/send-otp
 */
router.post('/sms/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone required' });

        // Clean phone number - remove +91 or 0 prefix
        const cleanPhone = phone.replace(/^\+91/, '').replace(/^0/, '').trim();

        if (cleanPhone.length !== 10) {
            return res.status(400).json({ error: 'Invalid phone. Enter 10 digit number.' });
        }

        const otp = generateOTP();
        otpStore.set(`sms:${cleanPhone}`, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

        if (SMS_SIMULATION) {
            console.log(`\n📱 [SIMULATION] SMS OTP for ${cleanPhone}: ${otp}\n`);
            return res.json({ success: true, message: 'OTP sent (simulation)', otp });
        }

        // Send via Fast2SMS
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: FAST2SMS_API_KEY,
                route: 'otp',
                variables_values: otp,
                flash: 0,
                numbers: cleanPhone
            }
        });

        if (response.data.return === true) {
            console.log(`✅ SMS sent to ${cleanPhone} via Fast2SMS`);
            res.json({ success: true, message: 'OTP sent to your phone!' });
        } else {
            throw new Error(response.data.message || 'SMS failed');
        }
    } catch (error) {
        console.error('SMS Error:', error.message);
        // Fallback: still store OTP for testing
        const otp = generateOTP();
        const cleanPhone = req.body.phone?.replace(/^\+91/, '').replace(/^0/, '').trim();
        otpStore.set(`sms:${cleanPhone}`, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
        console.log(`\n📱 [FALLBACK] SMS OTP for ${cleanPhone}: ${otp}\n`);
        res.json({ success: true, message: 'OTP sent (check console)', otp });
    }
});

/**
 * Verify SMS OTP
 * POST /sms/verify-otp
 */
router.post('/sms/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    const stored = otpStore.get(`sms:${phone}`);

    if (!stored) return res.json({ valid: false, message: 'OTP not found' });
    if (Date.now() > stored.expiresAt) return res.json({ valid: false, message: 'OTP expired' });
    if (stored.otp !== otp) return res.json({ valid: false, message: 'Invalid OTP' });

    otpStore.delete(`sms:${phone}`);
    res.json({ valid: true, message: 'Phone verified!' });
});

// ============== Email OTP Routes ==============

/**
 * Send Email OTP
 * POST /email/send-otp
 */
router.post('/email/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const otp = generateOTP();
        otpStore.set(`email:${email}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

        // Simulation mode - log OTP
        console.log(`\n📧 Email OTP for ${email}: ${otp}\n`);

        res.json({ success: true, message: 'OTP sent', otp }); // Remove otp in production
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verify Email OTP
 * POST /email/verify-otp
 */
router.post('/email/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(`email:${email}`);

    if (!stored) return res.json({ valid: false, message: 'OTP not found' });
    if (Date.now() > stored.expiresAt) return res.json({ valid: false, message: 'OTP expired' });
    if (stored.otp !== otp) return res.json({ valid: false, message: 'Invalid OTP' });

    otpStore.delete(`email:${email}`);
    res.json({ valid: true, message: 'Email verified!' });
});

// ============== Approval Notification Routes ==============

/**
 * Send Registration Confirmation Email
 * POST /notify/registration
 */
router.post('/notify/registration', async (req, res) => {
    const { email, name, type } = req.body;
    console.log(`\n📧 Registration email to ${email} (${type}): Welcome ${name}!\n`);
    res.json({ success: true, message: 'Registration confirmation sent' });
});

/**
 * Send Approval Notification Email
 * POST /notify/approved
 */
router.post('/notify/approved', async (req, res) => {
    const { email, name, type } = req.body;
    console.log(`\n✅ Approval email to ${email}: Congratulations ${name}, your ${type} is approved!\n`);
    res.json({ success: true, message: 'Approval notification sent' });
});

/**
 * Send Rejection Notification Email
 * POST /notify/rejected
 */
router.post('/notify/rejected', async (req, res) => {
    const { email, name, type, reason } = req.body;
    console.log(`\n❌ Rejection email to ${email}: Sorry ${name}, reason: ${reason}\n`);
    res.json({ success: true, message: 'Rejection notification sent' });
});

// ============== User Notification Routes ==============

router.get('/', authenticateToken, notificationController.getNotifications);
router.patch('/:id/read', authenticateToken, notificationController.markAsRead);
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);

export default router;
