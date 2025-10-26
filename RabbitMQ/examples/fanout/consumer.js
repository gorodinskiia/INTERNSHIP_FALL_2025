#!/usr/bin/env node

/**
 * Fanout Exchange RabbitMQ Consumer
 * Demonstrates broadcast message consumption
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class FanoutConsumer {
  constructor(consumerName = 'default') {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.exchanges.fanout.name;
    this.exchangeType = config.exchanges.fanout.type;
    this.queueName = null;
    this.consumerName = consumerName;
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

      // Declare fanout exchange
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: config.exchanges.fanout.durable
      });

      logger.info(`Fanout exchange "${this.exchangeName}" declared successfully`);

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async createQueue(queueName = null) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      // Create unique queue name if not provided
      const finalQueueName = queueName || `fanout_queue_${this.consumerName}_${Date.now()}`;

      // Declare exclusive queue
      const queue = await this.channel.assertQueue(finalQueueName, {
        exclusive: true // Queue only exists for this connection
      });

      this.queueName = queue.queue;

      // Bind queue to fanout exchange (no routing key needed)
      await this.channel.bindQueue(this.queueName, this.exchangeName, '');
      logger.info(`Queue "${this.queueName}" bound to fanout exchange "${this.exchangeName}"`);

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

      logger.info(`[${this.consumerName}] Starting to consume broadcast messages`);
      logger.info(`[${this.consumerName}] Queue: ${this.queueName}`);
      logger.info(`[${this.consumerName}] Exchange: ${this.exchangeName}`);

      await this.channel.consume(this.queueName, (msg) => {
        this.handleMessage(msg);
      }, {
        noAck: false
      });

      logger.info(`[${this.consumerName}] Consumer is now listening for broadcast messages...`);
      logger.info(`[${this.consumerName}] Press Ctrl+C to exit`);

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
        const messageId = msg.properties.messageId || 'unknown';
        const timestamp = msg.properties.timestamp || Date.now();

        logger.info(`📢 [${this.consumerName}] Broadcast #${this.messageCount}:`, {
          messageId: messageId,
          type: content.type,
          timestamp: new Date(timestamp).toISOString(),
          deliveryTag: msg.fields.deliveryTag
        });

        // Process message based on type
        this.processMessage(content)
          .then(() => {
            this.channel.ack(msg);
            logger.debug(`✅ [${this.consumerName}] Message acknowledged: ${messageId}`);
          })
          .catch((error) => {
            logger.error(`❌ [${this.consumerName}] Message processing failed: ${messageId}`, error);
            this.channel.nack(msg, false, true); // Requeue
          });

      } catch (error) {
        logger.error(`[${this.consumerName}] Failed to parse message:`, error);
        this.channel.nack(msg, false, false);
      }
    }
  }

  async processMessage(content) {
    const processingTime = Math.random() * 2000 + 1000;

    logger.debug(`[${this.consumerName}] Processing message type: ${content.type}`);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          switch (content.type) {
            case 'maintenance':
              this.processMaintenanceMessage(content);
              break;
            case 'feature':
              this.processFeatureMessage(content);
              break;
            case 'update':
              this.processUpdateMessage(content);
              break;
            case 'critical':
            case 'warning':
            case 'info':
              this.processAlertMessage(content);
              break;
            case 'restart':
            case 'deploy':
            case 'shutdown':
              this.processSystemMessage(content);
              break;
            default:
              logger.info(`[${this.consumerName}] Unknown message type: ${content.type}`);
          }

          logger.info(`✅ [${this.consumerName}] Message processed: ${content.type}`);
          resolve(content);

        } catch (error) {
          reject(error);
        }
      }, processingTime);
    });
  }

  processMaintenanceMessage(content) {
    logger.info(`🔧 [${this.consumerName}] Maintenance Alert:`, {
      message: content.data.message,
      duration: content.data.duration,
      services: content.data.affectedServices
    });

    // Simulate maintenance preparation
    logger.info(`🛠️  [${this.consumerName}] Preparing for maintenance...`);
  }

  processFeatureMessage(content) {
    logger.info(`✨ [${this.consumerName}] New Feature:`, {
      name: content.data.name,
      description: content.data.description,
      url: content.data.url
    });

    // Simulate feature announcement
    logger.info(`📢 [${this.consumerName}] Broadcasting feature announcement...`);
  }

  processUpdateMessage(content) {
    logger.info(`📦 [${this.consumerName}] Update Available:`, {
      version: content.data.version,
      changes: content.data.changelog,
      mandatory: content.data.mandatory
    });

    // Simulate update check
    logger.info(`🔄 [${this.consumerName}] Checking for updates...`);
  }

  processAlertMessage(content) {
    const level = content.level;
    const emoji = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';

    logger.info(`${emoji} [${this.consumerName}] System Alert (${level.toUpperCase()}):`, {
      title: content.title,
      description: content.description,
      systems: content.affectedSystems
    });

    // Simulate alert processing
    if (level === 'critical') {
      logger.error(`🚨 [${this.consumerName}] CRITICAL ALERT - Taking immediate action!`);
    }
  }

  processSystemMessage(content) {
    logger.info(`⚙️  [${this.consumerName}] System Command:`, {
      action: content.action,
      details: content.details,
      target: content.target
    });

    // Simulate system command execution
    switch (content.action) {
      case 'restart':
        logger.info(`🔄 [${this.consumerName}] Restarting ${content.details.service}...`);
        break;
      case 'deploy':
        logger.info(`🚀 [${this.consumerName}] Deploying ${content.details.version}...`);
        break;
      case 'shutdown':
        logger.warn(`🔌 [${this.consumerName}] Scheduling shutdown...`);
        break;
    }
  }

  getMessageCount() {
    return this.messageCount;
  }

  getConsumerInfo() {
    return {
      name: this.consumerName,
      queue: this.queueName,
      messagesProcessed: this.messageCount
    };
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

// Create multiple consumers for demonstration
async function createConsumer(name) {
  const consumer = new FanoutConsumer(name);
  await consumer.connect();
  await consumer.createQueue();
  return consumer;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (global.consumers) {
    for (const consumer of global.consumers) {
      await consumer.close();
    }
  }
  process.exit(0);
});

// Example usage
async function runExample() {
  const args = process.argv.slice(2);
  const consumerCount = parseInt(args[0]) || 1;

  console.log('🚀 Starting Fanout Exchange RabbitMQ Consumer Example...');
  console.log('📨 Exchange:', config.exchanges.fanout.name);
  console.log('📨 Type: fanout');
  console.log('💡 Broadcasting: Messages go to ALL consumers');
  console.log(`📊 Starting ${consumerCount} consumer(s)...`);

  // Create multiple consumers
  global.consumers = [];
  const consumerNames = ['web-server', 'api-server', 'worker-1', 'worker-2', 'monitor'];

  for (let i = 0; i < consumerCount; i++) {
    const consumerName = consumerNames[i] || `consumer-${i + 1}`;
    const consumer = await createConsumer(consumerName);
    global.consumers.push(consumer);

    // Start consuming (with small delay to avoid race conditions)
    setTimeout(() => {
      consumer.startConsuming();
    }, i * 100);
  }

  logger.info(`Started ${consumerCount} consumers listening for broadcasts`);

  // Keep running
  return new Promise(() => {});
}

// Run if called directly
if (require.main === module) {
  runExample()
    .then(() => {
      console.log('✅ Fanout consumer example started successfully');
    })
    .catch((error) => {
      console.error('❌ Fanout consumer example failed:', error);
      process.exit(1);
    });
}

module.exports = FanoutConsumer;



