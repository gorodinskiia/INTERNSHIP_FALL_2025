# Running RabbitMQ Examples

## ✅ Current Status

RabbitMQ examples are **READY** for testing! All files have been created and configured.

## 🚀 Quick Start

### 1. Start RabbitMQ Server

```bash
# Using Docker (recommended)
docker-compose up -d rabbitmq

# Or using Docker directly
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# Or install RabbitMQ locally and start it
sudo systemctl start rabbitmq-server
```

### 2. Run Health Check

```bash
# Node.js health check
npm run healthcheck

# Or run directly
node healthcheck.js

# Python health check
python examples/python/healthcheck.py
```

### 3. Install Dependencies

```bash
# Node.js dependencies
npm install

# Python dependencies
pip install -r examples/python/requirements.txt
```

### 4. Test Basic Examples

```bash
# Terminal 1: Start consumer
node examples/basic/consumer.js

# Terminal 2: Run producer
node examples/basic/producer.js

# Python examples
python examples/python/basic_consumer.py
python examples/python/basic_producer.py
```

## 📋 Available Examples

### Node.js Examples

| Pattern | Producer | Consumer | Description |
|---------|----------|----------|-------------|
| **Basic** | `examples/basic/producer.js` | `examples/basic/consumer.js` | Simple queue |
| **Direct** | `examples/direct/producer.js` | `examples/direct/consumer.js` | Routing keys |
| **Topic** | `examples/topic/producer.js` | `examples/topic/consumer.js` | Pattern matching |
| **Fanout** | `examples/fanout/producer.js` | `examples/fanout/consumer.js` | Broadcasting |
| **RPC** | `examples/rpc/server.js` | `examples/rpc/client.js` | Request-response |

### Python Examples

| Pattern | Producer | Consumer | Description |
|---------|----------|----------|-------------|
| **Basic** | `examples/python/basic_producer.py` | `examples/python/basic_consumer.py` | Simple queue |
| **Topic** | `examples/python/topic_producer.py` | `examples/python/topic_consumer.py` | Pattern matching |

## 🧪 Testing Commands

### Interactive Mode
```bash
# Run all examples interactively
node index.js

# Run specific example
node index.js basic
node index.js direct
node index.js topic
node index.js fanout
node index.js rpc
```

### Individual Tests
```bash
# Basic queue test
node examples/basic/index.js

# Direct exchange test
node examples/direct/producer.js

# Topic exchange test
node examples/topic/producer.js

# Fanout exchange test
node examples/fanout/producer.js

# RPC test (start server first)
node examples/rpc/server.js
# Then in another terminal:
node examples/rpc/client.js
```

### Python Tests
```bash
# Basic Python test
python examples/python/basic_producer.py
python examples/python/basic_consumer.py

# Topic Python test
python examples/python/topic_producer.py
python examples/python/topic_consumer.py
```

## 🐳 Docker Examples

### Start All Services
```bash
# Start RabbitMQ and all examples
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Individual Services
```bash
# Start only RabbitMQ
docker-compose up -d rabbitmq

# Start Node.js producer
docker-compose up -d nodejs-producer

# Start Python consumer
docker-compose up -d python-consumer

# Start multiple consumers
docker-compose up -d nodejs-consumer python-consumer
```

## 📊 Monitoring

### RabbitMQ Management UI
- **URL**: http://localhost:15672
- **Username**: guest (or admin if using docker-compose)
- **Password**: guest (or password if using docker-compose)

### Check Queue Status
```bash
# Using RabbitMQ Management API
curl -u guest:guest http://localhost:15672/api/queues

# Using Node.js script
node -e "
const amqp = require('amqplib');
amqp.connect('amqp://localhost').then(async conn => {
  const ch = await conn.createChannel();
  const queue = await ch.assertQueue('basic_queue');
  console.log('Queue status:', queue);
  await conn.close();
}).catch(console.error);
"
```

### View Logs
```bash
# Node.js application logs
tail -f logs/combined.log

# Python application logs
tail -f logs/python-rabbitmq.log

