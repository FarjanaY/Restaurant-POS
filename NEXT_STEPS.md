# Next Steps — Phase 1 Build Order

Scaffolding (Phase 0) is done. This is the **ordered** sequence to actually build Phase 1 — each step depends on the one before it, so work top to bottom rather than jumping around. This is a build-sequence view; [DEVELOPMENT_CHECKLIST.md](DEVELOPMENT_CHECKLIST.md) remains the full feature checklist per phase.

Check items off as we complete them. Current position: **Step 1**.

---

### Step 1 — Seed data: Tax categories & VAT rates ✅
- [x] Seed script (`backend/src/seed.js`) for `TaxCategory` (hot_food, cold_food, soft_drink, alcohol)
- [x] Seed `VatRate` rows — placeholder Irish rates (23% / 13.5% / 0%), `effectiveFrom` = today, flagged as "confirm with accountant before go-live"

*Why first: the VAT resolver (Step 2) and every order calculation after it needs real rate rows to test against.*

### Step 2 — VAT resolver service ✅
- [x] `backend/src/services/vatService.js` — `resolveVatRate(taxCategoryId, orderType, atDate)` against effective-dated `VatRate` rows
- [x] Unit tests (`vatService.test.js`, in-memory Mongo via `mongodb-memory-server`): dine-in vs takeaway differ, historical rate resolves correctly, throws when no rate matches

### Step 3 — Order total calculation service ✅
- [x] `backend/src/services/orderTotals.js` — given cart lines + modifiers, compute unit price, line total, VAT (net/gross split), subtotal, VAT total, grand total
- [x] Unit tests (`orderTotals.test.js`, stubbed VAT resolver — no DB needed) against the PRD example (€5.00 sandwich: dine-in vs takeaway VAT split), modifiers/quantity, and discount handling

### Step 4 — Menu API (read side) ✅
- [x] Controller (`controllers/menuController.js`) + `GET /api/menu` — categories with nested active items and their modifier groups; `GET /api/menu/modifier-groups`
- [x] Sample menu seed data (categories, modifier groups, menu items) added to `seed.js` for manual/integration testing
- [x] Manually verified via curl against seeded data; automated integration test (`routes/menu.test.js`) covers active-only filtering and modifier-group population

### Step 5 — Menu admin API (write side) ✅
- [x] CRUD controllers for `Category`, `MenuItem`, `ModifierGroup`/`Modifier`
- [x] New `routes/admin.js` — `/api/admin/categories`, `/menu-items`, `/modifier-groups` (list/create/update/delete), gated by `requireAuth` + `requireRole('admin')`
- [x] Integration tests (`admin.test.js`): 401 with no token, 403 for non-admin role, full create/update/delete lifecycle per resource

### Step 6 — Auth ✅
- [x] Seed dev staff (`Alex Admin`/1111, `Cara Cashier`/2222) with hashed PINs in `seed.js` — dev-only, flagged as such
- [x] `POST /api/auth/login` — PIN-only login (iterates active users, bcrypt-compares), issues JWT with `sub`/`role`/`name`
- [x] Confirmed end-to-end: real login token unlocks `/api/admin/categories` in an integration test and manually via curl against the local dev DB

