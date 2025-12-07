/**
 * SMTP Email Service
 * Handles all transactional emails including OTP and notifications
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.simulationMode = !process.env.SMTP_HOST || process.env.EMAIL_SIMULATION === 'true';

        if (!this.simulationMode) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }

        // Store email OTPs
        this.otpStore = new Map();

        this.fromEmail = process.env.SMTP_FROM || 'noreply@smarteats.com';
        this.fromName = 'SmartEats Team';
    }

    /**
     * Generate 6-digit OTP
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP Email for customer verification
     */
    async sendOTPEmail(email, purpose = 'verification') {
        const otp = this.generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        this.otpStore.set(email, { otp, expiresAt, purpose });

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #F25C23, #FF8C42); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; text-align: center; }
          .otp-box { background: linear-gradient(135deg, #f8f8f8, #fff); border: 2px dashed #F25C23; border-radius: 12px; padding: 25px; margin: 25px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #F25C23; letter-spacing: 8px; font-family: monospace; }
          .footer { background: #1D1D1F; color: #888; padding: 20px; text-align: center; font-size: 12px; }
          .emoji { font-size: 48px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ SmartEats</h1>
          </div>
          <div class="content">
            <div class="emoji">🔐</div>
            <h2 style="color: #1D1D1F; margin-bottom: 10px;">Verify Your Email</h2>
            <p style="color: #666;">Use this code to complete your verification:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p style="color: #999; font-size: 14px;">This code expires in <strong>10 minutes</strong></p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            © 2024 SmartEats • Made with ❤️ in India
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail(email, '🔐 Your SmartEats Verification Code', html, otp);
    }

    /**
     * Verify Email OTP
     */
    verifyOTP(email, otp) {
        const stored = this.otpStore.get(email);

        if (!stored) {
            return { valid: false, message: 'No OTP found. Please request a new one.' };
        }

        if (Date.now() > stored.expiresAt) {
            this.otpStore.delete(email);
            return { valid: false, message: 'OTP has expired. Please request a new one.' };
        }

        if (stored.otp !== otp) {
            return { valid: false, message: 'Invalid OTP. Please try again.' };
        }

        this.otpStore.delete(email);
        return { valid: true, message: 'Email verified successfully!' };
    }

    /**
     * Send Registration Confirmation (Restaurant/Driver)
     */
    async sendRegistrationConfirmation(email, name, type = 'restaurant') {
        const entityType = type === 'restaurant' ? 'Restaurant' : 'Delivery Partner';

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #F25C23, #FF8C42); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 32px; }
          .content { padding: 40px 30px; }
          .highlight-box { background: linear-gradient(135deg, #FFF7F2, #FFE8DC); border-left: 4px solid #F25C23; padding: 20px; border-radius: 0 12px 12px 0; margin: 25px 0; }
          .steps { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; }
          .step { display: flex; align-items: center; margin: 15px 0; }
          .step-num { width: 32px; height: 32px; background: #F25C23; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
          .footer { background: #1D1D1F; color: white; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; color: #888; }
          .emoji { font-size: 64px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🎉</div>
            <h1>Welcome to SmartEats!</h1>
          </div>
          <div class="content">
            <h2 style="color: #1D1D1F;">Hello ${name}! 👋</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for registering as a <strong>${entityType}</strong> partner with SmartEats! 
              We're excited to have you on board.
            </p>
            
            <div class="highlight-box">
              <h3 style="color: #F25C23; margin-top: 0;">📋 Registration Under Review</h3>
              <p style="color: #555; margin-bottom: 0;">
                Your registration is currently being reviewed by our team. 
                We verify all partner details to ensure the best experience for our customers.
              </p>
            </div>

            <div class="steps">
              <h3 style="color: #1D1D1F; margin-top: 0;">What happens next?</h3>
              <div class="step">
                <div class="step-num">1</div>
                <span>Our team reviews your application (24-48 hours)</span>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <span>You'll receive an email with the approval status</span>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <span>Once approved, you can start ${type === 'restaurant' ? 'adding menu items' : 'accepting deliveries'}!</span>
              </div>
            </div>

            <p style="color: #999; font-size: 14px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>
          <div class="footer">
            <p style="color: white; font-size: 16px; font-weight: bold;">Team SmartEats</p>
            <p>© 2024 SmartEats Pvt. Ltd. • All Rights Reserved</p>
            <p style="font-size: 11px; margin-top: 15px;">
              This is an automated email. Please do not reply directly.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail(email, `🎉 Welcome to SmartEats, ${name}!`, html);
    }

    /**
     * Send Approval Notification
     */
    async sendApprovalNotification(email, name, type = 'restaurant') {
        const entityType = type === 'restaurant' ? 'Restaurant' : 'Driver';
        const nextStep = type === 'restaurant'
            ? 'You can now log in and start adding your delicious menu items!'
            : 'You can now go online and start accepting delivery requests!';

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3BA55D, #2ECC71); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 32px; }
          .content { padding: 40px 30px; text-align: center; }
          .checkmark { width: 80px; height: 80px; background: linear-gradient(135deg, #3BA55D, #2ECC71); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; }
          .success-box { background: linear-gradient(135deg, #E8F5E9, #C8E6C9); border-radius: 12px; padding: 25px; margin: 25px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #F25C23, #FF8C42); color: white; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 20px; }
          .footer { background: #1D1D1F; color: white; padding: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Congratulations!</h1>
          </div>
          <div class="content">
            <div class="checkmark">
              <span style="color: white; font-size: 40px;">✓</span>
            </div>
            <h2 style="color: #1D1D1F;">Great News, ${name}! 🎊</h2>
            <p style="color: #666; font-size: 18px;">
              Your ${entityType} account has been <strong style="color: #3BA55D;">APPROVED</strong>!
            </p>
            
            <div class="success-box">
              <h3 style="color: #2E7D32; margin-top: 0;">You're All Set!</h3>
              <p style="color: #555; margin-bottom: 0;">
                ${nextStep}
              </p>
            </div>

            <a href="#" class="cta-button">Login to Dashboard →</a>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Welcome to the SmartEats family! 🍽️
            </p>
          </div>
          <div class="footer">
            <p style="color: white; font-size: 16px; font-weight: bold;">Team SmartEats</p>
            <p style="color: #888;">© 2024 SmartEats Pvt. Ltd.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail(email, `✅ Congratulations! Your ${entityType} Account is Approved`, html);
    }

    /**
     * Send Rejection Notification
     */
    async sendRejectionNotification(email, name, type = 'restaurant', reason = '') {
        const entityType = type === 'restaurant' ? 'Restaurant' : 'Driver';

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #666, #888); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .reason-box { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 20px; border-radius: 0 12px 12px 0; margin: 25px 0; }
          .footer { background: #1D1D1F; color: white; padding: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Update</h1>
          </div>
          <div class="content">
            <h2 style="color: #1D1D1F;">Dear ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in partnering with SmartEats. 
              After careful review, we regret to inform you that we are unable to approve your ${entityType.toLowerCase()} registration at this time.
            </p>
            
            ${reason ? `
            <div class="reason-box">
              <h3 style="color: #E65100; margin-top: 0;">📝 Reason</h3>
              <p style="color: #555; margin-bottom: 0;">${reason}</p>
            </div>
            ` : ''}

            <p style="color: #666; font-size: 16px;">
              If you believe this decision was made in error or if you have additional information to provide, 
              please don't hesitate to contact our support team at <strong>support@smarteats.com</strong>.
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              We appreciate your understanding and hope to work with you in the future.
            </p>
          </div>
          <div class="footer">
            <p style="color: white; font-size: 16px; font-weight: bold;">Team SmartEats</p>
            <p style="color: #888;">© 2024 SmartEats Pvt. Ltd.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail(email, `SmartEats ${entityType} Registration Update`, html);
    }

    /**
     * Core email sending function
     */
    async sendEmail(to, subject, html, otp = null) {
        if (this.simulationMode) {
            console.log(`\n📧 [SIMULATION] Email to: ${to}`);
            console.log(`   Subject: ${subject}`);
            if (otp) console.log(`   OTP: ${otp}`);
            console.log('');

            return {
                success: true,
                simulation: true,
                message: 'Email sent (simulation mode)',
                otp: otp
            };
        }

        try {
            const result = await this.transporter.sendMail({
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to,
                subject,
                html
            });

            return {
                success: true,
                messageId: result.messageId,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('Email Error:', error.message);

            // Fallback to simulation
            console.log(`\n📧 [FALLBACK] Email to: ${to} - ${subject}\n`);
            return {
                success: true,
                simulation: true,
                message: 'Email sent (fallback simulation)',
                otp: otp
            };
        }
    }
}

module.exports = new EmailService();
