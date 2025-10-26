#!/usr/bin/env node

/**
 * RabbitMQ Examples Main Runner
 * Demonstrates all messaging patterns
 */

const config = require('./config');
const logger = require('./utils/logger');

class RabbitMQExamples {
  constructor() {
    this.examples = {
      basic: {
        producer: './examples/basic/producer.js',
        consumer: './examples/basic/consumer.js',
        description: 'Simple producer/consumer pattern'
      },
      direct: {
        producer: './examples/direct/producer.js',
        consumer: './examples/direct/consumer.js',
        description: 'Direct exchange with routing keys'
      },
      topic: {
        producer: './examples/topic/producer.js',
        consumer: './examples/topic/consumer.js',
        description: 'Topic exchange with pattern matching'
      },
      fanout: {
        producer: './examples/fanout/producer.js',
        consumer: './examples/fanout/consumer.js',
        description: 'Fanout exchange for broadcasting'
      },
      rpc: {
        client: './examples/rpc/client.js',
        server: './examples/rpc/server.js',
        description: 'RPC pattern for request-response'
      }
    };
  }

  showMenu() {
    console.log('\n🐰 RabbitMQ Examples Menu');
    console.log('========================');
    console.log('');

    Object.entries(this.examples).forEach(([key, example], index) => {
      console.log(`${index + 1}. ${key.toUpperCase()}: ${example.description}`);
    });

    console.log('');
    console.log('0. Run all examples');
    console.log('h. Show help');
    console.log('q. Quit');
    console.log('');
  }

  showHelp() {
    console.log('\n📚 RabbitMQ Examples Help');
    console.log('========================');
    console.log('');
    console.log('Available Examples:');
    console.log('');
    console.log('1. BASIC - Simple Producer/Consumer');
    console.log('   Demonstrates basic message publishing and consumption');
    console.log('   Usage: node examples/basic/producer.js');
    console.log('   Usage: node examples/basic/consumer.js');
    console.log('');
    console.log('2. DIRECT - Point-to-Point Messaging');
    console.log('   Uses routing keys for message delivery');
    console.log('   Routing keys: log.level, task.type');
    console.log('   Usage: node examples/direct/producer.js');
    console.log('');
    console.log('3. TOPIC - Pattern-Based Routing');
    console.log('   Uses wildcards (*, #) for flexible routing');
    console.log('   Patterns: analytics.*.*, notification.*.*, *.error.*');
    console.log('   Usage: node examples/topic/producer.js');
    console.log('');
    console.log('4. FANOUT - Broadcast Messaging');
    console.log('   Delivers messages to ALL bound queues');
    console.log('   Usage: node examples/fanout/producer.js');
    console.log('');
    console.log('5. RPC - Remote Procedure Calls');
    console.log('   Request-response pattern over message queues');
    console.log('   Usage: node examples/rpc/server.js (start server first)');
    console.log('   Usage: node examples/rpc/client.js (then run client)');
    console.log('');
    console.log('Python Examples:');
    console.log('   python examples/python/basic_producer.py');
    console.log('   python examples/python/basic_consumer.py');
    console.log('');
    console.log('Docker Examples:');
    console.log('   docker-compose up -d (start RabbitMQ)');
    console.log('   docker-compose up nodejs-producer');
    console.log('   docker-compose up python-consumer');
    console.log('');
  }

  async runBasicExample() {
    console.log('\n🎯 Running BASIC Example');
    console.log('=======================');

    try {
      // Import and run basic example
      const { runProducerExample } = require('./examples/basic');

      await runProducerExample();
      console.log('✅ Basic example completed');

    } catch (error) {
      logger.error('Basic example failed:', error);
    }
  }

  async runDirectExample() {
    console.log('\n🎯 Running DIRECT Example');
    console.log('========================');

    try {
      const DirectProducer = require('./examples/direct/producer');

      const producer = new DirectProducer();
      await producer.connect();

      // Send log messages
      console.log('📨 Sending log messages...');
      await producer.sendLogMessage('info', 'Direct exchange example started');
      await producer.sendLogMessage('warn', 'This is a warning message');
      await producer.sendLogMessage('error', 'This is an error message');

      // Send task messages
      console.log('⚙️  Sending task messages...');
      await producer.sendTaskMessage('email', { to: 'user@example.com', subject: 'Test' });
      await producer.sendTaskMessage('image', { url: 'test.jpg', format: 'jpeg' }, 8);

      await producer.close();
      console.log('✅ Direct example completed');

    } catch (error) {
      logger.error('Direct example failed:', error);
    }
  }

  async runTopicExample() {
    console.log('\n🎯 Running TOPIC Example');
    console.log('=======================');

    try {
      const TopicProducer = require('./examples/topic/producer');

      const producer = new TopicProducer();
      await producer.connect();

      // Send analytics messages
      console.log('📊 Sending analytics messages...');
      await producer.sendAnalyticsMessage('user', 'login', 'web');
      await producer.sendAnalyticsMessage('page', 'view', 'homepage', 1500);

      // Send notifications
      console.log('🔔 Sending notification messages...');
      await producer.sendNotificationMessage(123, 'email', 'high', {
        subject: 'Account Alert',
        body: 'Security notification'
      });

      // Send events
      console.log('📢 Sending event messages...');
      await producer.sendEventMessage('create', 'user', 'account', {
        userId: 12345,
        email: 'new@example.com'
      });

      await producer.close();
      console.log('✅ Topic example completed');

    } catch (error) {
      logger.error('Topic example failed:', error);
    }
  }

