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

### Step 11 — Frontend: Order type, notes, hold/recall
- [ ] Dine-in/takeaway toggle wired to VAT display
- [ ] Special instructions (line + order)
- [ ] Hold & recall UI hitting `PATCH /api/orders/:id`

### Step 12 — Frontend: Payment (cash first)
- [ ] Cash payment screen — tendered amount, change due
- [ ] Receipt view (screen only for now; print/Stripe come next)

### Step 13 — Frontend: KDS screen
- [ ] Connect to `/kds` socket namespace, render live order feed
- [ ] Backend: bump needs an "in-progress"/"completed" status (or per-line done flag) plus a handler — deferred from Step 9 to build alongside the screen that actually drives it; likely a `socket.on('order:bump', ...)` handler in `sockets/kds.js` that updates the order and broadcasts `order:updated`/`order:bumped`
- [ ] Item/order bump actions, elapsed-time timer with color escalation

### Step 14 — Stripe Terminal integration
- [ ] Backend: PaymentIntents flow via Stripe Node SDK
- [ ] Frontend: card/contactless payment path alongside cash

### Step 15 — Admin UI + EOD summary
- [ ] Menu management screens (CRUD, active toggle, reorder)
- [ ] `GET /api/reports/daily-summary` + frontend EOD view

### Step 16 — Phase 1 exit check
- [ ] Run through PRD §3.3 acceptance criteria and §3.4 exit criteria end-to-end
- [ ] Simulated 50+ order shift, confirm zero data loss

---

*When a step is done, say so and we'll move to the next one. If priorities change, we can reorder remaining steps.*
