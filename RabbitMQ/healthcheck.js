#!/usr/bin/env node

/**
 * RabbitMQ Health Check Script
 * Tests connection and basic functionality
 */

const amqp = require('amqplib');
const config = require('./config');
const logger = require('./utils/logger');

async function checkRabbitMQHealth() {
  let connection = null;
  let channel = null;

  try {
    console.log('🔍 Checking RabbitMQ health...');

    // Test connection
    connection = await amqp.connect({
      protocol: config.connection.protocol,
      hostname: config.connection.host,
      port: config.connection.port,
      username: config.connection.username,
      password: config.connection.password,
      vhost: config.connection.vhost,
      heartbeat: config.connection.heartbeat,
      connection_timeout: config.healthCheck.timeout
    });

    console.log('✅ Connection established');

    // Test channel creation
    channel = await connection.createChannel();
    console.log('✅ Channel created');

    // Test queue declaration
    const queueName = 'health_check_queue';
    const queue = await channel.assertQueue(queueName, { durable: false });
    console.log(`✅ Queue declared: ${queueName}`);

    // Test message publishing
    const testMessage = {
      health_check: true,
      timestamp: new Date().toISOString(),
      message: 'Health check message'
    };

    const result = await channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(testMessage)),
      { persistent: false }
    );

    if (result) {
      console.log('✅ Message published');
    } else {
      throw new Error('Failed to publish message');
    }

    // Test message consumption
    let messageReceived = false;

    await channel.consume(queueName, (msg) => {
      if (msg) {
        messageReceived = true;
        channel.ack(msg);
        console.log('✅ Message consumed');
      }
    }, { noAck: false });

    // Wait for message consumption
    let attempts = 0;
    while (!messageReceived && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!messageReceived) {
      throw new Error('Message not received within timeout');
    }

    // Clean up
    await channel.deleteQueue(queueName);
    console.log('✅ Queue deleted');

    console.log('\n🎉 RabbitMQ health check PASSED');
    console.log('📊 All basic operations working correctly');

    return true;

  } catch (error) {
    console.error('\n❌ RabbitMQ health check FAILED');
    console.error('🔴 Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure RabbitMQ is running on:', `${config.connection.host}:${config.connection.port}`);
    } else if (error.message.includes('authentication')) {
      console.error('💡 Check RabbitMQ credentials');
    }

    return false;
  } finally {
    try {
      if (channel) {
        await channel.close();
      }
      if (connection) {
        await connection.close();
      }
    } catch (error) {
      console.error('Error closing connection:', error.message);
    }
  }
}

async function checkManagementAPI() {
  try {
    console.log('\n🔍 Checking Management API...');

    const response = await fetch(`http://${config.connection.host}:15672/api/overview`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.connection.username}:${config.connection.password}`).toString('base64')}`
      },
      timeout: config.healthCheck.timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Management API accessible');
      console.log(`📊 RabbitMQ Version: ${data.rabbitmq_version}`);
      console.log(`📊 Erlang Version: ${data.erlang_version}`);
      return true;
    } else {
      console.log('⚠️  Management API not accessible (this is optional)');
      return true;
    }
  } catch (error) {
    console.log('⚠️  Management API not accessible (this is optional)');
    return true;
  }
}

async function runFullHealthCheck() {
  console.log('🏥 RabbitMQ Health Check Report');
  console.log('==============================');

  const rabbitmqHealthy = await checkRabbitMQHealth();
  await checkManagementAPI();

  console.log('\n📋 Summary:');
  console.log(`   RabbitMQ Connection: ${rabbitmqHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);

  if (rabbitmqHealthy) {
    console.log('\n🎯 Recommendations:');
    console.log('   ✅ Ready for message processing');
    console.log('   ✅ All basic operations working');
    console.log('   💡 You can now run producer/consumer examples');
  } else {
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if RabbitMQ is running: docker ps | grep rabbitmq');
    console.log('   2. Start RabbitMQ: docker-compose up -d rabbitmq');
    console.log('   3. Check logs: docker-compose logs rabbitmq');
    console.log('   4. Verify credentials in config.js');
  }

  return rabbitmqHealthy;
}

// Run health check if called directly
if (require.main === module) {
  runFullHealthCheck()
    .then((healthy) => {
      process.exit(healthy ? 0 : 1);
    })
    .catch((error) => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

module.exports = {
  checkRabbitMQHealth,
  checkManagementAPI,
  runFullHealthCheck
};

