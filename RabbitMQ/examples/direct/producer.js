#!/usr/bin/env node

/**
 * Direct Exchange RabbitMQ Producer
 * Demonstrates routing messages based on routing keys
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class DirectProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.exchanges.direct.name;
    this.exchangeType = config.exchanges.direct.type;
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

  async sendMessage(routingKey, message, options = {}) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const result = await this.channel.publish(
        this.exchangeName,
        routingKey,
        messageBuffer,
        {
          persistent: config.publisher.persistent,
          timestamp: Date.now(),
          messageId: options.messageId || this.generateMessageId(),
          priority: options.priority || 0,
          ...options
        }
      );

      if (result) {
        logger.info(`Message sent to direct exchange:`, {
          exchange: this.exchangeName,
          routingKey: routingKey,
          messageId: options.messageId || 'auto-generated',
          size: messageBuffer.length
        });
      } else {
        logger.warn('Message was not sent (no consumers or queue full)');
      }

      return result;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendLogMessage(level, message, source = 'app') {
    const routingKey = `log.${level}`;
    const logMessage = {
      level: level,
      message: message,
      source: source,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(routingKey, logMessage, {
      messageId: `log-${level}-${Date.now()}`
    });
  }

  async sendTaskMessage(taskType, taskData, priority = 5) {
    const routingKey = `task.${taskType}`;
    const taskMessage = {
      type: taskType,
      data: taskData,
      priority: priority,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(routingKey, taskMessage, {
      messageId: `task-${taskType}-${Date.now()}`,
      priority: priority
    });
  }

  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// Example usage
async function runExample() {
  const producer = new DirectProducer();

  try {
    await producer.connect();

    console.log('\n📨 Sending log messages...');
    // Send log messages with different levels
    await producer.sendLogMessage('info', 'Application started successfully');
    await producer.sendLogMessage('warn', 'High memory usage detected');
    await producer.sendLogMessage('error', 'Database connection failed');
    await producer.sendLogMessage('debug', 'User authentication attempt');

    console.log('\n⚙️  Sending task messages...');
    // Send task messages with different types
    await producer.sendTaskMessage('email', {
      recipient: 'user@example.com',
      subject: 'Welcome!',
      template: 'welcome-email'
    });

    await producer.sendTaskMessage('image', {
      url: 'https://example.com/image.jpg',
      format: 'jpeg',
      quality: 90
    }, 8); // High priority

    await producer.sendTaskMessage('cleanup', {
      type: 'temp_files',
      older_than: '7d'
    }, 3); // Low priority

    await producer.sendTaskMessage('backup', {
      source: '/var/data',
      destination: 's3://backup-bucket',
      encryption: true
    }, 9); // Very high priority

    console.log('\n✅ All direct exchange messages sent successfully');

  } catch (error) {
    logger.error('Direct producer example failed:', error);
    process.exit(1);
  } finally {
    await producer.close();
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting Direct Exchange RabbitMQ Producer Example...');
  console.log('📨 Exchange:', config.exchanges.direct.name);
  console.log('📨 Type: direct');
  console.log('💡 Routing keys: log.{level}, task.{type}');

  runExample()
    .then(() => {
      console.log('✅ Direct producer example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Direct producer example failed:', error);
      process.exit(1);
    });
}

module.exports = DirectProducer;