### Step 7 — Orders API (core flow) ✅
- [x] `POST /api/orders` — create order from cart, resolves menu items/modifiers server-side, uses Step 2/3 services, assigns a sequential token number (`Counter` model, atomic `$inc`), idempotent via `clientOrderId`
- [x] `GET /api/orders` (filter by status) + `GET /api/orders/:id` — needed for hold/recall to actually list/find held orders
- [x] `PATCH /api/orders/:id` — edit lines, hold (`status: held`), recall (`status: open`); changing type/discount alone recomputes VAT off the existing lines without resending the cart; blocked once an order is no longer open/held
- [x] `POST /api/orders/:id/void` — blocked for already-voided or paid orders
- [x] Gated to admin/manager/cashier roles (kitchen has no REST order access — that's the KDS socket in Step 9)
- [x] Improved `errorHandler` to map Mongoose `ValidationError`/`CastError` to 400 instead of 500 (benefits every write endpoint, not just orders)

### Step 8 — Payments API (cash first) ✅
- [x] `POST /api/orders/:id/payments` — cash tender + change calculation; a tender covering less than the remaining balance is a split-tender leg (no change), completing tenders trigger change + `status: paid`
- [x] Card method wired to a `501` placeholder pending Step 14 (Stripe Terminal)
- [x] Order+payment write is already atomic — payments are embedded on the Order document, not a separate collection, so no multi-doc transaction is needed; added `optimisticConcurrency` on the Order schema instead to guard against two concurrent requests silently clobbering each other (mapped to 409 in `errorHandler`)
- [x] Verified the PRD acceptance example exactly: €10 tendered on a €7.30 order → €2.70 change

### Step 9 — KDS realtime wiring ✅
- [x] `sockets/kds.js` exports `emitOrderNew`/`emitOrderUpdated` helpers (no-op if no socket server is attached, e.g. in route tests that import `app.js` directly)
- [x] Wired `emitOrderNew` into the payment-completion path — per PRD FR3.1, the kitchen sees an order once it's **paid/confirmed**, not while the cashier is still building or holding it. Traced through the current business rules: `updateOrder`/`voidOrder` can only ever touch pre-payment orders (both are blocked once `status` leaves open/held), so there's no real caller for `order:updated`/`order:bumped` yet — bump specifically needs an "in-progress/completed" status model and a KDS-initiated action, which belongs with the KDS screen itself in Step 13, not stubbed speculatively here
- [x] Verified with a real Socket.IO server + `socket.io-client` in-process: a connected `/kds` client receives nothing on order creation, then receives `order:new` the moment the order is paid

### Step 10 — Frontend: Menu → Cart ✅
- [x] `menuSlice` (RTK async thunk) fetches `GET /api/menu`, registered in the store
- [x] Menu screen — category tabs, tap-to-add; items without modifiers add directly, items with modifier groups open `ModifierPicker`
- [x] `ModifierPicker` — single-select (radio-like, `maxSelect: 1`) and multi-select (checkbox-like, up to `maxSelect`) groups, respects `minSelect`/`required` to gate the confirm button, shows live unit price
- [x] Cart panel — quantity +/-, remove, clear, running gross total, wired into the existing `cartSlice` (no changes needed there)
- [x] Verified in a real browser via a Playwright script (`chromium` headless): menu loads, Cold Sandwich (no modifiers) adds directly, Latte opens the picker, Regular+Oat selections compute €4.00 correctly, cart total €9.00, zero console errors

### Step 11 — Frontend: Order type, notes, hold/recall ✅
- [x] **Prerequisite (not originally scoped, but required):** frontend PIN login — `authSlice` + `LoginScreen`, JWT persisted to `localStorage`, `apiClient` attaches it via a request interceptor, `App.jsx` gates the whole app on being logged in and shows the staff name/role + logout in the nav
- [x] **Prerequisite (not originally scoped, but required):** added an order-level `notes` field to the `Order` model/controllers (only per-line notes existed before) — needed for FR1.5's "per line and/or per order" instructions
- [x] Dine-in/takeaway toggle in `cartSlice`'s existing `orderType`, wired to a segmented control in the cart panel
- [x] Special instructions — per-line notes input (`lineNotesChanged`) and an order-level notes textarea (`orderNotesChanged`)
- [x] Hold & recall — `ordersSlice` (`holdOrder`, `fetchHeldOrders`, `recallOrder`) + `HeldOrdersPanel`; holding does create-then-`PATCH held` (or just `PATCH held` if recalling an already-existing order), recalling does `PATCH open` then hydrates the cart via a new `cartHydrated` reducer
- [x] Verified in a real browser via Playwright: wrong PIN shows the actual backend error message (a real bug caught by testing — `authSlice` was surfacing axios's generic "Request failed with status 401" instead of the API's "Invalid PIN"; fixed via `rejectWithValue`), correct PIN logs in, order type/line notes/order notes all survive a hold → recall round trip intact, zero unexpected console errors

### Step 12 — Frontend: Payment (cash first) ✅
- [x] `ordersSlice.sendOrder` — syncs the cart to a server-side order on "Charge" (create if new, PATCH if recalled); `addPayment` posts a cash tender
- [x] `PaymentPanel` — shows the server-authoritative subtotal/VAT/total (not the cart's gross-only estimate), tendered-amount input, remaining balance (supports repeat split-tender submits)
- [x] `Receipt` (rendered once `order.status === 'paid'`) — itemized lines with modifiers, VAT breakdown, tendered/change; "New Order" clears the cart
- [x] Verified in a real browser end-to-end: Charge → tender €10 on a €5.00 order → receipt shows €5.00 change → New Order resets to an empty cart, zero console errors (the exact €10-on-€7.30-→-€2.70 PRD figure is already covered by the Step 8 backend tests, which do use €7.30)

### Step 13 — Frontend: KDS screen ✅
- [x] **Backend (deferred from Step 9):** bump implemented as REST endpoints, not raw socket commands — `PATCH /api/orders/:id/lines/:lineId` (per-item done, gated `admin`/`manager`/`kitchen`) and `POST /api/orders/:id/complete` (whole-order bump → `status: completed`), both emitting `order:updated` afterward via the existing `emitOrderUpdated` helper. Chose REST over `socket.on('order:bump', ...)` so bump actions get the same auth/role/error-handling middleware as every other mutation, rather than an unauthenticated parallel command channel
- [x] `orders.js` route roles split per-endpoint (`READ_ROLES` includes `kitchen`; register mutations stay `admin`/`manager`/`cashier`; bump endpoints are `admin`/`manager`/`kitchen`) — previously the whole router was gated to register roles only, which would have locked kitchen out entirely
- [x] Added a `kitchen`-role dev seed user (`Kyle Kitchen` / PIN 3333) so this is actually testable
- [x] `KdsPage` — initial `GET /api/orders?status=paid` fetch, then `/kds` socket for live `order:new`/`order:updated`; per-line checkbox (done), whole-ticket "Bump" button, elapsed-time label with color escalation (green <5min, yellow 5–10min, red 10min+), "Recently Completed" sidebar (last 10, in-memory)
- [x] Verified with two concurrent browser sessions (cashier + kitchen): a cashier's payment makes the order appear on the kitchen screen **without any reload**, and bumping moves it to Recently Completed **without any reload** — confirmed via explicit timing (no interval/refresh fired in the window) rather than assumed
- [x] **Real bug caught by this testing, not assumed fixed:** the KDS socket connection was silently CORS-blocked because a stray leftover dev-server process was squatting on port 5173, pushing the actual frontend to 5174 while the backend's `CLIENT_ORIGIN` default only allows 5173. First test run showed order updates appearing to work, which turned out to be misleading — a follow-up run with explicit diagnostics (clean DB state, predictable token numbers, checking for CORS errors) confirmed the failure, then confirmed the fix

### Step 14 — Stripe Terminal integration ✅ (code complete; hardware/reader flow unverifiable without a real Stripe account)
- [x] Backend: `services/stripeService.js` (connection token, PaymentIntent create/retrieve) + `POST /api/orders/:id/card-intent` (creates a PaymentIntent for the remaining balance) + `POST /api/terminal/connection-token` (boots the Terminal SDK)
- [x] `paymentsController`'s card branch **independently re-verifies the PaymentIntent against Stripe** (`status === 'succeeded'`, actual `amount_received`) before recording a payment — never trusts the client's word that a card payment succeeded
- [x] `createPaymentsController()` factory takes injectable Stripe functions (same DI pattern as `computeOrderTotals`'s `resolveRate`) so the verification logic (success, wrong status, missing intent) is unit-tested (`cardPayments.test.js`) without ever calling the real Stripe API
- [x] Frontend: `stripeTerminal.js` wraps `@stripe/terminal-js` (connect to Stripe's test-mode **simulated** reader, collect + process payment); `PaymentPanel` gets a Cash/Card tab, calling `createCardIntent` → Terminal SDK → `confirmCardPayment`
- [x] **Cannot be verified end-to-end** — the Terminal SDK's `discoverReaders`/`connectReader`/`collectPaymentMethod` calls hit Stripe's real API even in test mode, and this environment has no Stripe account (`.env.example`'s `STRIPE_SECRET_KEY` is a placeholder). What **was** verified in a real browser: the graceful-failure path — clicking "Charge Card" without real credentials fails with a clear on-screen error (`onFetchConnectionToken` failure), zero uncaught exceptions, and the register stays fully usable (switched back to Cash and kept working). Full verification requires a real Stripe test account; see PRD §11 "Remaining to confirm before go-live"
- [x] Noted: `@stripe/terminal-js` pulls in a `ws` version with a known high-severity DoS advisory (`GHSA-96hv-2xvq-fx4p`); left as-is since the vector requires acting as a WebSocket *server*, which doesn't apply to this browser-side SDK usage, and the only fix (`npm audit fix --force`) downgrades to an old 0.8.0 release

### Step 15 — Admin UI + EOD summary ✅
- [x] Backend: `GET /api/reports/daily-summary` (admin/manager only) — order count, total sales, tax collected, tender breakdown, scoped to orders `closedAt` within a UTC day (accepts `?date=`); voided orders excluded automatically since they never reach `paid`. Noted as UTC-only for now — real Europe/Dublin timezone handling is a pre-go-live item, same caveat as the VAT rates
- [x] Backend: read-only `GET /api/admin/tax-categories` so the menu-item form has something to populate its tax-category dropdown with (full VAT-rate CRUD stays out of scope — a bigger feature tied to the Ireland compliance work, not Phase 1 menu admin)
- [x] Frontend: `AdminPage` tabs — Categories, Menu Items, Modifier Groups, Daily Summary — each its own component doing direct CRUD via `apiClient` (no Redux slice; consistent with `KdsPage`'s precedent for page-local, not-shared-elsewhere data)
- [x] Verified in a real browser as admin: created a category, a modifier group (with two priced options), and a menu item referencing both — the new item appeared **live** on the Register page's menu under its category; Daily Summary correctly reflected two paid test orders (€10.00 total, €0.59 tax, €10.00 cash) with zero console errors

### Step 16 — Phase 1 exit check
- [ ] Run through PRD §3.3 acceptance criteria and §3.4 exit criteria end-to-end
- [ ] Simulated 50+ order shift, confirm zero data loss

---

*When a step is done, say so and we'll move to the next one. If priorities change, we can reorder remaining steps.*
