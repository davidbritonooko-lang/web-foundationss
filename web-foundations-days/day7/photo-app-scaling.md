Here is the complete scaling plan document for "SnapShare", formatted as requested for `day7/photo-app-scaling.md`.

---

# SnapShare: Photo-Sharing App Scaling Plan

## 1. Assumptions & Daily Active Users (DAU)

* **Registered Users:** 10,000,000
* **Activity Rate:** 10% of registered users are active daily.
* **User Engagement:**
* Each active user uploads **1 photo per day**.
* Each active user views **50 feed pages per day**.


* **File Sizes:**
* Average raw photo = **2 MB**.
* Thumbnail version = **50 KB**.



### Daily Active Users (DAU) Calculation

$$\text{DAU} = 10,000,000 \times 0.10 = 1,000,000 \text{ active users/day}$$

---

## 2. Traffic & Storage Estimates

### Uploads Per Second (Writes)

* **Daily Uploads:** $1,000,000 \text{ users} \times 1 \text{ photo/day} = 1,000,000 \text{ uploads/day}$
* **Seconds per Day:** $24 \times 3600 = 86,400 \text{ seconds}$
* **Average Uploads/sec:** $\frac{1,000,000}{86,400} \approx 11.57 \text{ uploads/sec}$
* **Peak Uploads/sec ($5\times$ multiplier):** $11.57 \times 5 \approx 58 \text{ uploads/sec}$

### Feed Views Per Second (Reads)

* **Daily Feed Views:** $1,000,000 \text{ users} \times 50 \text{ views/day} = 50,000,000 \text{ feed views/day}$
* **Average Feed Views/sec:** $\frac{50,000,000}{86,400} \approx 579 \text{ feed views/sec}$
* **Peak Feed Views/sec ($5\times$ multiplier):** $579 \times 5 \approx 2,894 \text{ feed views/sec}$

### Storage Per Year

* **Raw Photos Storage/day:** $1,000,000 \text{ photos} \times 2 \text{ MB} = 2,000,000 \text{ MB} = 2 \text{ TB/day}$
* **Thumbnails Storage/day:** $1,000,000 \text{ thumbnails} \times 50 \text{ KB} = 50,000,000 \text{ KB} \approx 0.05 \text{ TB/day}$
* **Total Daily Storage:** $2 \text{ TB} + 0.05 \text{ TB} = 2.05 \text{ TB/day}$
* **Total Annual Storage:** $2.05 \text{ TB/day} \times 365 \text{ days} \approx \mathbf{748.25 \text{ TB/year}}$

---

## 3. Read-Heavy vs. Write-Heavy Analysis

* **Verdict:** SnapShare is overwhelmingly **read-heavy** (a ratio of roughly 50 read feed requests for every 1 write upload).
* **Design Implications:**
* The system must prioritize high-throughput read scaling.
* Heavy caching mechanisms (Redis) are mandatory for user profiles and precomputed feeds.
* Database read replicas are required to offload read queries away from the primary transactional database.
* A global Content Delivery Network (CDN) is essential to serve static media files close to users with minimal latency.



---

## 4. Why Photos Do Not Belong in the Database

Relational or NoSQL databases are optimized for structured text data, fast lookups, indexing, and transactional integrity (ACID). Storing large binary files (like 2 MB photos) directly inside a database causes severe performance degradation, bloats storage sizes, slows down database backups, and drives up cloud infrastructure costs.

Instead, photos should be stored in **Object Storage (such as AWS S3)**, which is purpose-built to scale cost-effectively for massive unstructured binary assets. The database stores only lightweight metadata pointers (such as the object storage URL, caption, user ID, and timestamps).

---

## 5. Architecture Diagram

```text
[ Clients / Mobile Apps ]
          │
          ▼
[ CDN (Content Delivery Network) ] ──(Cached Images & Thumbnails)
          │
          ▼
[ Load Balancer (LB) ]
          │
          ├───────────────┬────────────────┐
          ▼               ▼                ▼
   [ App Server 1 ] [ App Server 2 ]  [ App Server N ]
          │               │                │
          ├───────────────┼────────────────┤
          ▼               ▼                ▼
     [ Cache ]     [ Primary DB ]  [ Read Replica DB ]
   (Redis/Memcached)  (Writes)          (Reads)
          │
          ├────────────────────────────────┐
          ▼                                ▼
  [ Message Queue ]               [ Object Storage ]
  (e.g., RabbitMQ/SQS)             (AWS S3 / Blobs)
          │
          ▼
  [ Thumbnail Worker ] ──(Saves Thumb)──> [ Object Storage ]

```

---

## 6. Component Descriptions

* **CDN:** Caches and delivers static media files (photos and thumbnails) globally near users to reduce latency and origin server load.
* **Load Balancer:** Distributes incoming user requests evenly across multiple application servers to ensure high availability and prevent single-server overload.
* **App Servers:** Process incoming API requests, coordinate business logic, handle authentications, and generate feed responses.
* **Cache (Redis):** Stores frequently accessed data (like user sessions and precomputed feeds) in memory for ultra-fast retrieval.
* **Database (Primary + Read Replica):** The primary database handles write operations (user accounts, post metadata), while read replicas offload heavy query/read traffic to balance the load.
* **Object Storage:** Scalable, cost-effective cloud storage specifically designed to store large unstructured binary files like raw photos and thumbnails.
* **Message Queue:** Asynchronously buffers background jobs (like thumbnail generation) so the main upload request remains fast and responsive.
* **Thumbnail Worker:** Background process that picks up queue jobs, resizes uploaded photos into low-resolution thumbnails, and uploads them back to object storage.

---

## 7. Step-by-Step Upload Flow

1. **Initiation:** The user selects a photo on their client app and submits an upload request to the Load Balancer.
2. **Routing:** The Load Balancer forwards the request to an available App Server, which authenticates the user's session token.
3. **Blob Storage Transfer:** The App Server uploads the raw binary photo file directly into Object Storage and receives a unique asset URL.
4. **Metadata Persistence:** The App Server writes the post metadata (storage URL, caption, user ID, timestamp) into the Primary Database.
5. **Queue Job Dispatch:** The App Server publishes a background job message containing the photo details to the Message Queue.
6. **Immediate Response:** The App Server returns a success response to the client immediately, ensuring a snappy user experience.
7. **Thumbnail Generation:** A background Thumbnail Worker picks up the job from the message queue, downloads the raw photo from object storage, compresses it into a 50 KB thumbnail, and saves it back to Object Storage.

---

## 8. Key Architecture Trade-offs

* **Trade-off 1: Precomputed Feeds (Fan-out on Write) vs. On-the-Fly Queries**
* *Choice:* Precomputing feeds.
* *Trade-off:* While writing feeds ahead of time makes reading feeds lightning-fast (vital for a read-heavy app), it introduces massive background processing overhead and storage duplication when high-follower "celebrity" users post new photos.


* **Trade-off 2: Eventual Consistency for Thumbnail & Feed Delivery**
* *Choice:* Asynchronous background processing via a message queue.
* *Trade-off:* Offloading thumbnail generation and feed distribution to background workers keeps upload requests fast and responsive, but introduces a brief lag (a few seconds) before followers see the newly uploaded photos or thumbnails in their feeds.