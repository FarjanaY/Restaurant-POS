# Production Deployment — From Scratch

This app is three pieces that each need a different home:

| Piece | What it is | Where it goes | Why |
|---|---|---|---|
| Database | MongoDB | MongoDB Atlas (free tier) | Managed, reachable from anywhere |
| Backend | Express + Socket.IO | Render (or Railway/Fly.io) | Needs a persistent Node process + raw TCP to MongoDB — **not** Cloudflare-Workers-compatible |
| Frontend | Vite/React static build | Cloudflare Workers (static assets) | Exactly what Cloudflare's edge is built for |

Cloudflare Workers run on V8 isolates, not Node.js — they can't run `app.listen()`, Mongoose's TCP-based MongoDB driver, or a `socket.io` server. Trying to deploy the `backend/` folder there is why a Workers deploy of this whole repo shows nothing. Only `frontend/` goes to Cloudflare.

---

## 1. MongoDB Atlas (database)

1. Sign up / log in at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0** cluster (any region close to your Render region).
3. **Database Access** → add a database user (username + password — save these).
4. **Network Access** → add IP `0.0.0.0/0` ("allow from anywhere") — Render's IPs aren't static, so this is the simplest option for a small project.
5. **Connect** → "Drivers" → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/restaurant_pos?retryWrites=true&w=majority
   ```
   Make sure the database name (`restaurant_pos` here) is included before the `?`.

---

## 2. Backend on Render

1. Sign up / log in at [render.com](https://render.com), connect your GitHub account.
2. **New → Web Service**, pick this repo.
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free is fine to start
4. **Environment** tab — add these variables:
   | Key | Value |
   |---|---|
   | `MONGO_URI` | the Atlas connection string from step 1 |
   | `JWT_SECRET` | any long random string (e.g. generate with `openssl rand -hex 32`) |
   | `CLIENT_ORIGIN` | your Cloudflare frontend URL — you won't have this yet on the first deploy, use a placeholder like `https://restaurant-pos.pages.dev` and come back to fix it once the frontend is live |
   | `STRIPE_SECRET_KEY` | a Stripe test key, or leave the placeholder — card payments will just fail gracefully until it's real |

   Render sets `PORT` itself; the code already reads `process.env.PORT`, so don't set it manually.
5. Deploy. Once live, note the URL Render gives you, e.g. `https://restaurant-pos-api.onrender.com`.
6. Sanity check: visit `https://restaurant-pos-api.onrender.com/api/health` — you should get a JSON response, not an error page.

---

## 3. Frontend on Cloudflare (Workers static assets)

The repo already has `frontend/wrangler.toml` and `frontend/public/_redirects` set up for this.

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Workers**, connect this GitHub repo (or use the existing `restaurant-pos` service you already created).
2. Build settings:
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Deploy command**: leave as the default (Cloudflare will use `wrangler deploy`, which reads `frontend/wrangler.toml` and serves `./dist`)
3. **Settings → Variables and Secrets** (make sure you're editing the **Build** variables, not just runtime ones) — add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://restaurant-pos-api.onrender.com/api` (your Render URL + `/api`) |
   | `VITE_SOCKET_URL` | `https://restaurant-pos-api.onrender.com` (same host, no `/api`) |

   These are read by Vite **at build time** (`import.meta.env.VITE_API_URL` gets inlined into the JS bundle) — setting them only as runtime env vars does nothing. If you change them, you must trigger a new build.
4. Deploy. Once live, copy the `*.workers.dev` URL (or your custom domain).
5. Go back to Render and update `CLIENT_ORIGIN` to that real frontend URL, then let Render redeploy — this is what the Socket.IO CORS check uses (`backend/src/server.js`), so KDS/live-settings updates won't connect until it matches.

---

## Troubleshooting "nothing shows"

- **Totally blank page, no errors in dashboard build log**: almost certainly the backend was deployed to Workers instead of Render — check the Root Directory setting is `frontend`, not the repo root.
- **Page loads but every API call fails / infinite spinner**: `VITE_API_URL` wasn't set (or wasn't set as a *build* variable) before the last build — fix it and redeploy.
- **Client-side routes 404 on refresh** (e.g. reloading on `/admin`): confirms `not_found_handling = "single-page-application"` in `wrangler.toml` isn't being picked up — check the Root Directory matches where `wrangler.toml` lives (`frontend`).
- **Socket features (KDS live updates, Store Settings broadcast) silently don't work**: `CLIENT_ORIGIN` on Render doesn't match the real Cloudflare URL — update it and redeploy the backend.
