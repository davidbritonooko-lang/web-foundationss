# TicketHub System Design Document

This document outlines the end-to-end architecture, capacity estimations, API specifications, relational data model, and concurrency control mechanisms for **TicketHub**, a high-demand event ticketing platform capable of handling extreme flash-sale traffic surges.

---

## Part 1: Requirements

### Functional Requirements
* **Event Browsing & Search:** Users can browse upcoming concerts, search events, and view available dates and details.
* **Seat Map Exploration:** Users can view real-time seating charts and select specific available seats for an event.
* **Timed Seat Reservation (Hold):** Users can temporarily lock/hold specific seats for a limited window (e.g., 10 minutes) while completing payment.
* **Checkout & Payment:** Users can securely purchase held seats by processing payments and generating immutable orders/tickets.
* **Ticket Management:** Users can view their purchased tickets and QR codes for event entry.

### Non-Functional Requirements
* **Speed:** Low latency ($< 200\text{ms}$) for browsing and seat selection under normal load; sub-second response times during peak flash sales.
* **Correctness (Zero Double-Booking):** Absolute transactional integrity ensuring that no single seat can ever be sold or assigned to more than one user, under any concurrency level.
* **Fairness:** First-come, first-served queueing mechanisms during high-demand on-sale events to prevent bot exploitation and ensure equitable access.
* **Availability & High Scalability:** 99.99% uptime with horizontal scalability to absorb sudden 40$\times$ traffic spikes without catastrophic system failure.

---

## Part 2: Traffic Estimates & Flash-Sale Surge Comparison

### 1. Normal Daily Traffic
* **Registered Users:** $2,000,000$
* **Daily Visitors:** $50,000$ visitors/day
* **Page Views:** $50,000 \times 10 \text{ pages/day} = 500,000 \text{ page views/day}$
* **Normal Page Views/sec:** 
  $$\frac{500,000}{86,400} \approx 5.79 \text{ views/sec}$$
* **Normal Ticket Sales:** $5,000 \text{ tickets/day}$
* **Normal Writes/sec:** 
  $$\frac{5,000}{86,400} \approx 0.058 \text{ sales/sec}$$

### 2. Flash-Sale Peak Surge (Popular Concert On-Sale)
* **Surge Scenario:** $200,000$ users attempt to purchase $20,000$ seats within the first $10$ minutes ($600$ seconds).
* **Peak Traffic Window:** $10 \text{ minutes} = 600 \text{ seconds}$
* **Peak Request Rate (Traffic Shock):**
  $$\frac{200,000 \text{ users}}{600 \text{ seconds}} \approx 333.33 \text{ requests/sec (average surge)},$$
  with burst multipliers reaching **$1,500$ to $2,000$ requests/sec** at the exact minute of release.
* **Peak Sales / Write Rate:**
  $$\frac{20,000 \text{ seats}}{600 \text{ seconds}} \approx 33.33 \text{ successful checkouts/sec}$$

### 3. Comparison
The flash-sale surge represents a **multi-hundred-fold increase** in write and checkout contention compared to normal daily operations. While normal traffic is easily handled by standard database connections, the flash-sale event requires specialized distributed virtual waiting rooms (queues), aggressive edge caching for seat layouts, and strict pessimistic/optimistic database locking to prevent server crashes and overselling.

---

## Part 3: RESTful API Design

Base URL: `https://api.tickethub.com/v1`

| Method | Endpoint | Description | Success Status |
| :--- | :--- | :--- | :--- |
| **GET** | `/events` | Retrieve a list of upcoming concerts and events with pagination. | `200 OK` |
| **GET** | `/events/{id}/seats` | Retrieve the real-time seat availability map for a specific event. | `200 OK` |
| **POST** | `/seats/hold` | Temporarily hold selected available seats for 10 minutes. | `201 Created` |
| **POST** | `/orders` | Process payment and convert held seats into confirmed ticket orders. | `201 Created` |
| **GET** | `/users/me/tickets` | Retrieve all purchased tickets and QR codes for the authenticated user. | `200 OK` |

---

## Part 4: Data Model & Database Schema

### Entities & Columns

1. **`users`**: Account data (`id`, `username`, `email`, `password_hash`, `created_at`).
2. **`events`**: Concert details (`id`, `title`, `artist`, `venue`, `date`, `total_seats`, `created_at`).
3. **`seats`**: Individual physical seats (`id`, `event_id`, `seat_number`, `status` [ENUM: `available`, `held`, `booked`], `held_until`, `version` for optimistic locking).
4. **`orders`**: Checkout and payment records (`id`, `user_id`, `event_id`, `total_amount`, `status` [ENUM: `pending`, `completed`, `failed`, `refunded`], `created_at`).

