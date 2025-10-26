#!/usr/bin/env node

/**
 * RPC Client - Makes requests to RPC server
 * Demonstrates request-response pattern
 */

const amqp = require('amqplib');
const uuid = require('uuid');
const config = require('../../config');
const logger = require('../../utils/logger');

class RPCClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = config.queues.rpc.name;
    this.responsePromises = new Map();
    this.consumerTag = null;
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
      logger.info('Channel created successfully');

      // Declare RPC queue
      await this.channel.assertQueue(this.queueName, {
        durable: config.queues.rpc.durable
      });

      // Set up response consumer
      await this.setupResponseConsumer();

      logger.info(`RPC client connected to queue: ${this.queueName}`);

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async setupResponseConsumer() {
    // Create exclusive response queue
    const responseQueue = await this.channel.assertQueue('', {
      exclusive: true,
      autoDelete: true
    });

    // Start consuming responses
    this.consumerTag = await this.channel.consume(responseQueue.queue, (msg) => {
      this.handleResponse(msg);
    }, {
      noAck: true
    });

    logger.info(`Response queue created: ${responseQueue.queue}`);
  }

  handleResponse(msg) {
    const correlationId = msg.properties.correlationId;

    if (this.responsePromises.has(correlationId)) {
      const { resolve, reject, timeout } = this.responsePromises.get(correlationId);

      clearTimeout(timeout); // Clear timeout
      this.responsePromises.delete(correlationId);

      try {
        const response = JSON.parse(msg.content.toString());

        if (msg.properties.headers && msg.properties.headers.error) {
          reject(new Error(response.message || 'RPC Error'));
        } else {
          resolve(response);
        }

      } catch (error) {
        reject(error);
      }
    }
  }

  async call(procedure, parameters = {}, options = {}) {
    const correlationId = uuid.v4();
    const replyQueue = this.channel.assertQueue('', { exclusive: true });

    return new Promise(async (resolve, reject) => {
      try {
        // Set up timeout
        const timeout = setTimeout(() => {
          this.responsePromises.delete(correlationId);
          reject(new Error(`RPC timeout: ${procedure}`));
        }, options.timeout || 30000); // 30 second timeout

        // Store promise resolver
        this.responsePromises.set(correlationId, {
          resolve,
          reject,
          timeout,
          procedure
        });

        // Send RPC request
        const request = {
          procedure,
          parameters,
          timestamp: new Date().toISOString()
        };

        await this.channel.sendToQueue(
          this.queueName,
          Buffer.from(JSON.stringify(request)),
          {
            correlationId,
            replyTo: (await replyQueue).queue,
            persistent: true,
            timestamp: Date.now(),
            messageId: `rpc-${correlationId}`
          }
        );

        logger.info(`RPC request sent:`, {
          procedure,
          correlationId,
          parameters: Object.keys(parameters)
        });

      } catch (error) {
        this.responsePromises.delete(correlationId);
        reject(error);
      }
    });
  }

  // Convenience methods for common RPC calls
  async calculate(operation, numbers) {
    return await this.call('math.calculate', { operation, numbers });
  }

  async getUser(userId) {
    return await this.call('user.get', { userId });
  }

  async createUser(userData) {
    return await this.call('user.create', userData);
  }

  async sendEmail(emailData) {
    return await this.call('email.send', emailData);
  }

  async processPayment(paymentData) {
    return await this.call('payment.process', paymentData);
  }

  async getMessageCount() {
    return this.responsePromises.size;
  }

  async close() {
    try {
      // Cancel consumer
      if (this.consumerTag) {
        await this.channel.cancel(this.consumerTag.consumerTag);
      }

      // Reject all pending requests
      for (const [correlationId, { reject }] of this.responsePromises) {
        reject(new Error('RPC client closing'));
      }
      this.responsePromises.clear();

      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      logger.error('Error closing RPC client:', error);
    }
  }
}

// Example usage
async function runExample() {
  const client = new RPCClient();

  try {
    await client.connect();

    console.log('\n🔢 Testing math calculations...');
    // Test math calculations
    const sum = await client.calculate('add', [10, 5, 3]);
    console.log(`10 + 5 + 3 = ${sum.result}`);

    const product = await client.calculate('multiply', [4, 7]);
    console.log(`4 * 7 = ${product.result}`);

    const power = await client.calculate('power', [2, 8]);
    console.log(`2^8 = ${power.result}`);

    console.log('\n👤 Testing user operations...');
    // Test user operations
    const user = await client.getUser(12345);
    console.log(`User: ${user.name} (${user.email})`);

    const newUser = await client.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    });
    console.log(`Created user: ${newUser.id}`);

    console.log('\n📧 Testing email sending...');
    // Test email sending
    const emailResult = await client.sendEmail({
      to: 'user@example.com',
      subject: 'Welcome!',
      body: 'Welcome to our service!'
    });
    console.log(`Email sent: ${emailResult.success}`);

    console.log('\n💳 Testing payment processing...');
    // Test payment processing
    const payment = await client.processPayment({
      amount: 99.99,
      currency: 'USD',
      cardToken: 'token_12345'
    });
    console.log(`Payment: ${payment.status} (${payment.transactionId})`);

    console.log('\n✅ All RPC calls completed successfully');

  } catch (error) {
    logger.error('RPC client example failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down RPC client...');
  if (global.client) {
    await global.client.close();
  }
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting RPC Client Example...');
  console.log('📨 Queue:', config.queues.rpc.name);
  console.log('💡 Make sure RPC server is running');
  console.log('💡 Server: node examples/rpc/server.js');

  runExample()
    .then(() => {
      console.log('✅ RPC client example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ RPC client example failed:', error);
      process.exit(1);
    });
}

module.exports = RPCClient;



