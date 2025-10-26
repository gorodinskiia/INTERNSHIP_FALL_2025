#!/usr/bin/env node

/**
 * Basic RabbitMQ Consumer Example
 * Demonstrates simple message consumption from a queue
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class BasicConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = config.queues.basic.name;
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

      logger.info('Connected to RabbitMQ successfully');

      this.channel = await this.connection.createChannel();
      logger.info('Channel created successfully');

      // Declare queue
      await this.channel.assertQueue(this.queueName, {
        durable: config.queues.basic.durable
      });

      logger.info(`Queue "${this.queueName}" declared successfully`);

      // Set prefetch for fair dispatching
      await this.channel.prefetch(config.consumer.prefetch);

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async startConsuming() {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      logger.info(`Starting to consume messages from queue: ${this.queueName}`);

      await this.channel.consume(this.queueName, (msg) => {
        this.handleMessage(msg);
      }, {
        noAck: false // Enable manual acknowledgment
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
        const messageId = msg.properties.messageId || 'unknown';
        const timestamp = msg.properties.timestamp || Date.now();

        logger.info(`📨 Received message #${this.messageCount}:`, {
          id: messageId,
          content: content,
          timestamp: new Date(timestamp).toISOString(),
          deliveryTag: msg.fields.deliveryTag
        });

        // Process the message (simulate work)
        this.processMessage(content)
          .then(() => {
            // Acknowledge message after successful processing
            this.channel.ack(msg);
            logger.debug(`✅ Message acknowledged: ${messageId}`);
          })
          .catch((error) => {
            logger.error(`❌ Message processing failed: ${messageId}`, error);

            // Reject message and requeue for retry
            if (msg.fields.redelivered) {
              logger.error(`Message redelivered twice, rejecting: ${messageId}`);
              this.channel.nack(msg, false, false); // Don't requeue
            } else {
              logger.warn(`Requeuing message for retry: ${messageId}`);
              this.channel.nack(msg, false, true); // Requeue
            }
          });

      } catch (error) {
        logger.error('Failed to parse message:', error);
        this.channel.nack(msg, false, false); // Don't requeue invalid messages
      }
    }
  }

  async processMessage(content) {
    // Simulate message processing time
    const processingTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds

    logger.debug(`Processing message: ${JSON.stringify(content)}`);
    logger.debug(`Processing time: ${processingTime}ms`);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate processing success/failure
        if (Math.random() > 0.1) { // 90% success rate
          logger.info(`✅ Message processed successfully:`, {
            type: content.type,
            id: content.id,
            processingTime: `${processingTime.toFixed(2)}ms`
          });
          resolve(content);
        } else {
          throw new Error('Simulated processing failure');
        }
      }, processingTime);
    });
  }

  getMessageCount() {
    return this.messageCount;
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
  global.consumer = new BasicConsumer();

  try {
    await global.consumer.connect();
    await global.consumer.startConsuming();

    // Keep the process alive
    return new Promise(() => {}); // Never resolves

  } catch (error) {
    logger.error('Consumer example failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting Basic RabbitMQ Consumer Example...');
  console.log('📨 Listening to queue:', config.queues.basic.name);
  console.log('💡 Send messages using: node examples/basic/producer.js');

  runExample()
    .then(() => {
      console.log('✅ Consumer example started successfully');
    })
    .catch((error) => {
      console.error('❌ Consumer example failed:', error);
      process.exit(1);
    });
}

module.exports = BasicConsumer;



