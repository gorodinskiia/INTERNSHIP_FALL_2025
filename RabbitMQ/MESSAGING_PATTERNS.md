# RabbitMQ Messaging Patterns

This document explains the different messaging patterns implemented in these examples and when to use each pattern.

## Overview

RabbitMQ supports several exchange types, each designed for different messaging scenarios:

1. **Direct Exchange** - Point-to-point messaging with routing keys
2. **Topic Exchange** - Pattern-based routing with wildcards
3. **Fanout Exchange** - Broadcast messaging to all consumers
4. **Headers Exchange** - Message routing based on headers
5. **RPC Pattern** - Request-response over message queues

## 1. Direct Exchange Pattern

### When to Use
- **Point-to-point messaging** where each message goes to exactly one consumer
- **Simple routing** based on exact routing key matches
- **Task distribution** where different workers handle different types of tasks
- **Log processing** where different log levels are handled by different consumers

### Routing Keys
Direct exchanges use exact matching of routing keys:
```
log.info     → Consumer listening for "log.info"
log.warn     → Consumer listening for "log.warn"
log.error    → Consumer listening for "log.error"
task.email   → Consumer handling email tasks
task.image   → Consumer handling image tasks
```

### Example Usage
```javascript
// Producer
await producer.sendLogMessage('error', 'Database connection failed');
await producer.sendTaskMessage('email', { to: 'user@example.com' });

// Consumer
await consumer.createQueue('error_logs', ['log.error']);
await consumer.createQueue('email_tasks', ['task.email']);
```

## 2. Topic Exchange Pattern

### When to Use
- **Pattern-based routing** where consumers can subscribe to multiple message types
- **Hierarchical categorization** of messages
- **Flexible routing** with wildcard matching
- **Event-driven systems** where events need to reach multiple interested parties

### Routing Key Patterns
Topic exchanges use wildcards:
- `*` (star) matches exactly one word
- `#` (hash) matches zero or more words

```
analytics.*.*           → analytics.user.login, analytics.page.view
*.error.*              → user.error.login, payment.error.failed
user.*.*               → user.create.account, user.update.profile
notification.#         → notification.email.high.urgent, notification.sms.medium
#                      → Matches everything (catch-all)
```

### Example Usage
```javascript
// Producer
await producer.sendAnalyticsMessage('user', 'login', 'web');
await producer.sendNotificationMessage(123, 'email', 'high', {...});

// Consumer
await consumer.createQueue('analytics', ['analytics.*.*']);
await consumer.createQueue('errors', ['*.error.*']);
```

## 3. Fanout Exchange Pattern

### When to Use
- **Broadcast messaging** where every message goes to ALL consumers
- **System notifications** that need to reach all services
- **Cache invalidation** across multiple services
- **Real-time updates** to all connected clients
- **Alert systems** where all monitoring systems need to be notified

### Characteristics
- **No routing keys** - messages go to all bound queues
- **Multiple consumers** - each gets a copy of every message
- **Load distribution** - messages are distributed across all consumers
- **Broadcast nature** - perfect for notifications and alerts

### Example Usage
```javascript
// Producer
await producer.sendAlertMessage('critical', 'System Down', 'Database unreachable');
await producer.sendBroadcastMessage('maintenance', { start: '22:00', duration: '2h' });

// All consumers receive every message
await consumer.createQueue('service1');
await consumer.createQueue('service2');
await consumer.createQueue('monitoring');
```

## 4. Headers Exchange Pattern

### When to Use
- **Complex routing** based on message headers rather than routing keys
- **Message filtering** based on multiple criteria
- **Content-based routing** where routing depends on message content
- **Flexible matching** with "any" or "all" logic

### Header Matching
Headers exchanges match on message headers:
```javascript
// Producer sends with headers
await producer.sendMessage('route', message, {
  headers: {
    'content-type': 'json',
    'priority': 'high',
    'department': 'engineering'
  }
});

// Consumer binds with matching criteria
await consumer.createQueue('high_priority', '', {
  'x-match': 'all',  // or 'any'
  'priority': 'high',
  'department': 'engineering'
});
```

## 5. RPC (Remote Procedure Call) Pattern

### When to Use
- **Request-response** communication over message queues
- **Service calls** between microservices
- **Asynchronous API** calls where response is needed
- **Long-running tasks** that need to return results
- **Load balancing** of computational tasks

### How It Works
1. **Client** sends request with unique correlation ID
2. **Server** processes request and sends response to reply queue
3. **Client** matches response using correlation ID
4. **Timeout handling** prevents hanging requests

### Example Usage
```javascript
// Client makes RPC call
const result = await client.call('math.calculate', {
  operation: 'multiply',
  numbers: [10, 5]
});

// Server handles the request
const response = await server.processRequest(request);
```

## Pattern Comparison

| Pattern | Routing | Use Case | Complexity | Performance |
|---------|---------|----------|------------|-------------|
| **Direct** | Exact key match | Task routing | Low | High |
| **Topic** | Pattern matching | Event systems | Medium | High |
| **Fanout** | Broadcast | Notifications | Low | High |
| **Headers** | Header matching | Complex filtering | High | Medium |
| **RPC** | Correlation ID | Request-response | Medium | Medium |

