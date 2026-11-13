# 🛍️ ShopSphere — Modern E-Commerce Platform

ShopSphere is a full-stack, enterprise-grade e-commerce platform built for an Indian retail business expanding from brick-and-mortar storefronts into online retail. 

Built for hackathons and production deployments, ShopSphere demonstrates how **Aiven PostgreSQL**, **Aiven Apache Kafka**, and **Aiven OpenSearch** work seamlessly together in an event-driven architecture.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Frontend ["Frontend (React 18 + Vite + Tailwind CSS)"]
        UI["Customer Storefront & Checkout"]
        AdminUI["Admin & Aiven Telemetry Monitor"]
    end

    subgraph Backend ["Backend API & Event Services (Node.js + Express)"]
        Router["REST API Controllers"]
        OrderService["Transactional Order Service (Row Locks & Outbox)"]
        SearchService["Search Service (Typo-Tolerant Multi-Match)"]
        KafkaProd["Kafka Event Producer"]
        KafkaCons["Kafka Event Consumer"]
        Telemetry["In-Memory Telemetry Ring Buffer"]
    end

    subgraph Aiven ["Aiven Cloud Services Backbone"]
        PG[("Aiven PostgreSQL\n- Products & Categories\n- Customers & Orders\n- Outbox Events Table")]
        Kafka["Aiven Apache Kafka\nTopic: order_placed\nGroup: shopsphere-order-consumer"]
        OS[("Aiven OpenSearch\nIndex: products\nEdge n-gram & Fuzzy Analysis")]
    end

    UI -->|"Browse, Cart, Order"| Router
    UI -->|"Typo-Tolerant Search ('bluetoth')"| Router
    AdminUI -->|"Real-Time Health & Telemetry"| Router

    Router --> SearchService
    Router --> OrderService
    SearchService -->|"Execute Bool / Multi-Match"| OS

    OrderService -->|"BEGIN ... SELECT FOR UPDATE"| PG
    OrderService -->|"Publish order_placed Event"| KafkaProd
    KafkaProd -->|"Produce with SSL Certs"| Kafka

    Kafka -->|"Consume order_placed"| KafkaCons
    KafkaCons -->|"Idempotent Stock Decrement"| PG
    KafkaCons -->|"Update Document Stock"| OS
    KafkaCons -->|"Emit Event Logs"| Telemetry
    KafkaProd -->|"Emit Event Logs"| Telemetry
    Telemetry --> AdminUI
```

---

## 🚀 Key Features

### 1. Indian Retail Experience
- Curated catalogue of 16 high-quality Indian lifestyle and electronics products across 5 categories: **Electronics**, **Fashion**, **Home & Kitchen**, **Accessories**, and **Beauty**.
- Prices formatted in **Indian Rupees (₹)** with realistic pricing and savings discounts.
- Indian shipping details validation (State selection, 6-digit PIN code, 10-digit mobile number).
- Free express courier delivery on orders exceeding ₹999.

### 2. Aiven PostgreSQL Integration
- Full relational schema with foreign key relationships (`categories`, `products`, `customers`, `orders`, `order_items`, `outbox_events`).
- Strict **ACID transactions** with row-level locking (`SELECT ... FOR UPDATE`) during checkout to mathematically prevent negative stock or overselling race conditions when multiple customers order simultaneously.
- Reliable Transactional Outbox pattern recording all dispatched events.

### 3. Aiven Apache Kafka Event Streaming
- Producers publish `order_placed` events to the `order_placed` topic with order details, line items, and timestamps.
- Supports Aiven SSL mutual certificate authentication (`ca.pem`, `service.cert`, `service.key`) and SASL/SCRAM.
- Dedicated Kafka Consumer Service (`shopsphere-order-consumer`) ingests events with **idempotency deduplication guards**, decrements PostgreSQL inventory, and triggers OpenSearch index sync.

### 4. Aiven OpenSearch Search Engine
- Full-text search with typo tolerance (`fuzziness: "AUTO"`, prefix expansions). Searching for typos like `"bluetoth"` or `"anarkli"` finds the matching products instantly.
- Category filters and price range slider filters.
- Highlighted text matches returned directly to the UI.

### 5. Live Admin & Telemetry Dashboard (`/admin`)
- **Real-Time Service Connection Health**: Tests live pings and latencies to Aiven PostgreSQL, Apache Kafka, and OpenSearch (never faked).
- **Live Kafka Event Stream Feed**: Auto-refreshing terminal showing produced, consumed, inventory-updated, and search-synced events.
- **Orders & Inventory Management**: View customer orders, items, and remaining stock.
- **Demo Data Reset**: One-click reset button to restore sample products and initial stock levels.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons |
| **Backend** | Node.js, Express.js, REST APIs, Morgan |
| **Database** | Aiven PostgreSQL (`pg` pool with SSL) |
| **Event Streaming** | Aiven Apache Kafka (`kafkajs` with mutual SSL) |
| **Search Engine** | Aiven OpenSearch (`@opensearch-project/opensearch`) |

---

## 📦 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on v24.12.0)
- npm 9+

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/ShopSphere.git
cd ShopSphere

# Install all dependencies (both backend and frontend)
npm run install:all
```

Or install individually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

