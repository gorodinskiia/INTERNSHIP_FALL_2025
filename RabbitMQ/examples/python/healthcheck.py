#!/usr/bin/env python3
"""
RabbitMQ Health Check Script for Python
Tests connection and basic functionality
"""

import json
import time
import pika
from config import RABBITMQ_CONFIG
from logger import info, error, warning


def check_rabbitmq_connection():
    """Test basic RabbitMQ connection"""
    print("🔍 Checking RabbitMQ connection...")

    try:
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_CONFIG['host'],
            port=RABBITMQ_CONFIG['port'],
            credentials=pika.PlainCredentials(
                RABBITMQ_CONFIG['username'],
                RABBITMQ_CONFIG['password']
            ),
            virtual_host=RABBITMQ_CONFIG['vhost'],
            heartbeat=RABBITMQ_CONFIG['heartbeat']
        )

        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        info("✅ RabbitMQ connection established", {
            'host': RABBITMQ_CONFIG['host'],
            'port': RABBITMQ_CONFIG['port']
        })

        # Test queue operations
        queue_name = 'health_check_queue'
        channel.queue_declare(queue=queue_name, durable=False)

        # Test message publishing
        test_message = {
            'health_check': True,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'message': 'Health check message'
        }

        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json.dumps(test_message)
        )

        info("✅ Message published successfully")

        # Test message consumption
        message_received = False

        def callback(ch, method, properties, body):
            nonlocal message_received
            message_received = True
            info("✅ Message consumed successfully")

        channel.basic_consume(
            queue=queue_name,
            on_message_callback=callback,
            auto_ack=True
        )

        # Wait for message
        attempts = 0
        while not message_received and attempts < 10:
            connection.process_data_events()
            time.sleep(0.1)
            attempts += 1

        if not message_received:
            raise Exception("Message not received within timeout")

        # Clean up
        channel.queue_delete(queue=queue_name)
        channel.close()
        connection.close()

        info("✅ Queue operations successful")
        return True

    except Exception as e:
        error(f"❌ RabbitMQ connection failed: {e}")
        return False


def check_management_api():
    """Test Management API accessibility"""
    print("\n🔍 Checking Management API...")

    try:
        import requests

        response = requests.get(
            f"http://{RABBITMQ_CONFIG['host']}:15672/api/overview",
            auth=(RABBITMQ_CONFIG['username'], RABBITMQ_CONFIG['password']),
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            info("✅ Management API accessible", {
                'version': data.get('rabbitmq_version'),
                'erlang_version': data.get('erlang_version')
            })
            return True
        else:
            warning(f"⚠️  Management API returned status {response.status_code}")
            return False

    except ImportError:
        warning("⚠️  requests library not available for API check")
        return True
    except Exception as e:
        warning(f"⚠️  Management API not accessible: {e}")
        return False


def run_health_check():
    """Run comprehensive health check"""
    print("🏥 RabbitMQ Health Check Report")
    print("===============================")

    connection_ok = check_rabbitmq_connection()
    api_ok = check_management_api()

    print("\n📋 Summary:")
    print(f"   Connection: {'✅ HEALTHY' if connection_ok else '❌ UNHEALTHY'}")
    print(f"   Management API: {'✅ ACCESSIBLE' if api_ok else '⚠️  NOT ACCESSIBLE'}")

    if connection_ok:
        print("\n🎯 Recommendations:")
        print("   ✅ Ready for message processing")
        print("   ✅ All basic operations working")
        print("   💡 You can now run producer/consumer examples")

        if not api_ok:
            print("   💡 Management UI not accessible (optional)")
    else:
        print("\n🔧 Troubleshooting:")
        print(f"   1. Check if RabbitMQ is running on {RABBITMQ_CONFIG['host']}:{RABBITMQ_CONFIG['port']}")
        print("   2. Start RabbitMQ: docker-compose up -d rabbitmq")
        print("   3. Check logs: docker-compose logs rabbitmq")
        print("   4. Verify credentials in config.py"

    return connection_ok


if __name__ == "__main__":
    success = run_health_check()
    exit(0 if success else 1)



