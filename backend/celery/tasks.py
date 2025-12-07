"""
SmartEats Celery Worker
Background task processing using Redis as broker
"""

import os
from celery import Celery

# Get Redis URL from environment
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Initialize Celery app
app = Celery(
    'smarteats',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Celery configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
)


@app.task(name='send_email')
def send_email(to_email, subject, body):
    """Send email task"""
    print(f"📧 Sending email to {to_email}: {subject}")
    # In production, integrate with SMTP
    return {'status': 'sent', 'to': to_email}


@app.task(name='send_sms')
def send_sms(phone, message):
    """Send SMS task"""
    print(f"📱 Sending SMS to {phone}: {message}")
    # In production, integrate with Fast2SMS
    return {'status': 'sent', 'to': phone}


@app.task(name='process_order')
def process_order(order_id, restaurant_id):
    """Process new order - notify restaurant"""
    print(f"🍽️ Processing order {order_id} for restaurant {restaurant_id}")
    return {'order_id': order_id, 'status': 'processed'}


@app.task(name='assign_driver')
def assign_driver(order_id, location):
    """Find and assign driver for delivery"""
    print(f"🚗 Assigning driver for order {order_id} at {location}")
    # In production, find nearest available driver
    return {'order_id': order_id, 'driver_assigned': True}


@app.task(name='send_notification')
def send_notification(user_id, notification_type, data):
    """Send push notification"""
    print(f"🔔 Sending {notification_type} notification to user {user_id}")
    return {'user_id': user_id, 'sent': True}


@app.task(name='cleanup_expired_orders')
def cleanup_expired_orders():
    """Periodic task to cleanup expired pending orders"""
    print("🧹 Cleaning up expired orders...")
    return {'cleaned': 0}


@app.task(name='generate_daily_report')
def generate_daily_report(restaurant_id):
    """Generate daily sales report for restaurant"""
    print(f"📊 Generating daily report for restaurant {restaurant_id}")
    return {'restaurant_id': restaurant_id, 'report_generated': True}


if __name__ == '__main__':
    app.start()
