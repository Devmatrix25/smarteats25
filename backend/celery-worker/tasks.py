from celery_app import app
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
import json

@app.task(name='tasks.send_email')
def send_email(to_email, subject, body, html_body=None):
    """
    Send email via SMTP
    """
    try:
        smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_user = os.getenv('SMTP_USER')
        smtp_password = os.getenv('SMTP_PASSWORD')
        from_email = os.getenv('EMAIL_FROM', 'SmartEats <noreply@smarteats.com>')

        if not smtp_user or not smtp_password:
            print("⚠️  SMTP credentials not configured")
            return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email

        # Attach plain text
        msg.attach(MIMEText(body, 'plain'))

        # Attach HTML if provided
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))

        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False


@app.task(name='tasks.send_verification_email')
def send_verification_email(to_email, verification_token, user_name):
    """
    Send email verification link
    """
    verification_url = f"{os.getenv('CUSTOMER_APP_URL')}/verify-email/{verification_token}"
    
    subject = "Verify your SmartEats account"
    body = f"""
    Hi {user_name},

    Welcome to SmartEats! Please verify your email address by clicking the link below:

    {verification_url}

    This link will expire in 24 hours.

    If you didn't create this account, please ignore this email.

    Best regards,
    SmartEats Team
    """
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Welcome to SmartEats!</h2>
            <p>Hi {user_name},</p>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="{verification_url}" style="display: inline-block; padding: 10px 20px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>Or copy and paste this link: {verification_url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>SmartEats Team</p>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, body, html_body)


@app.task(name='tasks.send_password_reset_email')
def send_password_reset_email(to_email, reset_token, user_name):
    """
    Send password reset link
    """
    reset_url = f"{os.getenv('CUSTOMER_APP_URL')}/reset-password/{reset_token}"
    
    subject = "Reset your SmartEats password"
    body = f"""
    Hi {user_name},

    You requested to reset your password. Click the link below to reset it:

    {reset_url}

    This link will expire in 1 hour.

    If you didn't request this, please ignore this email.

    Best regards,
    SmartEats Team
    """
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Password Reset Request</h2>
            <p>Hi {user_name},</p>
            <p>You requested to reset your password. Click the button below:</p>
            <a href="{reset_url}" style="display: inline-block; padding: 10px 20px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>Or copy and paste this link: {reset_url}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>SmartEats Team</p>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, body, html_body)


@app.task(name='tasks.send_order_confirmation')
def send_order_confirmation(to_email, order_data):
    """
    Send order confirmation email
    """
    subject = f"Order Confirmation - #{order_data['orderNumber']}"
    body = f"""
    Hi {order_data['customerName']},

    Your order has been confirmed!

    Order Number: #{order_data['orderNumber']}
    Restaurant: {order_data['restaurantName']}
    Total: ${order_data['total']}
    Estimated Delivery: {order_data['estimatedDelivery']}

    You can track your order at: {os.getenv('CUSTOMER_APP_URL')}/order-tracking/{order_data['orderId']}

    Thank you for choosing SmartEats!

    Best regards,
    SmartEats Team
    """
    
    return send_email(to_email, subject, body)


@app.task(name='tasks.generate_invoice')
def generate_invoice(order_id, order_data):
    """
    Generate PDF invoice for an order
    """
    # TODO: Implement PDF generation using reportlab or similar
    print(f"📄 Generating invoice for order {order_id}")
    return {"status": "pending", "message": "PDF generation not implemented yet"}


@app.task(name='tasks.calculate_restaurant_analytics')
def calculate_restaurant_analytics(restaurant_id, start_date, end_date):
    """
    Calculate analytics for a restaurant
    """
    # TODO: Implement analytics calculation
    print(f"📊 Calculating analytics for restaurant {restaurant_id}")
    return {
        "restaurantId": restaurant_id,
        "period": {"start": start_date, "end": end_date},
        "metrics": {
            "totalOrders": 0,
            "totalRevenue": 0,
            "averageOrderValue": 0,
            "topItems": []
        }
    }


@app.task(name='tasks.process_refund')
def process_refund(payment_id, amount, reason):
    """
    Process refund through payment gateway
    """
    # TODO: Integrate with Stripe refund API
    print(f"💰 Processing refund for payment {payment_id}: ${amount}")
    return {"status": "pending", "message": "Refund processing not implemented yet"}


@app.task(name='tasks.send_batch_notifications')
def send_batch_notifications(user_ids, notification_data):
    """
    Send notifications to multiple users
    """
    print(f"📢 Sending batch notifications to {len(user_ids)} users")
    # TODO: Implement batch notification sending
    return {"sent": len(user_ids), "failed": 0}


@app.task(name='tasks.cleanup_expired_tokens')
def cleanup_expired_tokens():
    """
    Clean up expired refresh tokens and verification tokens
    """
    # TODO: Implement token cleanup
    print("🧹 Cleaning up expired tokens")
    return {"cleaned": 0}


@app.task(name='tasks.generate_daily_report')
def generate_daily_report(date):
    """
    Generate daily platform report
    """
    # TODO: Implement report generation
    print(f"📈 Generating daily report for {date}")
    return {"status": "completed", "date": date}