## Best Practices by Pattern

### Direct Exchange Best Practices
- Use descriptive routing keys: `task.email`, `log.error`, `notification.sms`
- Keep routing keys consistent across your application
- Use for simple, predictable routing scenarios
- Consider using topic exchanges for more flexibility

### Topic Exchange Best Practices
- Design hierarchical routing keys: `user.create.account`, `order.cancel.fulfillment`
- Use `*` for single-level wildcards, `#` for multi-level
- Avoid overly broad patterns that match too many messages
- Document your routing key conventions

### Fanout Exchange Best Practices
- Use for true broadcast scenarios only
- Consider message relevance - not all services need all messages
- Implement filtering at the consumer level if needed
- Monitor queue depths as all messages go to all queues

### RPC Best Practices
- Set appropriate timeouts for different operations
- Implement proper error handling and retries
- Use correlation IDs for request tracking
- Consider load balancing with multiple server instances
- Implement circuit breakers for fault tolerance

## Implementation Examples

### Direct Exchange Example
```javascript
// Log processing system
const logConsumer = new DirectConsumer();
await logConsumer.createQueue('error_logs', ['log.error', 'log.critical']);
await logConsumer.createQueue('info_logs', ['log.info', 'log.debug']);
```

### Topic Exchange Example
```javascript
// Analytics system
const analyticsConsumer = new TopicConsumer();
await analyticsConsumer.createQueue('user_analytics', ['analytics.user.*']);
await analyticsConsumer.createQueue('error_analytics', ['*.error.*']);
```

### Fanout Exchange Example
```javascript
// System monitoring
const alertConsumer1 = new FanoutConsumer('web-server');
const alertConsumer2 = new FanoutConsumer('database');
const alertConsumer3 = new FanoutConsumer('monitoring');
```

### RPC Example
```javascript
// Microservice communication
const paymentService = new RPCClient();
const userService = new RPCClient();
const emailService = new RPCClient();
```

## Performance Considerations

### Direct Exchange
- **Fastest** routing due to exact key matching
- **Low overhead** - simple routing table lookup
- **Scalable** - easy to add new routing keys
- **Predictable** - messages always go to intended consumers

### Topic Exchange
- **Flexible** but slightly slower than direct
- **Pattern matching** overhead for complex patterns
- **Scalable** with proper pattern design
- **More complex** routing table management

### Fanout Exchange
- **Fast** broadcast delivery
- **Message duplication** - each consumer gets full copy
- **Network intensive** for large numbers of consumers
- **Simple** - no routing logic needed

### RPC Pattern
- **Two network hops** (request + response)
- **Correlation overhead** for tracking requests
- **Timeout management** complexity
- **Synchronous feel** with asynchronous benefits

## Choosing the Right Pattern

### Ask These Questions:
1. **How many consumers should receive each message?**
   - One → Direct or Topic
   - All → Fanout
   - Many → Topic with patterns

2. **How do I want to route messages?**
   - Exact criteria → Direct
   - Patterns → Topic
   - Headers → Headers
   - Broadcast → Fanout

3. **Do I need a response?**
   - Yes → RPC
   - No → Any exchange type

4. **What's the message volume?**
   - High → Consider performance characteristics
   - Low → Any pattern works

### Common Combinations:
- **Web Application**: Topic for events, Direct for tasks, Fanout for notifications
- **Microservices**: RPC for service calls, Direct for commands, Topic for events
- **Data Pipeline**: Direct for processing stages, Topic for filtering
- **Monitoring**: Fanout for alerts, Topic for categorized logs

## Error Handling by Pattern

### Direct Exchange Errors
- Messages with unmatched routing keys are **dropped**
- Use alternate exchanges for undelivered messages
- Implement dead letter queues for failed processing

### Topic Exchange Errors
- Complex patterns can lead to **unexpected routing**
- Test patterns thoroughly in development
- Use specific patterns to avoid over-matching

### Fanout Exchange Errors
- **All consumers** affected by message format changes
- Ensure message compatibility across all services
- Use message versioning for breaking changes

### RPC Errors
- **Timeout handling** critical for request-response
- Implement proper error propagation
- Handle server failures gracefully

## Security Considerations

### All Patterns
- Use SSL/TLS in production
- Implement proper authentication
- Set up user permissions and virtual hosts

### Direct/Topic Patterns
- Validate routing keys to prevent injection attacks
- Sanitize message content
- Implement rate limiting per routing key

### Fanout Pattern
- Ensure all consumers can handle broadcast messages
- Implement message filtering at consumer level
- Consider encryption for sensitive broadcasts

### RPC Pattern
- Validate request parameters
- Implement request size limits
- Use authentication for RPC calls

This comprehensive guide should help you choose and implement the right messaging pattern for your specific use case. Each pattern has its strengths and is designed for different scenarios in distributed systems.