  async runFanoutExample() {
    console.log('\n🎯 Running FANOUT Example');
    console.log('========================');

    try {
      const FanoutProducer = require('./examples/fanout/producer');

      const producer = new FanoutProducer();
      await producer.connect();

      // Send broadcast messages
      console.log('📢 Sending broadcast messages...');
      await producer.sendBroadcastMessage('maintenance', {
        message: 'Scheduled maintenance starting',
        duration: '2 hours'
      }, 'high');

      // Send alerts
      console.log('🚨 Sending alerts...');
      await producer.sendAlertMessage('warning', 'High CPU Usage', 'Server CPU above 80%');

      // Send system messages
      console.log('⚙️  Sending system messages...');
      await producer.sendSystemMessage('restart', { service: 'web-server' });

      await producer.close();
      console.log('✅ Fanout example completed');

    } catch (error) {
      logger.error('Fanout example failed:', error);
    }
  }

  async runRPCExample() {
    console.log('\n🎯 Running RPC Example');
    console.log('=====================');

    try {
      const RPCClient = require('./examples/rpc/client');

      const client = new RPCClient();
      await client.connect();

      // Test math calculations
      console.log('🔢 Testing math calculations...');
      const sum = await client.calculate('add', [10, 5, 3]);
      console.log(`10 + 5 + 3 = ${sum.result}`);

      const product = await client.calculate('multiply', [4, 7]);
      console.log(`4 * 7 = ${product.result}`);

      // Test user operations
      console.log('👤 Testing user operations...');
      const user = await client.getUser(12345);
      console.log(`User: ${user.name} (${user.email})`);

      // Test email sending
      console.log('📧 Testing email sending...');
      const emailResult = await client.sendEmail({
        to: 'test@example.com',
        subject: 'RPC Test',
        body: 'This is a test email from RPC'
      });
      console.log(`Email sent: ${emailResult.success}`);

      await client.close();
      console.log('✅ RPC example completed');

    } catch (error) {
      logger.error('RPC example failed:', error);
    }
  }

  async runAllExamples() {
    console.log('\n🚀 Running ALL Examples');
    console.log('=======================');

    const examples = [
      { name: 'Basic', method: () => this.runBasicExample() },
      { name: 'Direct', method: () => this.runDirectExample() },
      { name: 'Topic', method: () => this.runTopicExample() },
      { name: 'Fanout', method: () => this.runFanoutExample() },
      { name: 'RPC', method: () => this.runRPCExample() }
    ];

    for (const example of examples) {
      try {
        await example.method();
        console.log(`\n⏳ Next example in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`${example.name} example failed:`, error);
        console.log(`❌ Skipping ${example.name} example due to error`);
        console.log(`⏳ Continuing in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 All examples completed!');
  }

  async run() {
    const args = process.argv.slice(2);
    const exampleName = args[0];

    console.log('🐰 RabbitMQ Examples Runner');
    console.log('==========================');
    console.log(`📊 RabbitMQ Host: ${config.connection.host}:${config.connection.port}`);
    console.log(`📊 Virtual Host: ${config.connection.vhost}`);
    console.log('');

    if (exampleName) {
      // Run specific example
      const exampleKey = exampleName.toLowerCase();

      if (exampleKey === 'all') {
        await this.runAllExamples();
      } else if (this.examples[exampleKey]) {
        await this[`run${exampleKey.charAt(0).toUpperCase() + exampleKey.slice(1)}Example`]();
      } else {
        console.log(`❌ Unknown example: ${exampleName}`);
        this.showHelp();
      }
    } else {
      // Interactive mode
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const askQuestion = (question) => {
        return new Promise((resolve) => {
          rl.question(question, resolve);
        });
      };

      try {
        while (true) {
          this.showMenu();

          const answer = await askQuestion('Select an option (1-5, 0, h, q): ');

          switch (answer.toLowerCase()) {
            case '0':
            case 'all':
              await this.runAllExamples();
              break;
            case '1':
            case 'basic':
              await this.runBasicExample();
              break;
            case '2':
            case 'direct':
              await this.runDirectExample();
              break;
            case '3':
            case 'topic':
              await this.runTopicExample();
              break;
            case '4':
            case 'fanout':
              await this.runFanoutExample();
              break;
            case '5':
            case 'rpc':
              await this.runRPCExample();
              break;
            case 'h':
            case 'help':
              this.showHelp();
              break;
            case 'q':
            case 'quit':
            case 'exit':
              console.log('👋 Goodbye!');
              rl.close();
              return;
            default:
              console.log('❌ Invalid option. Please try again.');
          }

          console.log('\n' + '='.repeat(50));
        }
      } catch (error) {
        logger.error('Interactive mode failed:', error);
      } finally {
        rl.close();
      }
    }
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  const examples = new RabbitMQExamples();

  examples.run()
    .then(() => {
      console.log('\n✅ Examples completed successfully');
    })
    .catch((error) => {
      console.error('\n❌ Examples failed:', error);
      process.exit(1);
    });
}

module.exports = RabbitMQExamples;

