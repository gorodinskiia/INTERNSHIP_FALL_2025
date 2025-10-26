#!/usr/bin/env python3
"""
Topic Exchange RabbitMQ Producer in Python
Demonstrates pattern-based message routing
"""

import json
import time
import pika
from config import RABBITMQ_CONFIG, EXCHANGES
from logger import info, error, log_connection, log_message_sent, log_exchange_declared


class TopicProducer:
    """Topic Exchange RabbitMQ Producer"""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange_name = EXCHANGES['topic']['name']
        self.exchange_type = EXCHANGES['topic']['type']

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

            # Declare topic exchange
            self.channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type=self.exchange_type,
                durable=EXCHANGES['topic']['durable']
            )

            log_exchange_declared(self.exchange_name, self.exchange_type)
            info("Connected to RabbitMQ successfully")

        except Exception as e:
            error(f"Failed to connect to RabbitMQ: {e}")
            log_connection(RABBITMQ_CONFIG['host'], RABBITMQ_CONFIG['port'], 'error')
            raise

    def send_message(self, routing_key, message, message_id=None):
        """Send a message with routing key"""
        if not self.channel:
            raise RuntimeError("Not connected. Call connect() first.")

        try:
            message_body = json.dumps(message)
            message_size = len(message_body.encode('utf-8'))

            properties = pika.BasicProperties(
                delivery_mode=2,  # Persistent
                timestamp=int(time.time()),
                message_id=message_id or f"topic-{int(time.time())}-{hash(message_body) % 1000}"
            )

            self.channel.basic_publish(
                exchange=self.exchange_name,
                routing_key=routing_key,
                body=message_body,
                properties=properties
            )

            log_message_sent(routing_key, properties.message_id, message_size)
            info(f"Message sent to topic exchange", {
                'routing_key': routing_key,
                'message_id': properties.message_id
            })

        except Exception as e:
            error(f"Failed to send message: {e}")
            raise

    def send_analytics_message(self, category, action, label, value=None):
        """Send analytics message"""
        routing_key = f"analytics.{category}.{action}"
        message = {
            'category': category,
            'action': action,
            'label': label,
            'value': value,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'id': f"analytics-{int(time.time())}"
        }

        return self.send_message(routing_key, message, f"analytics-{category}-{action}")

    def send_notification_message(self, user_id, type, priority, content):
        """Send notification message"""
        routing_key = f"notification.{priority}.{type}"
        message = {
            'user_id': user_id,
            'type': type,
            'priority': priority,
            'content': content,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'id': f"notification-{user_id}-{int(time.time())}"
        }

        return self.send_message(routing_key, message, f"notification-{type}-{priority}")

    def send_event_message(self, resource, action, event_type, data=None):
        """Send event message"""
        routing_key = f"{resource}.{action}.{event_type}"
        message = {
            'resource': resource,
            'action': action,
            'event_type': event_type,
            'data': data or {},
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'id': f"event-{resource}-{int(time.time())}"
        }

        return self.send_message(routing_key, message, f"event-{resource}-{action}")

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
    producer = TopicProducer()

    try:
        producer.connect()

        print("\n📊 Sending analytics messages...")
        # Send analytics messages
        producer.send_analytics_message('user', 'login', 'web', 1)
        producer.send_analytics_message('user', 'purchase', 'mobile', 99.99)
        producer.send_analytics_message('page', 'view', 'homepage', 1500)
        producer.send_analytics_message('error', 'javascript', 'timeout', None)

        print("\n🔔 Sending notification messages...")
        # Send notifications
        producer.send_notification_message(123, 'email', 'high', {
            'subject': 'Account Security Alert',
            'body': 'Your account has been accessed from a new device.'
        })

        producer.send_notification_message(456, 'sms', 'medium', {
            'message': 'Your order has been shipped!'
        })

        producer.send_notification_message(789, 'push', 'low', {
            'title': 'New feature available',
            'body': 'Check out our latest updates!'
        })

        print("\n📢 Sending event messages...")
        # Send event messages
        producer.send_event_message('user', 'create', 'account', {
            'user_id': 12345,
            'email': 'newuser@example.com',
            'source': 'web'
        })

        producer.send_event_message('product', 'update', 'price', {
            'product_id': 67890,
            'old_price': 19.99,
            'new_price': 14.99,
            'discount': 25
        })

        producer.send_event_message('order', 'delete', 'cancel', {
            'order_id': 11111,
            'reason': 'customer_request',
            'refund_amount': 49.99
        })

        print("\n✅ All topic exchange messages sent successfully!")
        print(f"📊 Exchange: {producer.exchange_name}")
        print("💡 Routing key patterns:"
        print("   - analytics.category.action")
        print("   - notification.priority.type")
        print("   - resource.action.eventType")
        print("   - *.error.* (catch all errors)")
        print("   - user.*.* (all user actions)")

    except Exception as e:
        error(f"Topic producer example failed: {e}")
        return 1
    finally:
        producer.close()

    return 0


if __name__ == "__main__":
    print("🚀 Starting Topic Exchange RabbitMQ Producer (Python)")
    print(f"📨 Exchange: {EXCHANGES['topic']['name']}")
    print("📨 Type: topic"
    print("💡 Run consumer: python examples/python/topic_consumer.py"
    exit(main())



