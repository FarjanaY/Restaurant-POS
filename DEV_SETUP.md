# Local Dev Setup — Credentials & Commands

Everything needed to run this project locally. All credentials here are **dev-only placeholders** (already flagged as such in `seed.js` and never committed to git — `.env` is gitignored). Never put real production secrets in this file.

---

## Prerequisites

- Node.js 24.x (`.nvmrc` not set — check with `node -v`)
- MongoDB running locally on the default port (`mongodb://127.0.0.1:27017`)

---

## Environment files

Copy the example files once per machine (already done if you're reading this on a machine that's run the project before):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_pos
JWT_SECRET=change-me-in-production
CLIENT_ORIGIN=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

`STRIPE_SECRET_KEY` is a placeholder — card payments (Stripe Terminal) will fail gracefully with a clear error until this is a real Stripe test-mode key. See NEXT_STEPS.md Step 14.

**`frontend/.env`**

```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

---

## Install dependencies

```bash
cd backend && npm install
cd frontend && npm install
```

---

## Seed the database

Populates tax categories + VAT rates, a sample menu (Drinks/Food categories, Latte + Cold Sandwich with modifier groups), and dev staff logins. Safe to re-run — upserts, no duplicates.

```bash
cd backend
npm run seed
```

### Dev staff PINs (seeded by the command above)

| Name         | Role    | PIN    |
| ------------ | ------- | ------ |
| Alex Admin   | admin   | `1111` |
| Cara Cashier | cashier | `2222` |
| Kyle Kitchen | kitchen | `3333` |
| Sam Manager  | manager | `4444` |

Log in with just the PIN on the app's login screen — no username needed (matches FR6.2's fast user-switching intent).

---

Discount Cupons test codes:
WELCOME10 (10% off)
SAVE5 (€5 off).

## Run the app

**Option A — one command:**

```bash
./start-dev.sh
```

Starts both servers, waits for the backend's health check to pass, and prints both URLs. Ctrl+C _should_ stop both, but signal delivery to a backgrounded npm/nodemon/vite process tree is unreliable on Windows/Git Bash (verified — even a direct `SIGTERM` to the script's own PID didn't trigger its cleanup). If Ctrl+C doesn't fully stop things, run:

```bash
./stop-dev.sh
```

This force-stops whatever is listening on ports 4000/5173/5174 by querying `netstat` directly, rather than relying on signals — reliable regardless of what spawned the process.

**Option B — two terminals** (if you want each server's logs in its own window):

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Then open **http://localhost:5173** and log in with one of the PINs above.

- **Register** (`/`) — counter ordering, cashier/manager/admin roles
- **Kitchen** (`/kds`) — live order queue, kitchen/manager/admin roles
- **Admin** (`/admin`) — menu management (admin only) + daily summary (admin/manager)

Health check: `curl http://localhost:4000/api/health`

---

## Tests & linting

```bash
# Backend — 46 tests, uses an in-memory MongoDB (no real DB needed)
cd backend
npm test
npm run lint

# Frontend
cd frontend
npm run lint
npm run build
```

---

## Useful one-off commands

**Reset orders/counters** (keeps menu + staff, wipes transactional data — useful after load-testing or demo runs):

```bash
cd backend
node -e "
import('dotenv/config').then(async () => {
  const mongoose = (await import('mongoose')).default;
  const { connectDB } = await import('./src/config/db.js');
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos');
  await mongoose.connection.collection('orders').deleteMany({});
  await mongoose.connection.collection('counters').deleteMany({});
  console.log('cleared orders and counters');
  await mongoose.disconnect();
});
"
```

**Log in via API (get a JWT without the UI)**, e.g. for curl testing:

```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"2222"}'
```

---

## Ports & processes

If a dev server won't start on its usual port (5173/4000), something is likely still holding it from a previous run. Easiest fix:

```bash
./stop-dev.sh
```

Or manually:

```bash
netstat -ano | grep ":5173 " | grep LISTENING
taskkill //F //PID <pid>
```

The Socket.IO KDS connection depends on the frontend actually running on the port the backend's `CLIENT_ORIGIN` (`.env`) allows — a port mismatch (e.g. frontend silently falling back to 5174) breaks realtime KDS updates via CORS with no obvious error on the surface. Check the browser console for CORS errors if the kitchen screen isn't updating live.
