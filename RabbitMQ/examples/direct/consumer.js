#!/usr/bin/env node

/**
 * Direct Exchange RabbitMQ Consumer
 * Demonstrates consuming messages based on routing keys
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class DirectConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.exchanges.direct.name;
    this.exchangeType = config.exchanges.direct.type;
    this.queueName = null;
    this.routingKeys = [];
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

      // Declare direct exchange
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: config.exchanges.direct.durable
      });

      logger.info(`Direct exchange "${this.exchangeName}" declared successfully`);

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async createQueue(queueName, routingKeys = []) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      // Declare queue
      const queue = await this.channel.assertQueue(queueName, {
        durable: true
      });

      this.queueName = queue.queue;

      // Bind queue to exchange with routing keys
      for (const routingKey of routingKeys) {
        await this.channel.bindQueue(this.queueName, this.exchangeName, routingKey);
        logger.info(`Queue "${this.queueName}" bound to routing key: ${routingKey}`);
      }

      this.routingKeys = routingKeys;
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
      logger.info(`Listening for routing keys: ${this.routingKeys.join(', ')}`);

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

        // Process message based on routing key
        this.processMessage(routingKey, content)
          .then(() => {
            this.channel.ack(msg);
            logger.debug(`✅ Message acknowledged: ${messageId}`);
          })
          .catch((error) => {
            logger.error(`❌ Message processing failed: ${messageId}`, error);

            // Reject and requeue based on routing key
            if (routingKey.startsWith('log.error') || msg.fields.redelivered) {
              this.channel.nack(msg, false, false); // Don't requeue errors
            } else {
              this.channel.nack(msg, false, true); // Requeue others
            }
          });

      } catch (error) {
        logger.error('Failed to parse message:', error);
        this.channel.nack(msg, false, false);
      }
    }
  }

  async processMessage(routingKey, content) {
    const processingTime = Math.random() * 1000 + 200;

    logger.debug(`Processing message with routing key: ${routingKey}`);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (routingKey.startsWith('log.')) {
            this.processLogMessage(routingKey, content);
          } else if (routingKey.startsWith('task.')) {
            this.processTaskMessage(routingKey, content);
          } else {
            throw new Error(`Unknown routing key: ${routingKey}`);
          }

          logger.info(`✅ Message processed: ${routingKey}`);
          resolve(content);

        } catch (error) {
          reject(error);
        }
      }, processingTime);
    });
  }

  processLogMessage(routingKey, content) {
    const level = routingKey.split('.')[1];

    switch (level) {
      case 'error':
        logger.error('🔴 LOG ERROR:', content);
        break;
      case 'warn':
        logger.warn('🟡 LOG WARNING:', content);
        break;
      case 'info':
        logger.info('🔵 LOG INFO:', content);
        break;
      case 'debug':
        logger.debug('⚪ LOG DEBUG:', content);
        break;
      default:
        logger.info('📝 LOG:', content);
    }
  }

  processTaskMessage(routingKey, content) {
    const taskType = routingKey.split('.')[1];

    logger.info(`⚙️  Processing task: ${taskType}`, {
      id: content.id,
      priority: content.priority,
      data: content.data
    });

    // Simulate task processing
    switch (taskType) {
      case 'email':
        logger.info(`📧 Sending email to ${content.data.recipient}`);
        break;
      case 'image':
        logger.info(`🖼️  Processing image: ${content.data.url}`);
        break;
      case 'cleanup':
        logger.info(`🧹 Running cleanup: ${content.data.type}`);
        break;
      case 'backup':
        logger.info(`💾 Starting backup: ${content.data.source}`);
        break;
      default:
        logger.info(`🔧 Processing task: ${taskType}`);
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

// Example consumers for different purposes
async function createLogConsumer() {
  const consumer = new DirectConsumer();
  await consumer.connect();
  await consumer.createQueue('log_queue', ['log.info', 'log.warn', 'log.error', 'log.debug']);
  return consumer;
}

async function createTaskConsumer() {
  const consumer = new DirectConsumer();
  await consumer.connect();
  await consumer.createQueue('task_queue', ['task.email', 'task.image', 'task.cleanup', 'task.backup']);
  return consumer;
}

async function createErrorConsumer() {
  const consumer = new DirectConsumer();
  await consumer.connect();
  await consumer.createQueue('error_queue', ['log.error', 'task.backup']);
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

  console.log('🚀 Starting Direct Exchange RabbitMQ Consumer Example...');
  console.log('📨 Exchange:', config.exchanges.direct.name);
  console.log('📨 Type: direct');

  if (consumerType === 'log') {
    console.log('📝 Creating log consumer (routing keys: log.*)');
    global.consumer = await createLogConsumer();
  } else if (consumerType === 'task') {
    console.log('⚙️  Creating task consumer (routing keys: task.*)');
    global.consumer = await createTaskConsumer();
  } else if (consumerType === 'error') {
    console.log('🔴 Creating error consumer (routing keys: log.error, task.backup)');
    global.consumer = await createErrorConsumer();
  } else {
    console.log('📊 Creating all-purpose consumer');
    global.consumer = new DirectConsumer();
    await global.consumer.connect();
    await global.consumer.createQueue('all_queue', ['log.#', 'task.#']); // Bind all routing keys
  }

  try {
    await global.consumer.startConsuming();

    // Keep running
    return new Promise(() => {});

  } catch (error) {
    logger.error('Direct consumer example failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runExample()
    .then(() => {
      console.log('✅ Direct consumer example started successfully');
    })
    .catch((error) => {
      console.error('❌ Direct consumer example failed:', error);
      process.exit(1);
    });
}

module.exports = DirectConsumer;



