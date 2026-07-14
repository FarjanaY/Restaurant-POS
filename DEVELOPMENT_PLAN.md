# Development Plan — Restaurant POS

Derived from [PRD.md](PRD.md) and [POS-Feature-Roadmap.md](POS-Feature-Roadmap.md). This document translates those requirements into a concrete build plan for the chosen stack.

**Last updated:** 2026-07-12

---

## 1. Finalized Tech Stack

| Layer         | Choice                                      |
| ------------- | -------------------------------------------- |
| Frontend      | React + Vite                                |
| State         | Redux Toolkit                               |
| Styling       | Tailwind CSS                                |
| Offline       | PWA + IndexedDB (Dexie.js) + service worker |
| Backend       | Node.js + Express                           |
| Database      | MongoDB + Mongoose                          |
| Realtime(KDS) | Socket.IO                                   |
| Auth          | JWT (access + refresh) + PIN login          |
| Payments      | Stripe Terminal + Stripe Node SDK           |
| Validation    | Zod or Joi (request schemas)                |

MongoDB was chosen over PostgreSQL for developer familiarity. To cover the gaps a document DB has versus a relational one for financial data (see §3 and §5), we lean on: Mongoose schema validation, MongoDB multi-document ACID transactions for order/payment writes, and embedding price/VAT snapshots directly on order lines rather than relying on joins.

---

## 2. Repo Structure (monorepo, two workspaces)

```
restaurant-pos/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/        # VAT calc, order totals, payment orchestration
│   │   ├── sockets/         # Socket.IO namespaces (KDS)
│   │   ├── middleware/       # auth, role-gating, error handling
│   │   └── app.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── features/         # redux slices, one per domain (cart, menu, orders, kds, auth)
│   │   ├── components/
│   │   ├── pages/            # POS register, KDS screen, admin, reports
│   │   ├── offline/           # Dexie db + sync queue
│   │   └── main.jsx
│   └── package.json
├── PRD.md
├── POS-Feature-Roadmap.md
├── DEVELOPMENT_PLAN.md
└── DEVELOPMENT_CHECKLIST.md
```

---

## 3. Data Model (MongoDB Collections)

Adapted from the PRD's relational model (§6) to a document shape. Key decision: **embed what's always read together, reference what's shared/reused or independently reported on.**

```js
// Category
{ _id, name, sortOrder, active }

// ModifierGroup (modifiers embedded — always read/written with their group)
{
  _id, name, minSelect, maxSelect, required,
  modifiers: [{ _id, name, priceDelta, active }]
}

// MenuItem
{
  _id, categoryId, name, description,
  basePrice,              // VAT-inclusive gross
  imageUrl, taxCategoryId, active, sortOrder,
  modifierGroupIds: [ObjectId]   // ref -> ModifierGroup
}

// TaxCategory
{ _id, name }   // e.g. hot_food, cold_food, soft_drink, alcohol

// VatRate (effective-dated; admin editable; NEVER mutate historical rows)
{ _id, taxCategoryId, orderType, rate, effectiveFrom, effectiveTo }

// Order (lines + payments embedded — always written and read as one unit,
// and must be atomic: an order and its payment are created/settled together)
{
  _id, tokenNumber, type,          // dine_in | takeaway
  status, tableId, staffId,
  subtotal, vatTotal, discount, total,
  createdAt, closedAt, syncStatus,   // syncStatus for offline reconciliation
  lines: [{
    menuItemId, nameSnapshot, quantity,
    unitPrice, lineTotal, vatRate, vatAmount, notes,
    modifiers: [{ modifierId, nameSnapshot, priceDelta }]
  }],
  payments: [{
    method, amount, tendered, change,
    processorRef, staffId, createdAt
  }]
}

// User
{ _id, name, role, pinHash, active }   // role: admin | manager | cashier | kitchen

// Shift
{ _id, userId, drawerId, openingFloat, clockIn, clockOut }

// --- Phase 2+ ---
{ _id, name, section, seats, status }                          // Table
{ _id, type, value, scope, rules }                              // Discount
{ _id, code, rules, validFrom, validTo }                        // Promotion

// --- Phase 3+ ---
{ _id, name, phone, email, loyaltyPoints, consentFlags }        // Customer
{ _id, name, unit, stockQty, reorderLevel }                     // Ingredient
{ menuItemId, ingredientId, quantity }                          // Recipe
{ _id, name, config }                                            // Location
```

