# Course Reflection

## 1. Most Difficult Concept & How I Overcame It
The most challenging concept in this course was mastering **asynchronous concurrency control and race conditions in databases**—specifically understanding how simultaneous requests can corrupt data states (such as double-booking a seat or overselling inventory) if transactions and row-level locks are not handled correctly. I overcame this by breaking down database isolation levels, exploring how pessimistic locking (`FOR UPDATE`) and atomic state transitions work in practice, and visualizing how queuing mechanisms protect backend systems from traffic surges.

## 2. Capstone Improvements Based on Feedback
Based on feedback regarding scalable architecture design, I would improve my capstone project by implementing a more robust caching and cache-invalidation strategy (such as using Redis for read-heavy feeds and precomputed user timelines). I would also expand the API design documentation to include more rigorous rate-limiting and pagination parameters to ensure smoother handling under high-load scenarios.

## 3. What I Will Learn Next
Moving forward, I plan to dive deeper into **distributed system patterns and event-driven architecture**, specifically learning message brokers like Apache Kafka or RabbitMQ, container orchestration with Kubernetes, and microservices communication patterns to build even more resilient cloud-native applications.