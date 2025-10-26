#!/usr/bin/env node

/**
 * RPC Server - Handles RPC requests
 * Demonstrates request-response pattern
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class RPCServer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = config.queues.rpc.name;
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
      logger.info('Channel created successfully');

      // Declare RPC queue
      await this.channel.assertQueue(this.queueName, {
        durable: config.queues.rpc.durable
      });

      // Set prefetch for fair dispatching
      await this.channel.prefetch(1);

      logger.info(`RPC server connected to queue: ${this.queueName}`);

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async startServer() {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      logger.info(`Starting RPC server on queue: ${this.queueName}`);
      logger.info('Available procedures:');
      logger.info('  - math.calculate');
      logger.info('  - user.get');
      logger.info('  - user.create');
      logger.info('  - email.send');
      logger.info('  - payment.process');

      await this.channel.consume(this.queueName, (msg) => {
        this.handleRequest(msg);
      }, {
        noAck: false
      });

      logger.info('RPC server is now listening for requests...');
      logger.info('Start client with: node examples/rpc/client.js');

    } catch (error) {
      logger.error('Failed to start RPC server:', error);
      throw error;
    }
  }

  async handleRequest(msg) {
    if (msg !== null) {
      this.messageCount++;

      try {
        const request = JSON.parse(msg.content.toString());
        const correlationId = msg.properties.correlationId;
        const replyTo = msg.properties.replyTo;
        const messageId = msg.properties.messageId || 'unknown';

        logger.info(`📨 RPC Request #${this.messageCount}:`, {
          procedure: request.procedure,
          correlationId,
          parameters: Object.keys(request.parameters || {}),
          replyTo
        });

        // Process the request
        const response = await this.processRequest(request);

        // Send response back to client
        await this.sendResponse(replyTo, correlationId, response, messageId);

        // Acknowledge the message
        this.channel.ack(msg);

        logger.debug(`✅ RPC request processed: ${request.procedure}`);

      } catch (error) {
        logger.error('Failed to process RPC request:', error);
        this.channel.nack(msg, false, false); // Don't requeue on error
      }
    }
  }

  async processRequest(request) {
    const { procedure, parameters } = request;

    try {
      switch (procedure) {
        case 'math.calculate':
          return await this.calculate(parameters);

        case 'user.get':
          return await this.getUser(parameters);

        case 'user.create':
          return await this.createUser(parameters);

        case 'email.send':
          return await this.sendEmail(parameters);

        case 'payment.process':
          return await this.processPayment(parameters);

        default:
          throw new Error(`Unknown procedure: ${procedure}`);
      }
    } catch (error) {
      logger.error(`RPC procedure error: ${procedure}`, error);
      return {
        error: true,
        message: error.message,
        procedure: procedure
      };
    }
  }

  async calculate(parameters) {
    const { operation, numbers } = parameters;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      throw new Error('Invalid numbers array');
    }

    let result;

    switch (operation) {
      case 'add':
      case 'sum':
        result = numbers.reduce((sum, num) => sum + num, 0);
        break;
      case 'subtract':
        result = numbers.reduce((diff, num) => diff - num);
        break;
      case 'multiply':
      case 'product':
        result = numbers.reduce((prod, num) => prod * num, 1);
        break;
      case 'divide':
        result = numbers.reduce((quot, num) => quot / num);
        break;
      case 'power':
        if (numbers.length !== 2) throw new Error('Power requires exactly 2 numbers');
        result = Math.pow(numbers[0], numbers[1]);
        break;
      case 'sqrt':
        if (numbers.length !== 1) throw new Error('Square root requires exactly 1 number');
        result = Math.sqrt(numbers[0]);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return {
      operation,
      numbers,
      result,
      timestamp: new Date().toISOString()
    };
  }

  async getUser(parameters) {
    const { userId } = parameters;

    // Simulate database lookup
    const users = {
      12345: { id: 12345, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
      67890: { id: 67890, name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
      11111: { id: 11111, name: 'Carol Davis', email: 'carol@example.com', role: 'user' }
    };

    if (!users[userId]) {
      throw new Error(`User not found: ${userId}`);
    }

    return users[userId];
  }

  async createUser(parameters) {
    const { name, email, role = 'user' } = parameters;

    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    // Simulate user creation
    const userId = Math.floor(Math.random() * 100000) + 10000;

    return {
      id: userId,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
  }

  async sendEmail(parameters) {
    const { to, subject, body } = parameters;

    if (!to || !subject || !body) {
      throw new Error('To, subject, and body are required');
    }

    // Simulate email sending
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      emailId,
      to,
      subject,
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };
  }

  async processPayment(parameters) {
    const { amount, currency, cardToken } = parameters;

    if (!amount || !currency || !cardToken) {
      throw new Error('Amount, currency, and card token are required');
    }

    // Simulate payment processing
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate payment success/failure
    const success = Math.random() > 0.1; // 90% success rate

    return {
      transactionId,
      amount,
      currency,
      status: success ? 'completed' : 'failed',
      processedAt: new Date().toISOString(),
      error: success ? null : 'Insufficient funds'
    };
  }

  async sendResponse(replyTo, correlationId, response, messageId) {
    try {
      const responseBuffer = Buffer.from(JSON.stringify(response));

      await this.channel.sendToQueue(
        replyTo,
        responseBuffer,
        {
          correlationId,
          persistent: false,
          timestamp: Date.now(),
          headers: response.error ? { error: true } : {}
        }
      );

      logger.info(`📤 RPC response sent:`, {
        correlationId,
        success: !response.error,
        messageId
      });

    } catch (error) {
      logger.error('Failed to send RPC response:', error);
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
      logger.error('Error closing RPC server:', error);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down RPC server...');
  if (global.server) {
    await global.server.close();
  }
  process.exit(0);
});

// Example usage
async function runExample() {
  global.server = new RPCServer();

  try {
    await global.server.connect();
    await global.server.startServer();

    // Keep running until interrupted
    return new Promise(() => {});

  } catch (error) {
    logger.error('RPC server example failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting RPC Server Example...');
  console.log('📨 Queue:', config.queues.rpc.name);
  console.log('💡 Server will handle RPC requests');
  console.log('💡 Start client with: node examples/rpc/client.js');

  runExample()
    .then(() => {
      console.log('✅ RPC server example started successfully');
    })
    .catch((error) => {
      console.error('❌ RPC server example failed:', error);
      process.exit(1);
    });
}

module.exports = RPCServer;



