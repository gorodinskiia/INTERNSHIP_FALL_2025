#!/usr/bin/env node

/**
 * Topic Exchange RabbitMQ Producer
 * Demonstrates pattern-based message routing
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class TopicProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.exchanges.topic.name;
    this.exchangeType = config.exchanges.topic.type;
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
          ...options
        }
      );

      if (result) {
        logger.info(`Message sent to topic exchange:`, {
          exchange: this.exchangeName,
          routingKey: routingKey,
          messageId: options.messageId || 'auto-generated',
          size: messageBuffer.length
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendEventMessage(eventType, resource, action, data = {}) {
    const routingKey = `${resource}.${action}.${eventType}`;
    const eventMessage = {
      eventType: eventType,
      resource: resource,
      action: action,
      data: data,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(routingKey, eventMessage, {
      messageId: `event-${eventType}-${Date.now()}`
    });
  }

  async sendNotificationMessage(userId, type, priority, content) {
    const routingKey = `notification.${priority}.${type}`;
    const notificationMessage = {
      userId: userId,
      type: type,
      priority: priority,
      content: content,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(routingKey, notificationMessage, {
      messageId: `notification-${userId}-${Date.now()}`,
      priority: priority === 'high' ? 8 : priority === 'medium' ? 5 : 2
    });
  }

  async sendAnalyticsMessage(category, action, label, value = null) {
    const routingKey = `analytics.${category}.${action}`;
    const analyticsMessage = {
      category: category,
      action: action,
      label: label,
      value: value,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(routingKey, analyticsMessage, {
      messageId: `analytics-${category}-${Date.now()}`
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
  const producer = new TopicProducer();

  try {
    await producer.connect();

    console.log('\n📊 Sending analytics messages...');
    // Send analytics messages
    await producer.sendAnalyticsMessage('user', 'login', 'web', 1);
    await producer.sendAnalyticsMessage('user', 'purchase', 'mobile', 99.99);
    await producer.sendAnalyticsMessage('page', 'view', 'homepage', 1500);
    await producer.sendAnalyticsMessage('error', 'javascript', 'timeout', null);

    console.log('\n🔔 Sending notification messages...');
    // Send notifications with different priorities
    await producer.sendNotificationMessage(123, 'email', 'high', {
      subject: 'Account Security Alert',
      body: 'Your account has been accessed from a new device.'
    });

    await producer.sendNotificationMessage(456, 'sms', 'medium', {
      message: 'Your order has been shipped!'
    });

    await producer.sendNotificationMessage(789, 'push', 'low', {
      title: 'New feature available',
      body: 'Check out our latest updates!'
    });

    console.log('\n📢 Sending event messages...');
    // Send event messages
    await producer.sendEventMessage('create', 'user', 'account', {
      userId: 12345,
      email: 'newuser@example.com',
      source: 'web'
    });

    await producer.sendEventMessage('update', 'product', 'price', {
      productId: 67890,
      oldPrice: 19.99,
      newPrice: 14.99,
      discount: 25
    });

    await producer.sendEventMessage('delete', 'order', 'cancel', {
      orderId: 11111,
      reason: 'customer_request',
      refundAmount: 49.99
    });

    await producer.sendEventMessage('create', 'payment', 'transaction', {
      paymentId: 22222,
      amount: 99.99,
      method: 'credit_card',
      status: 'completed'
    });

    console.log('\n✅ All topic exchange messages sent successfully');

  } catch (error) {
    logger.error('Topic producer example failed:', error);
    process.exit(1);
  } finally {
    await producer.close();
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting Topic Exchange RabbitMQ Producer Example...');
  console.log('📨 Exchange:', config.exchanges.topic.name);
  console.log('📨 Type: topic');
  console.log('💡 Routing key patterns:');
  console.log('   - analytics.category.action');
  console.log('   - notification.priority.type');
  console.log('   - resource.action.eventType');
  console.log('   - *.error.* (catch all errors)');
  console.log('   - user.*.* (all user actions)');

  runExample()
    .then(() => {
      console.log('✅ Topic producer example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Topic producer example failed:', error);
      process.exit(1);
    });
}

module.exports = TopicProducer;



