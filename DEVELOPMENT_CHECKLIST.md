# Development Checklist / Deliverables — Restaurant POS

Task-level breakdown of [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md). Check items off as they're completed. Each phase's "Deliverable / Definition of Done" mirrors the exit criteria in [PRD.md](PRD.md).

---

## Phase 0 — Project Setup

- [ ] Init monorepo (`backend/`, `frontend/`)
- [ ] Backend: Express app skeleton, env config, MongoDB connection (Mongoose)
- [ ] Frontend: Vite + React scaffold, Tailwind configured, Redux Toolkit store wired
- [ ] ESLint + Prettier for both workspaces
- [ ] `.env.example` for both (Mongo URI, JWT secret, Stripe keys)
- [ ] Git repo initialized, initial commit
- [ ] Basic CI (lint + test on push)

---

## Phase 1 — MVP: Core POS

### Backend

- [ ] Mongoose models: `Category`, `MenuItem`, `ModifierGroup`, `TaxCategory`, `VatRate`, `Order`, `User`
- [ ] VAT resolver service: `(taxCategoryId, orderType) -> rate` against effective-dated `VatRate` rows
- [ ] Order total calculation service (subtotal, per-line VAT, discount, total)
- [ ] `POST /api/orders` — create order from cart, computes VAT per line
- [ ] `PATCH /api/orders/:id` — edit lines, hold, recall
- [ ] `POST /api/orders/:id/payments` — cash tender + change calc, split tender support
- [ ] Stripe Terminal integration — PaymentIntents flow for card/contactless
- [ ] `POST /api/orders/:id/void` — void unpaid order
- [ ] Receipt generation — thermal print payload + digital (email/QR) with VAT breakdown
- [ ] Admin CRUD endpoints: categories, menu items, modifier groups, modifiers
- [ ] `GET /api/reports/daily-summary` — totals, order count, tax collected, tender breakdown
- [ ] Socket.IO `/kds` namespace: emit `order:new`, `order:updated`, `order:bumped`
- [ ] Sequential token/order number generator

### Frontend

- [ ] Menu screen — categories + items, tap-to-add
- [ ] Cart / order builder — modifiers (single & multi-select, required/optional, min/max), quantity, remove, clear
- [ ] Order type toggle (dine-in / takeaway) wired to VAT + kitchen ticket label
- [ ] Special instructions (line + order level)
- [ ] Hold & recall UI
- [ ] Payment screen — cash (tendered/change), Stripe Terminal card flow, split tender
- [ ] Receipt view/print trigger
- [ ] KDS screen — real-time order feed, item/order bump, elapsed-time timer with color escalation, "recently completed" view
- [ ] Admin menu management UI (CRUD categories/items/modifiers, active toggle, reorder)
- [ ] EOD summary view

### Deliverable / Definition of Done (Phase 1)

- [ ] A full order can be taken, paid (cash and card), sent to kitchen, and completed with zero errors
- [ ] Admin can fully manage the menu without developer intervention
- [ ] Simulated shift of 50+ orders runs with no data loss
- [ ] Adding "Large Latte, oat milk, extra shot" takes ≤ 4 taps with correct price
- [ ] Order appears on KDS within 1 second (same network)
- [ ] Cash payment of €10 on a €7.30 order shows €2.70 change
- [ ] EOD totals reconcile against the sum of individual transactions

---

## Phase 2 — Operations

### Backend

- [ ] `User` roles (admin/manager/cashier/kitchen) + PIN auth + JWT
- [ ] Role-gating middleware for void/refund/discount/price-override/menu-edit actions
- [ ] `Shift` model — clock-in/out, opening float, cash in/out, EOD reconciliation (expected vs counted, variance)
- [ ] Audit log for sensitive actions (voids, refunds, discounts, drawer opens)
- [ ] `Table` model + assign-order-to-table, split/merge/move tabs
- [ ] Combos/meal-deal pricing
- [ ] Dayparting — scheduled menu switch (e.g. breakfast -> lunch) by time
- [ ] 86-ing — mark item unavailable, greys out at POS
- [ ] `Discount`/`Promotion` models — % / fixed, promo codes, happy-hour time-based pricing
- [ ] Reporting endpoints: sales by day/hour/daypart, product mix, payment breakdown, staff performance, discount/void/refund report, CSV export
- [ ] Offline sync endpoint — idempotent order ingestion keyed by client UUID/token

### Frontend

- [ ] PIN login + fast user switching UI
- [ ] Manager-gated actions (void/refund/discount) prompt for PIN when current user lacks permission
- [ ] Drawer open/close + cash reconciliation UI
- [ ] Table/floor view — assign, add rounds, split/merge/move, open-tab overview
- [ ] Dayparting-aware menu rendering
- [ ] 86'd items greyed out
- [ ] Discount/promo entry at checkout
- [ ] Reports dashboard (sales, product mix, staff, payment methods) with CSV export
- [ ] Dexie (IndexedDB) local order store + sync queue; offline banner/indicator
- [ ] Service worker / PWA install support

### Deliverable / Definition of Done (Phase 2)

- [ ] Cashier without manager rights cannot complete a void without manager PIN
- [ ] EOD reconciliation correctly shows variance on a deliberately short drawer
- [ ] Disconnecting Wi-Fi mid-shift still allows placing/paying (cash) for orders; they appear on KDS after reconnect, zero lost orders
- [ ] Breakfast menu auto-hides at 11:00, lunch items appear
- [ ] Product-mix report matches a manually tallied test day
- [ ] Multiple staff can work a shift with correct attribution and permissions

---

## Phase 3 — Growth (build modules by priority, not necessarily in order)

- [ ] Self-order kiosk build (large touch targets, guided modifiers, upsell, multi-language toggle, accessibility)
- [ ] Online ordering page (pickup) — menu, cart, payment, order status page
- [ ] QR-code table ordering — scan -> order -> pay from phone -> same kitchen queue
- [ ] Delivery aggregator integration (Uber Eats/DoorDash) into unified queue
- [ ] Customer profiles + consent management (GDPR)
- [ ] Loyalty/points program — earn + redeem across POS/kiosk/online
- [ ] Order history + one-tap reorder
- [ ] `Ingredient`/`Recipe` models — auto-deduct stock on sale, low-stock alerts, auto-86
- [ ] Waste tracking, supplier/purchase orders
- [ ] Multi-location — central menu with per-location overrides, consolidated + per-store reporting, role scoping by location
- [ ] Tips capture and distribution
- [ ] Speed-of-service / peak-hour forecasting analytics
- [ ] Accounting integration (QuickBooks/Xero export/API)

### Deliverable / Definition of Done (Phase 3)

- [ ] At least one new customer channel (kiosk, QR, or online) live and feeding the same kitchen queue
- [ ] Loyalty earned and redeemed across channels
- [ ] Inventory depletes correctly from real sales and triggers low-stock alerts

---

## Compliance Checklist (Ireland — cross-cutting, verify before go-live)

- [ ] VAT rates & item -> tax-category mappings confirmed with Revenue Commissioners / accountant
- [ ] Business VAT registration number added to receipt templates
- [ ] Stripe Ireland account set up, business verified, payout bank linked
- [ ] Stripe reader model selected (Reader S700 vs BBPOS WisePOS E)
- [ ] Thermal printer model selected and driver integrated
- [ ] GDPR/DPA 2018: consent flags, data minimisation, access/erasure flow, retention policy documented
- [ ] Completed transactions confirmed immutable (no silent edit/delete path exists)
- [ ] Personal data encrypted at rest and in transit