# RabbitMQ server logs
docker-compose logs -f rabbitmq
```

## 🔧 Configuration

### Environment Variables
Edit configuration in `config.js` or `examples/python/config.py`:

```javascript
// Node.js config
module.exports = {
  connection: {
    host: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest'
  }
};
```

```python
# Python config
RABBITMQ_CONFIG = {
    'host': 'localhost',
    'port': 5672,
    'username': 'guest',
    'password': 'guest'
}
```

## 🎯 Example Output

### Basic Producer/Consumer
```
🚀 Starting Basic RabbitMQ Producer Example...
📨 Sending messages to queue: basic_queue
📨 Message sent: msg-1234567890-abc123
✅ All messages sent successfully

🚀 Starting Basic RabbitMQ Consumer Example...
📨 Listening to queue: basic_queue
📨 Received message: Hello RabbitMQ!
✅ Message processed successfully
```

### Topic Exchange
```
🚀 Starting Topic Exchange RabbitMQ Producer Example...
📨 Exchange: topic_exchange
📨 Message sent to routing key: analytics.user.login
📨 Message sent to routing key: notification.high.email
✅ All topic exchange messages sent successfully
```

### RPC Pattern
```
🚀 Starting RPC Server Example...
📨 Queue: rpc_queue
📨 RPC Request: math.calculate
✅ RPC request processed

🚀 Starting RPC Client Example...
🔢 Testing math calculations...
10 + 5 + 3 = 18
4 * 7 = 28
✅ All RPC calls completed successfully
```

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Check RabbitMQ logs
docker-compose logs rabbitmq

# Test connection
telnet localhost 5672

# Run health check
npm run healthcheck
```

### Message Not Received
```bash
# Check queue bindings
curl -u guest:guest http://localhost:15672/api/queues

# Verify consumer is running
ps aux | grep consumer

# Check for unacknowledged messages
curl -u guest:guest http://localhost:15672/api/queues/%2F/basic_queue
```

### Permission Issues
```bash
# Check RabbitMQ permissions
curl -u guest:guest http://localhost:15672/api/permissions

# Reset to default user
docker exec rabbitmq rabbitmqctl add_user admin password
docker exec rabbitmq rabbitmqctl set_user_tags admin administrator
```

## 📈 Performance Testing

### Load Testing
```bash
# Start multiple consumers
for i in {1..5}; do
  node examples/basic/consumer.js &
done

# Send many messages
node -e "
const BasicProducer = require('./examples/basic/producer');
async function loadTest() {
  const producer = new BasicProducer();
  await producer.connect();
  for(let i = 0; i < 1000; i++) {
    await producer.sendMessage({id: i, data: 'test'});
    if(i % 100 === 0) console.log('Sent', i, 'messages');
  }
  await producer.close();
}
loadTest();
"
```

### Stress Testing
```bash
# Multiple producers and consumers
# Terminal 1: Multiple consumers
for i in {1..3}; do node examples/basic/consumer.js & done

# Terminal 2: Multiple producers
for i in {1..5}; do node examples/basic/producer.js & done

# Terminal 3: Monitor
watch -n 1 'curl -s -u guest:guest http://localhost:15672/api/queues | jq'
```

## 🔄 Advanced Testing

### Test All Patterns
```bash
# Run comprehensive test suite
node index.js all

# Test specific patterns
node index.js basic
node index.js direct
node index.js topic
node index.js fanout
node index.js rpc
```

### Cross-Language Testing
```bash
# Node.js producer + Python consumer
node examples/basic/producer.js &
python examples/python/basic_consumer.py

# Python producer + Node.js consumer
python examples/python/basic_producer.py &
node examples/basic/consumer.js
```

## 📚 Documentation

- **`README.md`** - Main documentation and overview
- **`MESSAGING_PATTERNS.md`** - Detailed explanation of all patterns
- **`config.js`** - Node.js configuration
- **`examples/python/config.py`** - Python configuration
- **`docker-compose.yml`** - Docker setup

## 🎉 Next Steps

1. **Start RabbitMQ**: `docker-compose up -d`
2. **Run health check**: `npm run healthcheck`
3. **Test basic examples**: Run producer and consumer
4. **Explore patterns**: Try different exchange types
5. **Customize**: Modify examples for your use case
6. **Deploy**: Use Docker for production setup

The RabbitMQ examples are ready for development and testing! 🐰

