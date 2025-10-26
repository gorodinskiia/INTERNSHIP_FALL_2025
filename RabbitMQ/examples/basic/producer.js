#!/usr/bin/env node

/**
 * Basic RabbitMQ Producer Example
 * Demonstrates simple message publishing to a queue
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class BasicProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = config.queues.basic.name;
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

      logger.info('Connected to RabbitMQ successfully');

      this.channel = await this.connection.createChannel();
      logger.info('Channel created successfully');

      // Declare queue
      await this.channel.assertQueue(this.queueName, {
        durable: config.queues.basic.durable
      });

      logger.info(`Queue "${this.queueName}" declared successfully`);

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async sendMessage(message, options = {}) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const result = await this.channel.sendToQueue(
        this.queueName,
        messageBuffer,
        {
          persistent: config.publisher.persistent,
          timestamp: Date.now(),
          messageId: options.messageId || this.generateMessageId(),
          ...options
        }
      );

      if (result) {
        logger.info(`Message sent successfully:`, {
          queue: this.queueName,
          messageId: options.messageId || 'auto-generated',
          size: messageBuffer.length
        });
      } else {
        logger.warn('Message was not sent (queue may be full)');
      }

      return result;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendMultipleMessages(messages, delay = 1000) {
    for (let i = 0; i < messages.length; i++) {
      await this.sendMessage(messages[i], {
        messageId: `msg-${i + 1}-${Date.now()}`
      });

      if (delay > 0 && i < messages.length - 1) {
        await this.sleep(delay);
      }
    }
  }

  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        logger.info('Channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        logger.info('Connection closed');
      }
    } catch (error) {
      logger.error('Error closing connection:', error);
    }
  }
}

// Example usage
async function runExample() {
  const producer = new BasicProducer();

  try {
    await producer.connect();

    // Send single message
    await producer.sendMessage({
      id: 1,
      type: 'greeting',
      message: 'Hello RabbitMQ!',
      timestamp: new Date().toISOString()
    });

    // Send multiple messages
    const messages = [
      { id: 2, type: 'task', message: 'Process image', priority: 'high' },
      { id: 3, type: 'notification', message: 'User registered', userId: 123 },
      { id: 4, type: 'data', message: 'Sensor reading', value: 42.5 },
      { id: 5, type: 'command', message: 'Restart service', target: 'web-server' }
    ];

    await producer.sendMultipleMessages(messages, 500);

    logger.info('All messages sent successfully');

  } catch (error) {
    logger.error('Producer example failed:', error);
    process.exit(1);
  } finally {
    await producer.close();
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting Basic RabbitMQ Producer Example...');
  console.log('📨 Sending messages to queue:', config.queues.basic.name);

  runExample()
    .then(() => {
      console.log('✅ Producer example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Producer example failed:', error);
      process.exit(1);
    });
}

module.exports = BasicProducer;



