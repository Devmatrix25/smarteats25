# SmartEats Infrastructure Services Documentation

This document details the infrastructure components used in SmartEats for background processing, caching, monitoring, and message queuing.

---

## 📦 Table of Contents

1. [Redis](#redis)
2. [RabbitMQ](#rabbitmq)
3. [Celery](#celery)
4. [Prometheus](#prometheus)
5. [Grafana](#grafana)
6. [Docker Configuration](#docker-configuration)

---

## 🔴 Redis

### What is Redis?
Redis is an in-memory data structure store used as a database, cache, and message broker.

### Purpose in SmartEats
- **Session Caching**: Store user sessions for fast authentication
- **API Rate Limiting**: Track request counts per IP/user
- **Real-time Data**: Cache frequently accessed data (restaurant info, menu items)
- **Pub/Sub**: Real-time order status updates

### Configuration
```
Host: redis (Docker) / localhost (development)
Port: 6379
Password: (optional, set in .env)
```

### Key Patterns
| Pattern | Purpose |
|---------|---------|
| `session:{userId}` | User session data |
| `rate:{ip}` | Rate limiting counter |
| `cache:restaurant:{id}` | Restaurant data cache |
| `cache:menu:{restaurantId}` | Menu items cache |
| `order:status:{orderId}` | Real-time order status |

### Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379
```

---

## 🐰 RabbitMQ

### What is RabbitMQ?
RabbitMQ is a message broker that enables asynchronous communication between microservices.

### Purpose in SmartEats
- **Order Processing Queue**: New orders are queued for processing
- **Payment Queue**: Payment verification messages
- **Notification Queue**: Email/SMS notification tasks
- **Delivery Assignment Queue**: Driver assignment messages

### Queues Configuration
| Queue Name | Purpose | Consumer |
|------------|---------|----------|
| `order_created` | New order notifications | Order Service |
| `order_confirmed` | Restaurant confirmation | Notification Service |
| `payment_process` | Process payments | Payment Service |
| `payment_complete` | Payment success events | Order Service |
| `assign_driver` | Driver assignment | Delivery Service |
| `send_notification` | Email/SMS sending | Notification Service |

### Exchange Types
- **Direct Exchange**: For specific routing (e.g., order to restaurant)
- **Fanout Exchange**: For broadcast (e.g., order status to all listeners)
- **Topic Exchange**: For pattern matching (e.g., `order.*.created`)

### Management UI
```
URL: http://localhost:15672
Default User: guest
Default Password: guest
```

### Environment Variables
```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

---

## 🥬 Celery

### What is Celery?
Celery is a distributed task queue for asynchronous job processing with Python.

### Purpose in SmartEats
- **AI Recommendations**: Generate personalized food recommendations
- **Analytics Processing**: Calculate restaurant analytics
- **Report Generation**: Create daily/weekly reports
- **Scheduled Tasks**: Periodic cleanup, reminders

### Task Categories

#### 1. AI Tasks (`celery/tasks/ai_tasks.py`)
```python
@celery_app.task
def generate_recommendations(user_id: str) -> dict:
    """Generate personalized food recommendations"""
    pass

@celery_app.task
def analyze_food_image(image_url: str) -> dict:
    """FlavorLens AI food analysis"""
    pass
```

#### 2. Analytics Tasks (`celery/tasks/analytics_tasks.py`)
```python
@celery_app.task
def calculate_restaurant_analytics(restaurant_id: str) -> dict:
    """Calculate daily restaurant metrics"""
    pass

@celery_app.task
def generate_sales_report(restaurant_id: str, date_range: dict) -> str:
    """Generate sales report PDF"""
    pass
```

#### 3. Notification Tasks (`celery/tasks/notification_tasks.py`)
```python
@celery_app.task
def send_order_confirmation(order_id: str):
    """Send order confirmation email/SMS"""
    pass

@celery_app.task
def send_delivery_update(order_id: str, status: str):
    """Send delivery status update"""
    pass
```

### Celery Beat (Scheduled Tasks)
```python
CELERY_BEAT_SCHEDULE = {
    'cleanup-expired-carts': {
        'task': 'tasks.cleanup_carts',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'calculate-daily-analytics': {
        'task': 'tasks.calculate_analytics',
        'schedule': crontab(hour=0, minute=30),  # Daily at 12:30 AM
    },
    'send-inactive-user-reminders': {
        'task': 'tasks.send_reminders',
        'schedule': crontab(hour=10, minute=0, day_of_week='mon'),  # Mondays at 10 AM
    },
}
```

### Environment Variables
```env
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## 📊 Prometheus

### What is Prometheus?
Prometheus is a monitoring and alerting toolkit that collects metrics from configured targets.

### Purpose in SmartEats
- **API Metrics**: Request counts, latencies, error rates
- **Business Metrics**: Orders per minute, revenue tracking
- **Infrastructure Metrics**: CPU, memory, disk usage

### Metrics Collected
| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `orders_created_total` | Counter | Total orders created |
| `orders_by_status` | Gauge | Current orders by status |
| `active_users` | Gauge | Currently active users |
| `delivery_time_seconds` | Histogram | Delivery times |

### Prometheus Configuration (`prometheus.yml`)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:4000']
    
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:4001']
    
  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:4003']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    
  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']
```

### Access
```
URL: http://localhost:9090
```

---

## 📈 Grafana

### What is Grafana?
Grafana is a visualization platform for metrics, logs, and traces.

### Purpose in SmartEats
- **Dashboards**: Visual overview of system health
- **Alerts**: Notify when metrics exceed thresholds
- **Analytics**: Business intelligence visualizations

### Pre-configured Dashboards

#### 1. System Health Dashboard
- API response times
- Error rates
- Server resource usage
- Database connections

#### 2. Business Metrics Dashboard
- Orders per hour
- Revenue trends
- Popular restaurants
- Peak ordering times

#### 3. Delivery Dashboard
- Active deliveries
- Average delivery times
- Driver availability
- Delivery zones heatmap

### Alert Rules
| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | >5% 5xx errors | Email + Slack |
| Slow API | p95 latency >2s | Slack |
| Queue Backlog | >100 pending tasks | Email |
| Low Disk Space | <10% free | Email |

### Access
```
URL: http://localhost:3000
Default User: admin
Default Password: admin
```

---

## 🐳 Docker Configuration

### Docker Compose Services (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  # ===================
  # INFRASTRUCTURE
  # ===================
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

  # ===================
  # CELERY WORKERS
  # ===================
  
  celery-worker:
    build:
      context: ./backend/celery-service
      dockerfile: Dockerfile
    command: celery -A celery_app worker --loglevel=info
    environment:
      - CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
      - MONGODB_URI=${MONGODB_URI}
    depends_on:
      - rabbitmq
      - redis

  celery-beat:
    build:
      context: ./backend/celery-service
      dockerfile: Dockerfile
    command: celery -A celery_app beat --loglevel=info
    environment:
      - CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - rabbitmq
      - redis

  flower:
    image: mher/flower
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672
    depends_on:
      - rabbitmq
      - celery-worker

volumes:
  redis_data:
  rabbitmq_data:
  prometheus_data:
  grafana_data:
```

---

## 🔧 Local Development

### Start All Infrastructure
```bash
docker-compose up -d redis rabbitmq prometheus grafana
```

### Check Service Health
```bash
# Redis
redis-cli ping

# RabbitMQ
curl -u guest:guest http://localhost:15672/api/overview

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3000/api/health
```

### View Logs
```bash
docker-compose logs -f redis rabbitmq prometheus grafana
```

---

## 🌐 Production Deployment (Render)

For production on Render (free tier), these services are NOT deployed since:
- Render doesn't support RabbitMQ directly
- Redis requires Render Redis add-on (paid)
- Prometheus/Grafana need persistent storage

**Alternative for Production:**
- Use managed Redis (Upstash, Redis Cloud)
- Use managed message queue (AWS SQS, CloudAMQP)
- Use managed monitoring (Datadog, New Relic)

---

## 📚 Resources

- [Redis Documentation](https://redis.io/docs/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Celery Documentation](https://docs.celeryq.dev/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
