#!/usr/bin/env python3
"""
Basic RabbitMQ Consumer in Python
Demonstrates simple message consumption using pika
"""

import json
import time
import signal
import pika
from config import RABBITMQ_CONFIG, QUEUES, CONSUMER
from logger import info, error, warning, log_connection, log_message_received, log_message_processed, log_message_failed, log_queue_declared


class BasicConsumer:
    """Basic RabbitMQ Consumer"""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.queue_name = QUEUES['basic']['name']
        self.message_count = 0
        self.running = True

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

            # Set QoS (Quality of Service)
            self.channel.basic_qos(prefetch_count=CONSUMER['prefetch_count'])

            info("Connected to RabbitMQ successfully")

        except Exception as e:
            error(f"Failed to connect to RabbitMQ: {e}")
            log_connection(RABBITMQ_CONFIG['host'], RABBITMQ_CONFIG['port'], 'error')
            raise

    def start_consuming(self):
        """Start consuming messages"""
        if not self.channel:
            raise RuntimeError("Not connected. Call connect() first.")

        def callback(ch, method, properties, body):
            """Message callback function"""
            self.handle_message(ch, method, properties, body)

        info(f"Starting to consume messages from queue: {self.queue_name}")
        info(f"Prefetch count: {CONSUMER['prefetch_count']}")
        info("Press Ctrl+C to exit"
        # Start consuming
        self.channel.basic_consume(
            queue=self.queue_name,
            on_message_callback=callback,
            auto_ack=False  # Manual acknowledgment
        )

        # Start consuming loop
        self.channel.start_consuming()

    def handle_message(self, channel, method, properties, body):
        """Handle incoming message"""
        self.message_count += 1
        message_id = properties.message_id or f"unknown-{self.message_count}"

        try:
            # Parse message
            message_data = json.loads(body.decode('utf-8'))
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

            log_message_received(self.queue_name, message_id)

            info(f"📨 Message #{self.message_count} received", {
                'message_id': message_id,
                'type': message_data.get('type'),
                'timestamp': timestamp,
                'delivery_tag': method.delivery_tag
            })

            # Process message
            start_time = time.time()
            self.process_message(message_data)
            processing_time = time.time() - start_time

            # Acknowledge message
            channel.basic_ack(delivery_tag=method.delivery_tag)

            log_message_processed(message_id, processing_time)
            info(f"✅ Message processed successfully", {
                'message_id': message_id,
                'processing_time': f"{processing_time".2f"}s"
            })

        except json.JSONDecodeError as e:
            error(f"Failed to parse JSON message: {e}", {'message_id': message_id})
            # Reject message without requeue (invalid JSON)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        except Exception as e:
            error(f"Failed to process message: {e}", {'message_id': message_id})
            log_message_failed(message_id, e)

            # Reject and requeue for retry (unless it's been redelivered too many times)
            if method.redelivered:
                warning("Message redelivered, rejecting without requeue", {'message_id': message_id})
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            else:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def process_message(self, message_data):
        """Process the message (simulate work)"""
        message_type = message_data.get('type', 'unknown')

        # Simulate processing time based on message type
        processing_time = {
            'greeting': 0.5,
            'task': 1.0,
            'notification': 0.3,
            'data': 1.5,
            'system': 2.0
        }.get(message_type, 1.0)

        info(f"🔄 Processing {message_type} message", {
            'id': message_data.get('id'),
            'message': message_data.get('message')
        })

        # Simulate actual processing time
        time.sleep(processing_time)

        # Simulate processing success/failure
        if message_type == 'system' and 'backup' in message_data.get('message', '').lower():
            # Simulate occasional backup failure
            if self.message_count % 5 == 0:  # Every 5th backup fails
                raise Exception("Simulated backup failure")

        info(f"✅ {message_type.capitalize()} processed", {
            'id': message_data.get('id'),
            'result': 'success'
        })

    def get_stats(self):
        """Get consumer statistics"""
        return {
            'messages_processed': self.message_count,
            'queue': self.queue_name,
            'uptime': 'running'
        }

    def stop(self):
        """Stop consuming"""
        self.running = False
        if self.channel:
            self.channel.stop_consuming()

    def close(self):
        """Close connection"""
        try:
            if self.channel:
                self.channel.stop_consuming()
            if self.connection and not self.connection.is_closed:
                self.connection.close()
            info("Connection closed successfully")
        except Exception as e:
            error(f"Error closing connection: {e}")


def signal_handler(signum, frame):
    """Handle shutdown signals"""
    info(f"Received signal {signum}, shutting down gracefully...")
    if 'consumer' in globals():
        consumer.stop()
        consumer.close()
    exit(0)


def main():
    """Main function to run the example"""
    global consumer

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    consumer = BasicConsumer()

    try:
        consumer.connect()
        consumer.start_consuming()

    except KeyboardInterrupt:
        info("Consumer interrupted by user")
    except Exception as e:
        error(f"Consumer failed: {e}")
        return 1
    finally:
        consumer.close()

    return 0


if __name__ == "__main__":
    print("🚀 Starting Basic RabbitMQ Consumer (Python)")
    print(f"📨 Queue: {QUEUES['basic']['name']}")
    print("💡 Send messages using: python examples/python/basic_producer.py"
    print("💡 Press Ctrl+C to exit"
    exit(main())



