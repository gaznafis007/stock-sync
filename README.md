# Stock Sync

A high-performance, real-time inventory system tailored for "limited-edition merch drops". Engineered with robust atomic reservations, automatic expiration recoveries, concurrent stock protection, and seamless live updates across all connected clients.

## Features

- **Real-Time Inventory Streaming**: Live propagation of item availability. When stock changes, every client instantly sees the update via WebSockets (`Socket.IO`).
- **Atomic Concurrency Protection**: Designed to withstand high-volume, simultaneous checkouts. It uses strict PostgreSQL database row-level locking (`SELECT ... FOR UPDATE`) inside transactions to completely eliminate race conditions and overselling.
- **Cart Reservations & TTL Expiration**: Users can momentarily "reserve" an item, holding it for 60 seconds. If the purchase isn't finalized in time, a cleanly optimized sweeper releases the reservation, restoring availability to the public pool.
- **Modern URL-Based Pagination**: Lightweight frontend pagination bounds directly to the native Browser History API (`?page=x`), allowing robust deep linking and browser back/forward routing without massive client-side router packages. Features a scalable pagination bar with active page mapping and ellipsis indicators. 
- **Seamless Drop Creation**: Built-in dashboard forms to securely initialize new products and push their existence instantly to the catalog.
- **Live Activity Feed**: Real-time broadcasts capture and display recent purchaser activity underneath product cards intuitively.
- **Exceptional UX Context**: Employs elegant skeleton loading states, detailed error fallbacks, and toast notifications to guarantee a fluid shopping experience.
- **Centralized State Management**: Driven heavily by `Zustand` to manage complex client interactions without bloated prop-drilling or Context cascades.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Zustand, Socket.io-client
- **Backend**: Node.js, Express, TypeScript, Socket.io, Sequelize
- **Database**: PostgreSQL

## Project Structure

```text
stock-sync/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── .env.example
└── frontend/
    └── src/
        ├── components/
        ├── hooks/
        ├── services/
        └── types/
```

## Environment Setup

### Backend

Copy `backend/.env.example` to `backend/.env`:

```bash
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stock_sync
CORS_ORIGIN=http://localhost:5173
RESERVATION_TTL_SECONDS=60
```

Create PostgreSQL database:

```bash
createdb stock_sync
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env` and adjust the values for your backend:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

The frontend reads these values from Vite env variables, so components and hooks should use the shared API/service layer instead of hardcoding URLs.



## Run Locally

**Backend:**

```bash
cd backend
pnpm install
pnpm dev
```

**Frontend:**

```bash
cd frontend
pnpm install
pnpm dev
```

## API Resources & Realtime Events

### Rest Endpoints
- `POST /api/drops` - Create a new merchandise release
- `GET /api/drops` - Fetch paginated item listings
- `POST /api/reserve` - Request to secure checkout slot for an item
- `POST /api/purchase` - Finalize order transaction

### WebSocket Channels
- `stock-updated`: `{ dropId, availableStock, reserved }`
- `reservation-expired`: `{ dropId, userId }`
- `purchase-complete`: `{ dropId, username }`
- `drop-created`: Broadcasted when new drops launch mid-session

## Architecture Details

### 60-Second Expiration Logic
- Reservation records fundamentally store an `expiresAt` timestamp.
- Interrupted or abandoned transactions are routinely flagged.
- An asynchronous cleanup releases the reservations, restores core stock balances, and broadcasts an instantaneous update schema to clients watching the interface to visually untoggle the holding states.

### Oversell Prevention Model
- The complete reservation sequence triggers an encapsulated transaction layer.
- Relevant product entries are strictly locked (`UPDATE` lock semantics) upon querying, halting incoming overlapping requests temporarily.
- Reservation instantiation and stock derivation happen concurrently in parallel blocks. 
- Transactions dynamically roll back throwing specific `SOLD_OUT` constraints securely.

## Demo Verification Checklist

- [ ] Open two distinct browser sessions side-by-side.
- [ ] Attempt a purchase reservation in **Window A** and visually confirm the active reduction in **Window B** live.
- [ ] Flood a reservation query on an item matching max-capacity logic, and witness rejection parameters seamlessly.
- [ ] Allow a reservation timeframe to strictly deplete (60sec) and monitor the automated recovery metric pinging back on both sessions.
- [ ] Page forward/backward through pages and confirm correct persistent URL queries mapping seamlessly alongside history transitions!
