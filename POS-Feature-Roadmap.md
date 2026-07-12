# Restaurant POS — Feature Roadmap

**Target:** Cafe / QSR hybrid (counter ordering + some table seating)
**Platform:** Web app (React + Node), running on tablets/desktops in-store
**Approach:** Phased — ship a lean MVP, then layer on operations and growth features.

---

## Guiding Principles

1. **Speed of order entry beats feature count.** Every extra tap costs throughput at the counter.
2. **The POS is half the system — the kitchen is the other half.** Plan the order → kitchen → fulfillment flow from day one.
3. **Offline resilience matters.** A cafe can't stop taking orders because Wi-Fi dropped. Design for local-first even if you add it in Phase 2.
4. **One order model, many channels.** Counter, table, and (later) online/delivery should all produce the same order object feeding one kitchen queue.
5. **Build the data model right early** — Menu, Item, Modifier, Order, OrderLine, Payment. Hard to change later.

---

## Phase 1 — MVP (Get it taking orders and money)

The minimum to actually run a shift. Aim to ship this first.

### Order Management

- [ ] Menu display with categories (drinks, food, sides, etc.)
- [ ] Add items to an order (cart)
- [ ] **Modifiers & options** — size, milk type, extra shot, no sugar, add/remove ingredients
- [ ] Quantity adjust, remove line, clear order
- [ ] **Order type toggle** — dine-in vs takeaway (drives tax/reporting and kitchen routing)
- [ ] Order notes / special instructions
- [ ] Order number / token generation for pickup
- [ ] Hold / recall an open order

### Payments

- [ ] Cash (with change calculation)
- [ ] Card / contactless (integrate a processor — Stripe Terminal, Square, or local gateway)
- [ ] Split payment across tenders
- [ ] Print or show digital receipt
- [ ] Void / refund a transaction

### Kitchen Flow

- [ ] **Kitchen Display System (KDS)** — orders appear on a kitchen screen in real time
- [ ] Mark items/orders as in-progress and done ("bump")
- [ ] Order timers (how long since placed)

### Basics

- [ ] Menu & price management (admin screen to add/edit items, categories, modifiers)
- [ ] Basic tax handling
- [ ] Simple daily sales total / end-of-day summary

---

## Phase 2 — Operations (Run the business, not just the register)

Once orders and payments work, make it a real business tool.

### Staff & Security

- [ ] User accounts with **roles** (cashier, barista, manager, admin)
- [ ] PIN/login per staff, clock-in/out
- [ ] Permission gating (only managers can void, refund, discount, edit menu)
- [ ] Cash drawer management — opening float, cash counts, reconciliation

### Table & Hybrid Service

- [ ] Simple table/seat assignment for the dine-in side
- [ ] Assign order to a table, add items later, close the tab
- [ ] Move / merge / split tabs

### Menu Intelligence

- [ ] **Combos / meal deals** (item + side + drink bundle pricing)
- [ ] **Dayparting** — breakfast menu auto-switches to lunch by time
- [ ] Item availability / **86-ing** (mark sold-out items unavailable)
- [ ] Upsell prompts ("add a pastry?")

### Discounts & Promotions

- [ ] Percentage and fixed discounts
- [ ] Coupon / promo codes
- [ ] Happy-hour / time-based pricing

### Reporting

- [ ] Sales by day/hour, product mix (best/worst sellers)
- [ ] Payment method breakdown
- [ ] Staff sales performance
- [ ] Exportable reports (CSV)

### Resilience

- [ ] **Offline mode** — queue orders locally (IndexedDB/PWA), sync when back online
- [ ] Local-first order persistence so a refresh/crash never loses an open order

---

## Phase 3 — Growth (Multi-channel & customer relationships)

Add these once the core is solid and you want to scale revenue.

### Customer-Facing Channels

- [ ] **Self-order kiosk mode** — a customer-facing build of the same menu (proven to raise average check size)
- [ ] **Online ordering** — web ordering page for pickup
- [ ] **QR-code table ordering** — customer scans, orders from their phone, feeds same kitchen queue
- [ ] **Delivery aggregator integration** — Uber Eats / DoorDash / local platforms into one queue

### Customer & Loyalty

- [ ] Customer profiles (phone/email)
- [ ] **Loyalty / points program** and rewards redemption at POS
- [ ] Order history and one-tap reorder
- [ ] Targeted offers / digital receipts with marketing

### Inventory

- [ ] Ingredient-level stock tracking (recipe → deducts stock on sale)
- [ ] Low-stock alerts and auto-86
- [ ] Waste tracking
- [ ] Supplier / purchase orders

### Advanced

- [ ] Multi-location support (central menu, per-store config)
- [ ] Tips management and distribution
- [ ] Analytics dashboard (speed-of-service, peak-hour forecasting)
- [ ] Accounting integration (QuickBooks/Xero)

---

## Recommended Tech Stack (Web POS)

| Concern        | Recommendation                                       | Why                                        |
| -------------- | ---------------------------------------------------- | ------------------------------------------ |
| Frontend       | **React** + TypeScript, Vite                         | Fast, component-driven, huge ecosystem     |
| UI             | Tailwind CSS + a component lib (shadcn/ui)           | Speed; touch-friendly layouts              |
| Offline        | **PWA** + IndexedDB (Dexie.js)                       | Local-first orders, installable on tablets |
| State          | Zustand or Redux Toolkit                             | Predictable order/cart state               |
| Backend        | **Node.js** (NestJS or Express) + TypeScript         | Same language front/back                   |
| Database       | **PostgreSQL**                                       | Relational integrity for orders/payments   |
| Realtime (KDS) | WebSockets (Socket.IO)                               | Push orders to kitchen screens instantly   |
| Payments       | Stripe Terminal / Square / local gateway             | PCI-compliant, don't roll your own         |
| Auth           | JWT + role-based access                              | Staff roles & permissions                  |
| Hosting        | Local server + cloud sync, or cloud with offline PWA | Resilience during outages                  |

> **Payments warning:** never store or handle raw card data yourself. Always use a certified processor/gateway (Stripe, Square, Adyen, or a local PCI-compliant provider). This is a legal/compliance requirement, not a preference.

---

## My Recommendation on Scope

**Start with Phase 1 only.** For a cafe/QSR hybrid, the fastest path to something real is:

> Menu → cart with modifiers → order type toggle → payment → KDS → receipt.

Get that running end-to-end on a tablet before touching inventory, loyalty, or multi-channel. Those Phase 2/3 features are valuable but they multiply complexity, and you'll design them better once you've watched the core flow work in a real shift.

**Data model to lock in early** (hardest to change later):
`MenuItem`, `ModifierGroup` / `Modifier`, `Category`, `Order`, `OrderLine` (with selected modifiers + price snapshot), `Payment`, `User`/`Role`.

---

*Next step suggestion: I can scaffold the Phase 1 project structure (React + Node + Postgres), or start with the data model and a working menu → cart → order flow. Let me know which and I'll begin.*