**Design notes carried over from the PRD:**
- Every `OrderLine` and `Payment` snapshots price + VAT rate at time of sale — menu prices and VAT rates change, historical orders must not.
- VAT rate resolution is always `(taxCategoryId, orderType) -> rate`, looked up against the effective-dated `VatRate` table, never hard-coded.
- Completed orders are immutable — corrections happen via voids/refunds (new records), never edits or deletes, to satisfy Revenue's 6-year audit-trail requirement.
- Order creation + payment settlement happens inside a MongoDB transaction (`session.withTransaction`) so a paid order is never left partially written.

---

## 4. API Design (high-level, Phase 1 scope)

```
POST   /api/auth/login              PIN or credential login -> JWT
GET    /api/menu                    categories + items + modifier groups
POST   /api/admin/menu-items        (admin) create/edit
POST   /api/orders                  create order (cart -> order), computes VAT
PATCH  /api/orders/:id               update lines / hold / recall
POST   /api/orders/:id/payments      add tender (cash/card), supports split
POST   /api/orders/:id/void          void unpaid order
GET    /api/reports/daily-summary    end-of-day totals
```

KDS realtime: Socket.IO namespace `/kds`. Server emits `order:new`, `order:updated`, `order:bumped`; client (KDS screen) never polls.

Later phases add: `/api/staff`, `/api/shifts`, `/api/tables`, `/api/discounts`, `/api/reports/*` (product mix, staff performance), and Phase 3 customer/loyalty/inventory endpoints — see PRD §4–5 for full FR list.

---

## 5. Where MongoDB Needs Extra Care

Called out explicitly because these are the spots a relational DB would have handled for free:

| Concern                              | Mitigation                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------- |
| No enforced foreign keys              | Mongoose `ref` + application-level checks before writes                    |
| No native multi-table joins for reports | Use aggregation pipelines (`$lookup`) for product-mix / staff-performance reports |
| Atomicity across Order + Payment      | Wrap in a MongoDB session transaction                                     |
| VAT rate correctness                  | Mongoose schema validation + a service-layer VAT resolver, unit-tested independently |
| Historical rate/price integrity       | Never update in place — snapshots on `OrderLine`, effective-dated `VatRate` rows |

---

## 6. Offline Strategy (Phase 2, designed in from Phase 1)

- Frontend writes orders to Dexie (IndexedDB) first, then to the API; a sync queue retries on reconnect.
- Each locally-created order gets a client-generated UUID `syncStatus: 'pending'` so retries are idempotent (no duplicate orders on the server).
- Server treats `tokenNumber`/UUID as the idempotency key on order creation.
- KDS reflects queued orders as soon as they land on the server post-reconnect, ordered by original client timestamp, not arrival time.

---

## 7. Phase-by-Phase Plan

### Phase 1 — MVP (target: 6–8 weeks)
Core POS: menu, cart, modifiers, order type, cash + Stripe Terminal payment, KDS, menu admin, basic EOD summary. See [DEVELOPMENT_CHECKLIST.md](DEVELOPMENT_CHECKLIST.md) for the task-level breakdown.

### Phase 2 — Operations (target: 8–10 weeks)
Staff/roles/PIN login, shifts & drawer reconciliation, tables/tabs, dayparting & 86-ing, discounts/promos, reporting, offline sync.

### Phase 3 — Growth (modular, 12+ weeks, build by priority)
Kiosk mode, online/QR ordering, delivery aggregators, loyalty, inventory, multi-location.

Exit criteria for each phase are defined in PRD §3.4 / §4.4 / §5.3 — do not pull Phase 2/3 work forward before the prior phase's exit criteria are met.

---

## 8. Testing & Deployment

- **Unit tests**: VAT resolver, order total calculation, payment split logic (highest risk of silent money bugs).
- **Integration tests**: order create -> payment -> KDS emit, using an in-memory MongoDB (`mongodb-memory-server`).
- **E2E**: Playwright/Cypress for the counter -> kitchen -> payment golden path before each phase exit.
- **Deployment**: containerize backend (Docker); frontend as a static PWA build; MongoDB Atlas (managed) recommended over self-hosting for backup/retention compliance (6-year record keeping).

---

*This plan should be revisited after each phase ships, per the PRD's living-document note.*
