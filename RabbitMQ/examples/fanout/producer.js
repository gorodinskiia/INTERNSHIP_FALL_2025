#!/usr/bin/env node

/**
 * Fanout Exchange RabbitMQ Producer
 * Demonstrates broadcast messaging to all consumers
 */

const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../../utils/logger');

class FanoutProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.exchanges.fanout.name;
    this.exchangeType = config.exchanges.fanout.type;
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

  async sendMessage(message, options = {}) {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized. Call connect() first.');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));

      // Fanout exchange ignores routing key, sends to all bound queues
      const result = await this.channel.publish(
        this.exchangeName,
        '', // Empty routing key for fanout
        messageBuffer,
        {
          persistent: config.publisher.persistent,
          timestamp: Date.now(),
          messageId: options.messageId || this.generateMessageId(),
          ...options
        }
      );

      if (result) {
        logger.info(`Message broadcast to fanout exchange:`, {
          exchange: this.exchangeName,
          messageId: options.messageId || 'auto-generated',
          size: messageBuffer.length,
          note: 'Message will be delivered to all bound queues'
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendBroadcastMessage(type, data, priority = 'normal') {
    const message = {
      type: type,
      data: data,
      priority: priority,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(message, {
      messageId: `broadcast-${type}-${Date.now()}`,
      priority: priority === 'high' ? 8 : priority === 'low' ? 2 : 5
    });
  }

  async sendAlertMessage(level, title, description, affectedSystems = []) {
    const alertMessage = {
      level: level,
      title: title,
      description: description,
      affectedSystems: affectedSystems,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(alertMessage, {
      messageId: `alert-${level}-${Date.now()}`,
      priority: level === 'critical' ? 10 : level === 'warning' ? 5 : 2
    });
  }

  async sendSystemMessage(action, details, target = 'all') {
    const systemMessage = {
      action: action,
      details: details,
      target: target,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    return await this.sendMessage(systemMessage, {
      messageId: `system-${action}-${Date.now()}`
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
  const producer = new FanoutProducer();

  try {
    await producer.connect();

    console.log('\n📢 Sending broadcast messages...');
    // Send broadcast messages
    await producer.sendBroadcastMessage('maintenance', {
      message: 'Scheduled maintenance will begin in 30 minutes',
      duration: '2 hours',
      affectedServices: ['web', 'api', 'database']
    }, 'high');

    await producer.sendBroadcastMessage('feature', {
      name: 'New Dashboard',
      description: 'Enhanced analytics dashboard now available',
      url: '/dashboard'
    }, 'normal');

    await producer.sendBroadcastMessage('update', {
      version: '2.1.0',
      changelog: ['Bug fixes', 'Performance improvements', 'New features'],
      mandatory: false
    }, 'low');

    console.log('\n🚨 Sending alert messages...');
    // Send system alerts
    await producer.sendAlertMessage('critical', 'Database Connection Failed', 'Primary database is unreachable', ['web-server', 'api-server']);

    await producer.sendAlertMessage('warning', 'High CPU Usage', 'Server CPU usage above 80%', ['monitoring']);

    await producer.sendAlertMessage('info', 'Backup Completed', 'Daily backup finished successfully', ['backup-system']);

    console.log('\n⚙️  Sending system messages...');
    // Send system messages
    await producer.sendSystemMessage('restart', {
      service: 'web-server',
      reason: 'configuration_update',
      delay: '10 seconds'
    });

    await producer.sendSystemMessage('deploy', {
      version: 'v2.1.0',
      environment: 'production',
      rollback: 'available'
    });

    await producer.sendSystemMessage('shutdown', {
      reason: 'maintenance_window',
      duration: '4 hours',
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    console.log('\n✅ All fanout exchange messages broadcast successfully');

  } catch (error) {
    logger.error('Fanout producer example failed:', error);
    process.exit(1);
  } finally {
    await producer.close();
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting Fanout Exchange RabbitMQ Producer Example...');
  console.log('📨 Exchange:', config.exchanges.fanout.name);
  console.log('📨 Type: fanout');
  console.log('💡 Broadcasting: All messages go to ALL bound queues');
  console.log('💡 Routing key: Ignored (empty string)');

  runExample()
    .then(() => {
      console.log('✅ Fanout producer example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fanout producer example failed:', error);
      process.exit(1);
    });
}

module.exports = FanoutProducer;



