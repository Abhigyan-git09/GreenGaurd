# EcoSkeptic Backend Handover Document

Hello Claude! You are tasked with implementing the backend for **EcoSkeptic**, a production-ready Greenwashing Detector Platform. 

Another agent has already completed the full frontend architecture, design system, and UI. Your job is to build the Express.js backend, wire it up to a global cloud database, deploy it, and connect the existing frontend to your real APIs.

## 1. Project Architecture & Current State

The project exists in a monorepo structure:
```text
GreenGaurd/
├── frontend/ (✅ COMPLETE - Vite + React + Tailwind v4)
└── backend/  (🚀 YOUR TASK - Node.js + Express)
```

**Frontend Status:**
The frontend currently relies on mock data, mock authentication (`AuthContext.jsx`), and a `setInterval` simulated WebSocket (`App.jsx` and `LiveAlertFeed.jsx`). It has 3 main tabs:
1. **Scanner Center**: Users upload packaging or text. (Currently simulates ML).
2. **Offender DB**: A table showing verified greenwashing incidents.
3. **Analytics Telemetry**: Real-time charts utilizing Recharts.

---

## 2. Your Task: Backend Implementation

Please create the `backend/` directory and implement the following:

### A. Database & Global Hosting (Crucial Requirement)
The user explicitly wants the database and backend hosted globally on public services, NOT just locally.
*   **Database:** Provision a managed PostgreSQL database on a platform like **Supabase** or **Neon**.
*   **Backend Hosting:** Prepare the Node/Express backend to be deployed on **Render** or **Railway**.
*   **Schema:** You need to create tables for `users` (with roles), `incidents` (the scanned flags), and `audit_logs`.

### B. Authentication & RBAC
Implement JWT-based authentication. The system requires 3 distinct roles:
1.  **Consumer**: Can submit text/images to the scanner.
2.  **Auditor**: Can view the live WebSocket feed and click "Verify" or "Reject" on incoming flags.
3.  **Admin**: Full access, including deleting records from the database.
*(Pre-seed the database with mock accounts for these 3 roles).*

### C. The API Endpoints
*   `POST /api/auth/login`
*   `GET /api/incidents` (Fetch the verified database for the Offender DB tab)
*   `POST /api/incidents/:id/verify` (Auditor action)
*   `POST /api/incidents/:id/reject` (Auditor action)
*   `POST /api/scan` (The simulated ML engine. Accept text, parse it for greenwashing buzzwords like "Carbon-neutral", "Biodegradable", "Natural", and return a skeptic score and JSON bounding boxes).

### D. WebSocket Live Feed
Implement a WebSocket Server (`ws` or `Socket.io`). 
When a consumer hits the `/api/scan` endpoint, or via a simulated chron-job on the backend, emit a real-time event to connected Auditor clients so the `LiveAlertFeed.jsx` updates dynamically.

---

## 3. Frontend Integration Steps

Once your backend is running, you must modify the following files in `frontend/src/` to remove the mock data and connect to your server:

1.  **`frontend/src/context/AuthContext.jsx`**: Replace the hardcoded `login` function with a `fetch()` to your JWT endpoint. Store the token in `localStorage`.
2.  **`frontend/src/App.jsx`**: 
    *   Delete `INITIAL_INCIDENTS` and `STREAM_COMPANIES`.
    *   Add a `useEffect` to fetch real incidents from `/api/incidents` on load.
    *   Replace the `setInterval` mock live feed with a real WebSocket client connection to your backend URL.
    *   Update `handleVerifyClaim` and `handleRejectClaim` to send `POST` requests to your backend instead of just updating local React state.
3.  **`frontend/src/components/ScannerWorkspace.jsx`**: Update the `startVisionScan` function to send the `userText` to your `/api/scan` endpoint instead of relying on the local timeout.
4.  **`.env`**: Add `.env` files for both frontend (`VITE_API_URL`, `VITE_WS_URL`) and backend (`DATABASE_URL`, `JWT_SECRET`).

**Good luck, Claude! Build a robust, secure, and globally deployed backend to bring EcoSkeptic to life.**
