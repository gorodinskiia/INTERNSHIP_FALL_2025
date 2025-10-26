#!/usr/bin/env node

/**
 * Topic Exchange RabbitMQ Consumer
 * Demonstrates pattern-based message consumption
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class TopicConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.exchanges.topic.name;
    this.exchangeType = config.exchanges.topic.type;
    this.queueName = null;
    this.bindingKeys = [];
    this.messageCount = 0;
  }

  async connect() {
    try {
      logger.info('Connecting to RabbitMQ...');
      this.connection = await amqp.connect({
        protocol: config.connection.protocol,
        hostname: config.connection.host,
        port: config.connection.port,
        username: config.connection.username,
        password: config.connection.password,
        vhost: config.connection.vhost,
        heartbeat: config.connection.heartbeat
      });

      this.channel = await this.connection.createChannel();

      // Declare topic exchange
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: config.exchanges.topic.durable
      });

      logger.info(`Topic exchange "${this.exchangeName}" declared successfully`);

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async createQueue(queueName, bindingKeys = []) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      // Declare queue
      const queue = await this.channel.assertQueue(queueName, {
        durable: true
      });

      this.queueName = queue.queue;

      // Bind queue to exchange with binding keys (patterns)
      for (const bindingKey of bindingKeys) {
        await this.channel.bindQueue(this.queueName, this.exchangeName, bindingKey);
        logger.info(`Queue "${this.queueName}" bound to pattern: ${bindingKey}`);
      }

      this.bindingKeys = bindingKeys;
      logger.info(`Queue "${this.queueName}" created and bound successfully`);

    } catch (error) {
      logger.error('Failed to create queue:', error);
      throw error;
    }
  }

  async startConsuming() {
    try {
      if (!this.channel || !this.queueName) {
        throw new Error('Queue not initialized. Call createQueue() first.');
      }

      logger.info(`Starting to consume messages from queue: ${this.queueName}`);
      logger.info(`Listening for patterns: ${this.bindingKeys.join(', ')}`);

      await this.channel.consume(this.queueName, (msg) => {
        this.handleMessage(msg);
      }, {
        noAck: false
      });

      logger.info('Consumer is now listening for messages...');
      logger.info('Press Ctrl+C to exit');

    } catch (error) {
      logger.error('Failed to start consuming:', error);
      throw error;
    }
  }

  handleMessage(msg) {
    if (msg !== null) {
      this.messageCount++;

      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        const messageId = msg.properties.messageId || 'unknown';
        const timestamp = msg.properties.timestamp || Date.now();

        logger.info(`📨 Received message #${this.messageCount}:`, {
          routingKey: routingKey,
          messageId: messageId,
          content: content,
          timestamp: new Date(timestamp).toISOString(),
          deliveryTag: msg.fields.deliveryTag
        });

        // Process message based on routing key pattern
        this.processMessage(routingKey, content)
          .then(() => {
            this.channel.ack(msg);
            logger.debug(`✅ Message acknowledged: ${messageId}`);
          })
          .catch((error) => {
            logger.error(`❌ Message processing failed: ${messageId}`, error);
            this.channel.nack(msg, false, true); // Requeue
          });

      } catch (error) {
        logger.error('Failed to parse message:', error);
        this.channel.nack(msg, false, false);
      }
    }
  }

  async processMessage(routingKey, content) {
    const processingTime = Math.random() * 1500 + 500;

    logger.debug(`Processing message with routing key: ${routingKey}`);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const keyParts = routingKey.split('.');

          if (routingKey.startsWith('analytics.')) {
            this.processAnalyticsMessage(keyParts, content);
          } else if (routingKey.startsWith('notification.')) {
            this.processNotificationMessage(keyParts, content);
          } else if (routingKey.startsWith('user.') || routingKey.startsWith('product.') || routingKey.startsWith('order.') || routingKey.startsWith('payment.')) {
            this.processEventMessage(keyParts, content);
          } else {
            throw new Error(`Unknown routing key pattern: ${routingKey}`);
          }

          logger.info(`✅ Message processed: ${routingKey}`);
          resolve(content);

        } catch (error) {
          reject(error);
        }
      }, processingTime);
    });
  }

  processAnalyticsMessage(keyParts, content) {
    const [_, category, action] = keyParts;

    logger.info(`📊 Analytics: ${category}.${action}`, {
      label: content.label,
      value: content.value,
      timestamp: content.timestamp
    });

    // Simulate analytics processing
    switch (action) {
      case 'login':
        logger.info(`👤 User login recorded from ${content.label}`);
        break;
      case 'purchase':
        logger.info(`💰 Purchase recorded: $${content.value} via ${content.label}`);
        break;
      case 'view':
        logger.info(`👁️  Page view: ${content.label} (${content.value} views)`);
        break;
      case 'error':
        logger.error(`🚨 Error reported: ${content.label}`);
        break;
    }
  }

  processNotificationMessage(keyParts, content) {
    const [_, priority, type] = keyParts;

    logger.info(`🔔 Notification: ${priority} priority ${type}`, {
      userId: content.userId,
      content: content.content
    });

    // Simulate notification processing
    switch (type) {
      case 'email':
        logger.info(`📧 Sending email notification to user ${content.userId}`);
        break;
      case 'sms':
        logger.info(`📱 Sending SMS notification to user ${content.userId}`);
        break;
      case 'push':
        logger.info(`📲 Sending push notification to user ${content.userId}`);
        break;
    }
  }

  processEventMessage(keyParts, content) {
    const [resource, action, eventType] = keyParts;

    logger.info(`📢 Event: ${resource}.${action}.${eventType}`, {
      data: content.data,
      timestamp: content.timestamp
    });

    // Simulate event processing
    switch (resource) {
      case 'user':
        logger.info(`👤 User event: ${action} ${eventType}`);
        break;
      case 'product':
        logger.info(`📦 Product event: ${action} ${eventType}`);
        break;
      case 'order':
        logger.info(`📋 Order event: ${action} ${eventType}`);
        break;
      case 'payment':
        logger.info(`💳 Payment event: ${action} ${eventType}`);
        break;
    }
  }

  getMessageCount() {
    return this.messageCount;
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      logger.error('Error closing connection:', error);
    }
  }
}

// Example consumers for different patterns
async function createAnalyticsConsumer() {
  const consumer = new TopicConsumer();
  await consumer.connect();
  await consumer.createQueue('analytics_queue', ['analytics.*.*']);
  return consumer;
}

async function createNotificationConsumer() {
  const consumer = new TopicConsumer();
  await consumer.connect();
  await consumer.createQueue('notification_queue', ['notification.*.*']);
  return consumer;
}

async function createEventConsumer() {
  const consumer = new TopicConsumer();
  await consumer.connect();
  await consumer.createQueue('event_queue', ['*.create.*', '*.update.*', '*.delete.*']);
  return consumer;
}

async function createErrorConsumer() {
  const consumer = new TopicConsumer();
  await consumer.connect();
  await consumer.createQueue('error_queue', ['*.error.*']);
  return consumer;
}

async function createAllConsumer() {
  const consumer = new TopicConsumer();
  await consumer.connect();
  await consumer.createQueue('all_queue', ['#']); // Catch all patterns
  return consumer;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (global.consumer) {
    await global.consumer.close();
  }
  process.exit(0);
});

// Example usage
async function runExample() {
  const args = process.argv.slice(2);
  const consumerType = args[0] || 'all';

  console.log('🚀 Starting Topic Exchange RabbitMQ Consumer Example...');
  console.log('📨 Exchange:', config.exchanges.topic.name);
  console.log('📨 Type: topic');
  console.log('💡 Binding key patterns:');
  console.log('   - analytics.*.* (all analytics)');
  console.log('   - notification.*.* (all notifications)');
  console.log('   - *.create.* (all create events)');
  console.log('   - *.error.* (all errors)');
  console.log('   - # (catch all)');

  if (consumerType === 'analytics') {
    console.log('📊 Creating analytics consumer');
    global.consumer = await createAnalyticsConsumer();
  } else if (consumerType === 'notifications') {
    console.log('🔔 Creating notification consumer');
    global.consumer = await createNotificationConsumer();
  } else if (consumerType === 'events') {
    console.log('📢 Creating event consumer');
    global.consumer = await createEventConsumer();
  } else if (consumerType === 'errors') {
    console.log('🔴 Creating error consumer');
    global.consumer = await createErrorConsumer();
  } else {
    console.log('📊 Creating catch-all consumer');
    global.consumer = await createAllConsumer();
  }

  try {
    await global.consumer.startConsuming();

    // Keep running
    return new Promise(() => {});

  } catch (error) {
    logger.error('Topic consumer example failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runExample()
    .then(() => {
      console.log('✅ Topic consumer example started successfully');
    })
    .catch((error) => {
      console.error('❌ Topic consumer example failed:', error);
      process.exit(1);
    });
}

module.exports = TopicConsumer;



