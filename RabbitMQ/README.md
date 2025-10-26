# RabbitMQ Implementation Examples

This directory contains comprehensive RabbitMQ messaging examples demonstrating various messaging patterns and best practices.

## Overview

RabbitMQ is a robust message broker that implements the Advanced Message Queuing Protocol (AMQP). These examples demonstrate:

- **Direct Exchange**: Point-to-point messaging
- **Topic Exchange**: Pattern-based routing
- **Fanout Exchange**: Broadcast messaging
- **Headers Exchange**: Header-based routing
- **RPC Pattern**: Remote Procedure Calls
- **Publisher Confirms**: Reliable message delivery
- **Consumer Acknowledgments**: Message reliability

## Quick Start

### 1. Start RabbitMQ Server

```bash
# Using Docker (recommended)
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# Or using docker-compose
docker-compose up -d
```

### 2. Install Dependencies

```bash
# Node.js examples
npm install

# Python examples
pip install -r requirements.txt
```

### 3. Run Examples

```bash
# Node.js basic producer/consumer
node examples/basic/producer.js
node examples/basic/consumer.js

# Python examples
python examples/basic/producer.py
python examples/basic/consumer.py
```

## Examples Structure

### Node.js Examples (`examples/nodejs/`)
- **Basic**: Simple producer/consumer
- **Direct**: Point-to-point messaging
- **Topic**: Pattern-based routing
- **Fanout**: Broadcast messaging
- **Headers**: Header-based routing
- **RPC**: Remote procedure calls
- **Publisher Confirms**: Reliable delivery
- **Consumer Acknowledgments**: Message reliability

### Python Examples (`examples/python/`)
- **Basic**: Simple producer/consumer with pika
- **Direct**: Point-to-point messaging
- **Topic**: Pattern-based routing
- **Fanout**: Broadcast messaging
- **RPC**: Remote procedure calls

### Advanced Examples (`examples/advanced/`)
- **Load Balancing**: Multiple consumers
- **Priority Queues**: Message prioritization
- **Dead Letter Exchanges**: Failed message handling
- **Message TTL**: Time-based expiration
- **Queue TTL**: Queue expiration
- **Connection Recovery**: Automatic reconnection

## RabbitMQ Management

Access RabbitMQ Management UI:
- **URL**: http://localhost:15672
- **Username**: guest
- **Password**: guest

## Configuration

Edit connection settings in `config.js` or `config.py`:

```javascript
// config.js
module.exports = {
  host: 'localhost',
  port: 5672,
  username: 'guest',
  password: 'guest',
  vhost: '/',
  protocol: 'amqp',
  heartbeat: 60
};
```

## Testing

### 1. Basic Test
```bash
# Start consumer
node examples/basic/consumer.js

# In another terminal, run producer
node examples/basic/producer.js
```

### 2. Load Testing
```bash
# Multiple producers
for i in {1..5}; do
  node examples/basic/producer.js &
done

# Multiple consumers
for i in {1..3}; do
  node examples/basic/consumer.js &
done
```

## Production Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./rabbitmq-init.sh:/docker-entrypoint-initdb.d/init.sh
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rabbitmq
spec:
  replicas: 1
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3-management
        ports:
        - containerPort: 5672
        - containerPort: 15672
        env:
        - name: RABBITMQ_DEFAULT_USER
          value: "admin"
        - name: RABBITMQ_DEFAULT_PASS
          value: "password"
```

## Monitoring

### RabbitMQ Management API
```bash
# Get queue info
curl -u guest:guest http://localhost:15672/api/queues

# Get exchange info
curl -u guest:guest http://localhost:15672/api/exchanges

# Get connections
curl -u guest:guest http://localhost:15672/api/connections
```

### Health Checks
```bash
# Check RabbitMQ status
curl -s http://localhost:15672/api/aliveness-test/%2F | jq .

# Check queue status
node healthcheck.js
```

## Best Practices

### 1. Connection Management
- Use connection pooling
- Implement automatic reconnection
- Handle connection failures gracefully

### 2. Message Reliability
- Use publisher confirms
- Implement consumer acknowledgments
- Set appropriate message TTL

### 3. Performance
- Use prefetch for load balancing
- Implement proper error handling
- Monitor queue depths

### 4. Security
- Use SSL/TLS in production
- Implement authentication
- Set up proper user permissions

## Troubleshooting

### Common Issues

**Connection Refused**
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Check RabbitMQ logs
docker logs rabbitmq

# Test connection
telnet localhost 5672
```

**Messages Not Consumed**
```bash
# Check queue bindings
curl -u guest:guest http://localhost:15672/api/queues

# Verify consumer is running
ps aux | grep consumer

# Check for unacknowledged messages
curl -u guest:guest http://localhost:15672/api/queues/%2F/queue_name
```

**High Memory Usage**
```bash
# Check memory usage
curl -u guest:guest http://localhost:15672/api/nodes

# Monitor queue growth
curl -u guest:guest http://localhost:15672/api/queues | jq '.[] | {name: .name, messages: .messages}'
```

## Further Reading

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [AMQP 0-9-1 Specification](https://www.rabbitmq.com/amqp-0-9-1-reference.html)
- [RabbitMQ Best Practices](https://www.rabbitmq.com/admin-guide.html)
- [Node.js amqplib Documentation](https://amqp-node.github.io/amqplib/)

## License

This RabbitMQ implementation example is provided for educational purposes. Modify and use according to your project requirements.

