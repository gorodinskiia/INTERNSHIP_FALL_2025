#!/usr/bin/env python3
"""
Basic RabbitMQ Producer in Python
Demonstrates simple message publishing using pika
"""

import json
import time
import pika
from config import RABBITMQ_CONFIG, QUEUES
from logger import info, error, log_connection, log_message_sent, log_queue_declared


class BasicProducer:
    """Basic RabbitMQ Producer"""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.queue_name = QUEUES['basic']['name']

    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            info("Connecting to RabbitMQ...")
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

            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            log_connection(RABBITMQ_CONFIG['host'], RABBITMQ_CONFIG['port'], 'connected')

            # Declare queue
            self.channel.queue_declare(
                queue=self.queue_name,
                durable=QUEUES['basic']['durable']
            )

            log_queue_declared(self.queue_name)
            info("Connected to RabbitMQ successfully")

        except Exception as e:
            error(f"Failed to connect to RabbitMQ: {e}")
            log_connection(RABBITMQ_CONFIG['host'], RABBITMQ_CONFIG['port'], 'error')
            raise

    def send_message(self, message, message_id=None):
        """Send a single message"""
        if not self.channel:
            raise RuntimeError("Not connected. Call connect() first.")

        try:
            message_body = json.dumps(message)
            message_size = len(message_body.encode('utf-8'))

            properties = pika.BasicProperties(
                delivery_mode=2,  # Persistent
                timestamp=int(time.time()),
                message_id=message_id or f"msg-{int(time.time())}-{hash(message_body) % 1000}"
            )

            self.channel.basic_publish(
                exchange='',
                routing_key=self.queue_name,
                body=message_body,
                properties=properties
            )

            log_message_sent(self.queue_name, properties.message_id, message_size)
            info(f"Message sent: {properties.message_id}")

        except Exception as e:
            error(f"Failed to send message: {e}")
            raise

    def send_messages(self, messages, delay=1.0):
        """Send multiple messages with optional delay"""
        for i, message in enumerate(messages):
            message_id = f"batch-{i+1}-{int(time.time())}"
            self.send_message(message, message_id)

            if delay > 0 and i < len(messages) - 1:
                time.sleep(delay)

    def close(self):
        """Close connection"""
        try:
            if self.channel:
                self.channel.close()
            if self.connection and not self.connection.is_closed:
                self.connection.close()
            info("Connection closed successfully")
        except Exception as e:
            error(f"Error closing connection: {e}")


def main():
    """Main function to run the example"""
    producer = BasicProducer()

    try:
        producer.connect()

        print("\n📨 Sending sample messages...")

        # Send individual messages
        messages = [
            {
                "id": 1,
                "type": "greeting",
                "message": "Hello RabbitMQ from Python!",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            {
                "id": 2,
                "type": "task",
                "message": "Process user registration",
                "user_id": 12345,
                "priority": "high"
            },
            {
                "id": 3,
                "type": "notification",
                "message": "Send welcome email",
                "recipient": "user@example.com"
            },
            {
                "id": 4,
                "type": "data",
                "message": "Update user statistics",
                "metrics": {
                    "logins": 15,
                    "page_views": 42,
                    "purchases": 3
                }
            },
            {
                "id": 5,
                "type": "system",
                "message": "Run daily backup",
                "backup_type": "full",
                "target": "/var/data"
            }
        ]

        # Send messages with small delay
        producer.send_messages(messages, delay=0.5)

        print("
✅ All messages sent successfully!"        print(f"📊 Queue: {producer.queue_name}")
        print("💡 Run consumer: python examples/python/basic_consumer.py"
    except Exception as e:
        error(f"Producer example failed: {e}")
        return 1
    finally:
        producer.close()

    return 0


if __name__ == "__main__":
    print("🚀 Starting Basic RabbitMQ Producer (Python)")
    print(f"📨 Queue: {QUEUES['basic']['name']}")
    print("💡 Make sure RabbitMQ is running on localhost:5672"
    exit(main())



