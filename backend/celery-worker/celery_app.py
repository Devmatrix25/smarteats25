from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Celery
app = Celery(
    'smarteats',
    broker=os.getenv('CELERY_BROKER_URL', 'amqp://localhost:5672'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
)

# Celery configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
)

# Auto-discover tasks
app.autodiscover_tasks(['tasks'])

if __name__ == '__main__':
    app.start()
