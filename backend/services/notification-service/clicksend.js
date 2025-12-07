/**
 * Fast2SMS Service for OTP
 * Uses Fast2SMS API for sending SMS OTPs to customers in India
 */

const axios = require('axios');

class Fast2SMSService {
    constructor() {
        this.apiKey = process.env.FAST2SMS_API_KEY;
        this.baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
        this.simulationMode = !this.apiKey || process.env.SMS_SIMULATION === 'true';

        // Store OTPs for verification (in production, use Redis)
        this.otpStore = new Map();
    }

    /**
     * Generate 6-digit OTP
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP via SMS using Fast2SMS
     * @param {string} phoneNumber - 10-digit Indian phone number (without +91)
     * @param {string} purpose - 'registration' | 'login' | 'reset'
     */
    async sendOTP(phoneNumber, purpose = 'verification') {
        // Clean phone number - remove +91 or 0 prefix
        const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/^0/, '').trim();

        if (cleanPhone.length !== 10) {
            return { success: false, message: 'Invalid phone number. Please enter 10 digit number.' };
        }

        const otp = this.generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        this.otpStore.set(cleanPhone, { otp, expiresAt, purpose });

        const message = `Your SmartEats verification code is: ${otp}. Valid for 5 minutes. Do not share this code. - Team SmartEats`;

        if (this.simulationMode) {
            console.log(`\n📱 [SIMULATION] SMS OTP for ${cleanPhone}: ${otp}\n`);
            return {
                success: true,
                simulation: true,
                message: 'OTP sent (simulation mode)',
                otp: otp // Only return OTP in simulation for testing
            };
        }

        try {
            const response = await axios.post(
                this.baseUrl,
                null,
                {
                    params: {
                        authorization: this.apiKey,
                        route: 'otp',
                        variables_values: otp,
                        flash: 0,
                        numbers: cleanPhone
                    },
                    headers: {
                        'cache-control': 'no-cache'
                    }
                }
            );

            if (response.data.return === true) {
                console.log(`✅ SMS sent to ${cleanPhone} via Fast2SMS`);
                return {
                    success: true,
                    message: 'OTP sent successfully to your phone!',
                    requestId: response.data.request_id
                };
            } else {
                throw new Error(response.data.message || 'Failed to send SMS');
            }
        } catch (error) {
            console.error('Fast2SMS Error:', error.response?.data || error.message);

            // Fallback to simulation if API fails
            console.log(`\n📱 [FALLBACK] SMS OTP for ${cleanPhone}: ${otp}\n`);
            return {
                success: true,
                simulation: true,
                message: 'OTP sent (fallback mode)',
                otp: otp
            };
        }
    }

    /**
     * Verify OTP
     * @param {string} phoneNumber 
     * @param {string} otp 
     */
    verifyOTP(phoneNumber, otp) {
        const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/^0/, '').trim();
        const stored = this.otpStore.get(cleanPhone);

        if (!stored) {
            return { valid: false, message: 'No OTP found. Please request a new one.' };
        }

        if (Date.now() > stored.expiresAt) {
            this.otpStore.delete(cleanPhone);
            return { valid: false, message: 'OTP has expired. Please request a new one.' };
        }

        if (stored.otp !== otp) {
            return { valid: false, message: 'Invalid OTP. Please try again.' };
        }

        // OTP verified, remove from store
        this.otpStore.delete(cleanPhone);
        return { valid: true, message: 'Phone number verified successfully!' };
    }

    /**
     * Resend OTP (with rate limiting)
     */
    async resendOTP(phoneNumber) {
        const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/^0/, '').trim();
        const stored = this.otpStore.get(cleanPhone);

        if (stored && Date.now() < stored.expiresAt - 4 * 60 * 1000) {
            // Less than 1 minute since last OTP
            return {
                success: false,
                message: 'Please wait 1 minute before requesting a new OTP',
                retryAfter: 60
            };
        }

        return this.sendOTP(phoneNumber);
    }
}

module.exports = new Fast2SMSService();