### CREATE TABLE Statements

```sql
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    venue TEXT NOT NULL,
    date TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    seat_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'held', 'booked'
    held_until TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1, -- Optimistic locking counter
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(event_id, seat_number)
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);
```

### Indexing Strategy
* `CREATE INDEX idx_seats_event_status ON seats(event_id, status);`
* **Reason:** During a flash sale, thousands of users query the seat map to check availability. Indexing `event_id` and `status` allows the database to instantly filter available seats without scanning entire tables.

---

## Part 5: Preventing Double-Booking (Concurrency Control)

Preventing two users from purchasing the same seat during high concurrency requires a robust multi-layered strategy combining atomic database transactions, row-level locks, and time-based status constraints:

1. **Atomic State Transitions:** A seat can only transition from `available` $\rightarrow$ `held` if its current status is explicitly `available`.
2. **Database Transactions & Row-Level Locking (`SELECT ... FOR UPDATE`):** When a user attempts to hold a seat, the application initiates an isolated database transaction. It locks the specific seat row using exclusive locks:
   ```sql
   BEGIN TRANSACTION;
   SELECT * FROM seats WHERE id = ? AND status = 'available' FOR UPDATE;
   ```
3. **Conditional Update & Expiry Tracking:** If the seat is available, the backend updates its status to `held`, sets a `held_until` expiration timestamp (10 minutes in the future), and increments the version counter. If another concurrent request tries to lock the same row, it blocks until the first transaction commits or rolls back, at which point it discovers the seat is no longer `available`.
4. **Background Expiration Sweeper:** A periodic cron worker scans for expired holds (`status = 'held' AND held_until < NOW()`) and automatically releases them back to `available`.

---

## Part 6: Architecture Diagram & Flash-Sale Resilience

```text
[ Users / Clients ]
       │
       ▼
[ Edge CDN / WAF (DDoS & Bot Mitigation) ]
       │
       ▼
[ Distributed Virtual Waiting Room (Queue / Redis Token Bucket) ]
       │ (Regulates ingress traffic)
       ▼
[ Load Balancer (Round Robin) ]
       │
       ├──────────────────────┬──────────────────────┐
       ▼                      ▼                      ▼
 [ App Server 1 ]       [ App Server 2 ]       [ App Server N ]
       │                      │                      │
       ├──────────────────────┴──────────────────────┤
       ▼                                             ▼
[ Redis Cache (Seat Map Cache) ]        [ Primary Database (ACID Transactions) ]
                                                     │
                                                     ▼
                                        [ Read Replica (Event Browsing) ]
```

### Component Explanations & Scaling Strategy
* **Edge CDN / WAF:** Filters malicious bot traffic, absorbs DDoS attacks, and caches static assets and event descriptions globally.
* **Virtual Waiting Room (Redis/Queue):** The secret weapon for flash sales. Instead of letting 200,000 users hammer the database simultaneously, incoming users are placed into an orderly queue. Tickets are distributed token-by-token at a rate the database can safely process.
* **Load Balancer:** Distributes sanitized incoming API traffic evenly across stateless application servers.
* **App Servers:** Handle business logic, JWT authentication, and coordinate transaction requests.
* **Redis Cache:** Caches read-heavy seating charts and event catalogs to offload read traffic from the relational database.
* **Primary Database (ACID):** Handles high-integrity transactional seat holds and payment orders using strict row locking.
* **Read Replica:** Serves general event browsing and user ticket lookup queries.

---

## Part 7: Key Trade-offs

1. **Virtual Waiting Room Queue vs. Immediate Access**
   * *Choice:* Implementing a virtual queue during popular on-sale events.
   * *Trade-off:* While forcing users into a waiting room introduces slight friction and perceived delay, it prevents database collapse, ensures absolute fairness (first-come, first-served), and eliminates bot-driven server crashes.
2. **Real-Time Seat Availability vs. Eventual Consistency Caching**
   * *Choice:* Storing live seat lock states directly in the primary database with Redis caching reserved for static event metadata.
   * *Trade-off:* Bypassing cache layers for live seat holds slightly increases database write contention, but completely eliminates race conditions and guarantee zero double-booking errors.