FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install celery redis

# Copy tasks
COPY tasks.py .

# Run celery worker
CMD ["celery", "-A", "tasks", "worker", "--loglevel=info"]
