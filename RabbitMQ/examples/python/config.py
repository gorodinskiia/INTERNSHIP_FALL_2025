"""
RabbitMQ Configuration for Python Examples
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connection settings
RABBITMQ_CONFIG = {
    'host': os.getenv('RABBITMQ_HOST', 'localhost'),
    'port': int(os.getenv('RABBITMQ_PORT', 5672)),
    'username': os.getenv('RABBITMQ_USERNAME', 'guest'),
    'password': os.getenv('RABBITMQ_PASSWORD', 'guest'),
    'vhost': os.getenv('RABBITMQ_VHOST', '/'),
    'heartbeat': int(os.getenv('RABBITMQ_HEARTBEAT', 60)),
    'connection_attempts': int(os.getenv('RABBITMQ_CONNECTION_ATTEMPTS', 3)),
    'retry_delay': float(os.getenv('RABBITMQ_RETRY_DELAY', 2.0))
}

# Exchange settings
EXCHANGES = {
    'direct': {
        'name': 'python_direct_exchange',
        'type': 'direct',
        'durable': True
    },
    'topic': {
        'name': 'python_topic_exchange',
        'type': 'topic',
        'durable': True
    },
    'fanout': {
        'name': 'python_fanout_exchange',
        'type': 'fanout',
        'durable': True
    },
    'headers': {
        'name': 'python_headers_exchange',
        'type': 'headers',
        'durable': True
    }
}

# Queue settings
QUEUES = {
    'basic': {
        'name': 'python_basic_queue',
        'durable': True,
        'auto_delete': False,
        'exclusive': False
    },
    'priority': {
        'name': 'python_priority_queue',
        'durable': True,
        'auto_delete': False,
        'exclusive': False,
        'arguments': {'x-max-priority': 10}
    },
    'rpc': {
        'name': 'python_rpc_queue',
        'durable': False,
        'auto_delete': True,
        'exclusive': False
    }
}

# Message settings
MESSAGES = {
    'default_ttl': int(os.getenv('MESSAGE_TTL', 60000)),  # 1 minute
    'max_retries': int(os.getenv('MAX_RETRIES', 3)),
    'retry_delay': float(os.getenv('RETRY_DELAY', 1.0))
}

# Consumer settings
CONSUMER = {
    'prefetch_count': int(os.getenv('CONSUMER_PREFETCH', 1)),
    'auto_ack': False
}

# Publisher settings
PUBLISHER = {
    'delivery_mode': 2,  # Persistent
    'mandatory': False
}

# Logging settings
LOGGING = {
    'level': os.getenv('LOG_LEVEL', 'INFO'),
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
}

# Connection URL for convenience
RABBITMQ_URL = (
    f"amqp://{RABBITMQ_CONFIG['username']}:{RABBITMQ_CONFIG['password']}@"
    f"{RABBITMQ_CONFIG['host']}:{RABBITMQ_CONFIG['port']}{RABBITMQ_CONFIG['vhost']}"
)

# Environment Variables Template
"""
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_HEARTBEAT=60
RABBITMQ_CONNECTION_ATTEMPTS=3
RABBITMQ_RETRY_DELAY=2.0

MESSAGE_TTL=60000
MAX_RETRIES=3
RETRY_DELAY=1.0

CONSUMER_PREFETCH=1
LOG_LEVEL=INFO
"""



