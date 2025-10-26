#!/usr/bin/env node

/**
 * Basic RabbitMQ Examples Runner
 * Demonstrates simple producer/consumer pattern
 */

const BasicProducer = require('./producer');
const BasicConsumer = require('./consumer');
const logger = require('../../utils/logger');

async function runProducerExample() {
  console.log('\n🎯 Running Basic Producer Example');
  console.log('================================');

  const producer = new BasicProducer();

  try {
    await producer.connect();

    // Send sample messages
    const messages = [
      {
        id: 1,
        type: 'greeting',
        message: 'Hello RabbitMQ!',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        type: 'task',
        message: 'Process user data',
        userId: 12345,
        priority: 'high'
      },
      {
        id: 3,
        type: 'notification',
        message: 'Send email alert',
        recipient: 'admin@example.com'
      }
    ];

    for (const message of messages) {
      await producer.sendMessage(message, {
        messageId: `basic-${message.id}-${Date.now()}`
      });
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }

    logger.info('Basic producer example completed');

  } catch (error) {
    logger.error('Basic producer example failed:', error);
  } finally {
    await producer.close();
  }
}

async function runConsumerExample() {
  console.log('\n🎯 Running Basic Consumer Example');
  console.log('================================');

  const consumer = new BasicConsumer();

  try {
    await consumer.connect();
    await consumer.startConsuming();

    // Keep running until interrupted
    return new Promise(() => {});

  } catch (error) {
    logger.error('Basic consumer example failed:', error);
    process.exit(1);
  }
}

async function runBothExamples() {
  console.log('🚀 RabbitMQ Basic Examples');
  console.log('=========================');
  console.log('This will run both producer and consumer examples');
  console.log('Make sure RabbitMQ is running on localhost:5672');
  console.log('');

  // Ask user what they want to run
  const args = process.argv.slice(2);
  const exampleType = args[0] || 'both';

  if (exampleType === 'producer') {
    await runProducerExample();
  } else if (exampleType === 'consumer') {
    await runConsumerExample();
  } else {
    // Run both (producer first, then consumer)
    console.log('📨 Running producer first...');
    await runProducerExample();

    console.log('\n📬 Now starting consumer...');
    console.log('💡 The consumer will keep running. Press Ctrl+C to stop.');
    await runConsumerExample();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run examples
if (require.main === module) {
  runBothExamples()
    .then(() => {
      console.log('\n✅ Basic examples completed successfully');
    })
    .catch((error) => {
      console.error('\n❌ Basic examples failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runProducerExample,
  runConsumerExample,
  runBothExamples
};



