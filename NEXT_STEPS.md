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

### Step 7 — Orders API (core flow)
- [ ] `POST /api/orders` — create order from cart, uses Step 2/3 services, assigns token number
- [ ] `PATCH /api/orders/:id` — edit lines, hold, recall
- [ ] `POST /api/orders/:id/void`

### Step 8 — Payments API (cash first)
- [ ] `POST /api/orders/:id/payments` — cash tender + change calculation, split-tender support
- [ ] Wrap order+payment write in a MongoDB transaction

### Step 9 — KDS realtime wiring
- [ ] Order controller emits `order:new` / `order:updated` / `order:bumped` on the `/kds` Socket.IO namespace
- [ ] Manual test: create an order via API, confirm a connected socket client receives the event

### Step 10 — Frontend: Menu → Cart
- [ ] Menu screen fetching `GET /api/menu`, category tabs, tap-to-add
- [ ] Cart panel — modifiers (single/multi-select, required/min/max), quantity, remove/clear, wired into the existing `cartSlice`

### Step 11 — Frontend: Order type, notes, hold/recall
- [ ] Dine-in/takeaway toggle wired to VAT display
- [ ] Special instructions (line + order)
- [ ] Hold & recall UI hitting `PATCH /api/orders/:id`

### Step 12 — Frontend: Payment (cash first)
- [ ] Cash payment screen — tendered amount, change due
- [ ] Receipt view (screen only for now; print/Stripe come next)

### Step 13 — Frontend: KDS screen
- [ ] Connect to `/kds` socket namespace, render live order feed
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
