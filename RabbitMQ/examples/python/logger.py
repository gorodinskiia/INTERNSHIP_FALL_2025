"""
Logger utility for Python RabbitMQ examples
"""

import logging
import logging.handlers
from config import LOGGING

def setup_logger(name='rabbitmq-python', level=None):
    """Setup logger with consistent configuration"""

    logger = logging.getLogger(name)
    logger.setLevel(level or LOGGING['level'])

    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Create formatter
    formatter = logging.Formatter(LOGGING['format'])

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    try:
        file_handler = logging.handlers.RotatingFileHandler(
            'logs/python-rabbitmq.log',
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except (OSError, IOError):
        # File logging failed, continue with console only
        pass

    return logger

# Create default logger
logger = setup_logger()

# Convenience functions
def info(message, extra=None):
    """Log info message"""
    if extra:
        logger.info(message, extra=extra)
    else:
        logger.info(message)

def warning(message, extra=None):
    """Log warning message"""
    if extra:
        logger.warning(message, extra=extra)
    else:
        logger.warning(message)

def error(message, extra=None):
    """Log error message"""
    if extra:
        logger.error(message, extra=extra)
    else:
        logger.error(message)

def debug(message, extra=None):
    """Log debug message"""
    if extra:
        logger.debug(message, extra=extra)
    else:
        logger.debug(message)

# Connection logging helpers
def log_connection(host, port, status):
    """Log connection status"""
    if status == 'connected':
        info(f"RabbitMQ connection established", {'host': host, 'port': port})
    elif status == 'disconnected':
        warning(f"RabbitMQ connection lost", {'host': host, 'port': port})
    elif status == 'error':
        error(f"RabbitMQ connection error", {'host': host, 'port': port})

# Message logging helpers
def log_message_sent(queue, message_id, size):
    """Log message sent"""
    info("Message sent", {
        'queue': queue,
        'message_id': message_id,
        'size': size
    })

def log_message_received(queue, message_id):
    """Log message received"""
    info("Message received", {
        'queue': queue,
        'message_id': message_id
    })

def log_message_processed(message_id, duration=None):
    """Log message processed"""
    extra = {'message_id': message_id}
    if duration:
        extra['duration'] = f"{duration".2f"}s"
    info("Message processed", extra)

def log_message_failed(message_id, error):
    """Log message processing failed"""
    error(f"Message processing failed", {
        'message_id': message_id,
        'error': str(error)
    })

# Queue logging helpers
def log_queue_declared(name):
    """Log queue declared"""
    info("Queue declared", {'name': name})

def log_queue_bound(queue, exchange, routing_key=None):
    """Log queue bound to exchange"""
    extra = {'queue': queue, 'exchange': exchange}
    if routing_key:
        extra['routing_key'] = routing_key
    info("Queue bound", extra)

def log_exchange_declared(name, type):
    """Log exchange declared"""
    info("Exchange declared", {'name': name, 'type': type})



