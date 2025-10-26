// RabbitMQ Configuration
module.exports = {
  // Connection settings
  connection: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT) || 5672,
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
    protocol: process.env.RABBITMQ_PROTOCOL || 'amqp',
    heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT) || 60,
    connection_timeout: parseInt(process.env.RABBITMQ_CONNECTION_TIMEOUT) || 60000
  },

  // Exchange settings
  exchanges: {
    direct: {
      name: 'direct_exchange',
      type: 'direct',
      durable: true,
      autoDelete: false
    },
    topic: {
      name: 'topic_exchange',
      type: 'topic',
      durable: true,
      autoDelete: false
    },
    fanout: {
      name: 'fanout_exchange',
      type: 'fanout',
      durable: true,
      autoDelete: false
    },
    headers: {
      name: 'headers_exchange',
      type: 'headers',
      durable: true,
      autoDelete: false
    }
  },

  // Queue settings
  queues: {
    basic: {
      name: 'basic_queue',
      durable: true,
      exclusive: false,
      autoDelete: false
    },
    priority: {
      name: 'priority_queue',
      durable: true,
      exclusive: false,
      autoDelete: false,
      maxPriority: 10
    },
    rpc: {
      name: 'rpc_queue',
      durable: false,
      exclusive: false,
      autoDelete: true
    }
  },

  // Message settings
  messages: {
    defaultTtl: parseInt(process.env.MESSAGE_TTL) || 60000, // 1 minute
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000 // 1 second
  },

  // Consumer settings
  consumer: {
    prefetch: parseInt(process.env.CONSUMER_PREFETCH) || 1,
    noAck: false,
    requeue: true
  },

  // Publisher settings
  publisher: {
    persistent: true,
    mandatory: false,
    immediate: false
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/rabbitmq.log'
  },

  // Health check settings
  healthCheck: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000 // 5 seconds
  }
};

// Environment Variables Template
/*
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_PROTOCOL=amqp
RABBITMQ_HEARTBEAT=60
RABBITMQ_CONNECTION_TIMEOUT=60000

MESSAGE_TTL=60000
MAX_RETRIES=3
RETRY_DELAY=1000

CONSUMER_PREFETCH=1
LOG_LEVEL=info
LOG_FILE=logs/rabbitmq.log

HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
*/