Copy the sample environment file in `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

> **Note on Fallback Mode**: If you do not have Aiven credentials yet, ShopSphere automatically runs in **Graceful Fallback Mode**. The backend spins up an in-memory transactional store and fuzzy search engine so you can immediately experience and demonstrate the entire UI, cart, checkout, and Kafka stream simulator out-of-the-box!

---

## ☁️ Connecting Aiven Cloud Services

Connecting your Aiven services takes less than 3 minutes. Zero code changes are required; simply supply the credentials in `backend/.env`.

### 1. Aiven PostgreSQL
1. Go to your [Aiven Console](https://console.aiven.io/) and create or select your PostgreSQL service.
2. In the **Overview** tab, copy the **Service URI**.
3. In `backend/.env`, set:
   ```env
   DATABASE_URL=postgres://avnadmin:YOUR_PASSWORD@your-pg-service.aivencloud.com:18826/defaultdb?sslmode=require
   ```
4. Run the database initialization and seed script:
   ```bash
   cd backend
   npm run seed
   ```
   *This automatically executes `scripts/init-db.sql` and inserts all 16 sample products into PostgreSQL.*

---

### 2. Aiven Apache Kafka
1. In the Aiven Console, select your Kafka service.
2. Under **Overview**, copy the **Service URI** (host and port):
   ```env
   KAFKA_BROKERS=your-kafka-service.aivencloud.com:18828
   KAFKA_TOPIC=order_placed
   KAFKA_GROUP_ID=shopsphere-order-consumer
   KAFKA_SSL=true
   ```
3. Download the 3 SSL certificate files from the Overview page:
   - `ca.pem` (CA Certificate)
   - `service.cert` (Access Certificate)
   - `service.key` (Access Key)
4. Place them in `backend/certs/` (or update paths in `backend/.env`):
   ```env
   KAFKA_CA_CERT_PATH=./certs/ca.pem
   KAFKA_ACCESS_CERT_PATH=./certs/service.cert
   KAFKA_ACCESS_KEY_PATH=./certs/service.key
   ```
5. In the Aiven Kafka Console, create the topic `order_placed` (or let the producer auto-create it).

---

### 3. Aiven OpenSearch
1. In the Aiven Console, select your OpenSearch service.
2. Copy the **Service URI**:
   ```env
   OPENSEARCH_NODE=https://avnadmin:YOUR_PASSWORD@your-opensearch-service.aivencloud.com:18830
   OPENSEARCH_INDEX=products
   OPENSEARCH_SSL_REJECT_UNAUTHORIZED=false
   ```
3. Run the OpenSearch indexing script:
   ```bash
   cd backend
   npm run sync-search
   ```
   *This creates the `products` index with custom edge n-gram analyzers and bulk-indexes all products with typo-tolerant search mappings.*

---

## 🏃 Running the Application

### Start the Backend Server
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

### Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:3000 (proxies /api to :5000)
```

Open your browser at **`http://localhost:3000`**.

---

## 🧪 Automated Testing & Verification

ShopSphere includes an automated test script verifying all 6 end-to-end integration flows:

```bash
cd backend
npm run test-flow
```

### Verification Flow Checks:
1. `GET /api/health` — Verifies PostgreSQL, Kafka, and OpenSearch statuses.
2. `GET /api/products` — Confirms all 16 products are returned.
3. `GET /api/search?q=bluetoth` — Typo tolerance test matching "boAt Rockerz 450 Bluetooth Headphones".
4. `POST /api/orders` — Places a real order, validates row locking and verifies stock decrement.
5. `POST /api/orders` (Overselling test) — Orders 9999 units and verifies `400 Bad Request: Insufficient stock`.
6. `GET /api/admin/stats` — Inspects telemetry and confirms `order_placed` and `OPENSEARCH_SYNCED` Kafka events.

---

## 📚 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/products` | GET | List products with optional `category`, `minPrice`, `maxPrice`, `limit` filters |
| `/api/products/categories` | GET | List all 5 product categories |
| `/api/products/:id` | GET | Retrieve product details by ID |
| `/api/search?q=query` | GET | Typo-tolerant OpenSearch query with category/price filters |
| `/api/orders` | POST | Transactional order placement with customer info and items |
| `/api/orders/:id` | GET | Retrieve order confirmation and line items |
| `/api/health` | GET | Real-time health status of PostgreSQL, Kafka, and OpenSearch |
| `/api/admin/stats` | GET | Admin telemetry metrics, recent orders, and Kafka logs |
| `/api/admin/reset` | POST | Reset demo inventory and refresh telemetry |

---

## 🚢 Deployment Guide

### Deploy Backend (e.g. Render, Railway, AWS ECS, Heroku)
1. Set the Root Directory to `backend`.
2. Build Command: `npm install`
3. Start Command: `node src/index.js`
4. Configure environment variables (`DATABASE_URL`, `KAFKA_BROKERS`, `OPENSEARCH_NODE`, etc.).

### Deploy Frontend (e.g. Vercel, Netlify)
1. Set the Root Directory to `frontend`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set proxy rewrite or `VITE_API_BASE_URL` pointing to the deployed backend URL.

---

## 👥 Hackathon Team & Credits
Developed for the Hackathon demonstrating enterprise cloud architecture with **Aiven PostgreSQL**, **Aiven Apache Kafka**, and **Aiven OpenSearch**.
