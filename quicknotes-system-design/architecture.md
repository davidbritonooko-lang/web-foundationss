# QuickNotes System Architecture & Scaling Plan

This document defines the architecture, scalability requirements, traffic estimations, component breakdown, request flows, and fault-tolerance strategies for scaling QuickNotes to 1 million users.

---

## 1. Requirements

### Functional Requirements
* **Note Management**: Users can create, read, update, and delete notes.
* **Tagging System**: Users can categorize notes with tags via many-to-many relationships.
* **Authentication**: Secure token-based user authentication (`Authorization: Bearer <token>`).

### Non-Functional Requirements
* **High Availability**: 99.9% uptime with redundancy across all infrastructure tiers.
* **Low Latency**: Sub-100ms API response times for read queries globally.
* **Scalability**: Designed to sustain 1 million active users with read-heavy workloads.
* **Data Integrity**: Strict ACID compliance for user data and relational integrity.

---

## 2. Load Estimates (1 Million Users)

### Assumptions
* **Registered Users:** 1,000,000
* **Daily Active Users (DAU):** 20% activity rate = 200,000 active users/day.
* **User Activity:** Each active user performs 20 note reads/listings and 2 note writes per day.
* **Average Note Size:** 2 KB per note (including title, body, and metadata).

### Calculations
* **Reads Per Second (Average):**
  $$\frac{200,000 \text{ users} \times 20 \text{ reads/day}}{86,400 \text{ seconds}} \approx 46.3 \text{ reads/sec}$$
  * *Peak Reads ($5\times$ multiplier):* $\approx 232 \text{ reads/sec}$

* **Writes Per Second (Average):**
  $$\frac{200,000 \text{ users} \times 2 \text{ writes/day}}{86,400 \text{ seconds}} \approx 4.63 \text{ writes/sec}$$
  * *Peak Writes ($5\times$ multiplier):* $\approx 23 \text{ writes/sec}$

* **Storage Per Year:**
  $$\text{Daily Writes} = 200,000 \times 2 = 400,000 \text{ notes/day}$$
  $$\text{Daily Storage} = 400,000 \times 2 \text{ KB} = 800,000 \text{ KB} \approx 0.8 \text{ GB/day}$$
  $$\text{Annual Storage} = 0.8 \text{ GB} \times 365 \text{ days} \approx \mathbf{292 \text{ GB/year}}$$

---

## 3. Architecture Diagram

```text
[ Clients (Web / Mobile) ]
            │
            ▼
[ DNS (Domain Name System) ]
            │
            ▼
[ CDN (Content Delivery Network) ] ──(Static Assets)
            │
            ▼
[ Load Balancer (Round Robin / Least Connections) ]
            │
            ├──────────────────────┬──────────────────────┐
            ▼                      ▼                      ▼
     [ App Server 1 ]       [ App Server 2 ]       [ App Server N ]
            │                      │                      │
            ├──────────────────────┼──────────────────────┤
            ▼                      ▼                      ▼
     [ Cache (Redis) ]     [ Primary DB (Writes) ] [ Read Replica (Reads) ]
            │
            ▼
     [ Message Queue ]
            │
            ▼
     [ Async Worker ]
```

---

## 4. Component Explanations

* **DNS:** Resolves domain names to IP addresses and routes global traffic efficiently.
* **CDN:** Caches static frontend assets (HTML, CSS, JS) at edge locations near users to reduce latency.
* **Load Balancer:** Distributes incoming HTTP requests across multiple application servers to prevent overload and ensure high availability.
* **App Servers:** Stateless backend servers that process API requests, enforce business logic, and handle authentication.
* **Cache (Redis):** In-memory data store used to cache frequently accessed user sessions and note lists for ultra-fast retrieval.
* **Primary Database:** Handles all transactional write operations (`INSERT`, `UPDATE`, `DELETE`) with full ACID guarantees.
* **Read Replica:** Synchronized copy of the primary database dedicated to offloading heavy `SELECT` query traffic.
* **Message Queue:** Buffers asynchronous background tasks (such as audit logging or email notifications) so API requests remain fast.
* **Async Worker:** Background service that consumes queued tasks and processes them independently.

---

## 5. Step-by-Step Request Flows

### Flow 1: `GET /notes` (Listing Notes)
1. **Client Request:** The user's browser sends an HTTP `GET /notes` request with an `Authorization: Bearer <token>` header.
2. **Load Balancing:** The Load Balancer receives the request and routes it to an available App Server.
3. **Cache Lookup:** The App Server checks the Redis Cache for the user's cached note list. If a cache hit occurs, it returns data immediately.
4. **Database Query:** On a cache miss, the App Server queries the **Read Replica Database** (`SELECT * FROM notes WHERE user_id = ?`).
5. **Cache Populate & Response:** The app server stores the result in Redis for future requests and returns the JSON note list to the client.

### Flow 2: `POST /notes` (Creating a Note)
1. **Client Request:** The client sends `POST /notes` with the JSON body (`{ title, body }`) and auth token.
2. **Routing & Auth:** The Load Balancer forwards the request to an App Server, which validates the JWT token and input constraints (e.g., title length $\le 100$ chars).
3. **Database Write:** The App Server executes an `INSERT` statement on the **Primary Database**.
4. **Cache Invalidation:** The App Server clears or updates the user's cached note list in Redis to maintain consistency.
5. **Response:** The server returns a `201 Created` status code along with the newly created note object.

---

## 6. Trade-offs & Single Points of Failure (SPOF) Mitigation

### Key Architecture Trade-offs
1. **Read Replicas vs. Replication Lag:** Using read replicas scales read performance dramatically, but introduces a minor replication lag (milliseconds) where a newly created note might not appear instantly on a read replica. *Mitigation:* Read-after-write consistency routing for critical user actions.
2. **Caching vs. Data Staleness:** Caching note lists in Redis speeds up responses, but risks serving stale data if updates bypass cache invalidation. *Mitigation:* Explicit cache eviction/invalidation on every `POST`, `PUT`, and `DELETE`.

### Eliminating Single Points of Failure (SPOF)
* **Load Balancer SPOF:** Solved by deploying multiple load balancers behind Anycast DNS with automated health checks and failover.
* **App Server SPOF:** Solved by running an autoscaling cluster of multiple stateless application servers behind the load balancer.
* **Database SPOF:** Solved by pairing the Primary Database with automated failover replication and standby read replicas.