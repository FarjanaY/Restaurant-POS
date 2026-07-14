# Product Requirements Document (PRD)

## Restaurant POS System — Cafe / QSR Hybrid

|                  |                                                                            |
| ---------------- | -------------------------------------------------------------------------- |
| **Product**      | Restaurant POS (working title)                                             |
| **Type**         | Cafe / QSR hybrid — counter ordering + light table service                 |
| **Market**       | Ireland (EU) — single location at launch                                   |
| **Currency**     | EUR (€)                                                                    |
| **Platform**     | Web app — React frontend + Django REST Framework backend, tablet & desktop |
| **Author**       | —                                                                          |
| **Version**      | 1.0 (Draft)                                                                |
| **Last updated** | 2026-07-11                                                                 |
| **Status**       | Draft for review                                                           |

---

## 1. Overview

### 1.1 Purpose

Build a modern, web-based point-of-sale system for a cafe/QSR hybrid restaurant that handles counter ordering, light table service, kitchen coordination, and payments — with a clear path to online ordering, loyalty, and inventory as the business grows.

### 1.2 Problem Statement

Small and mid-size cafes/QSRs are underserved by POS options: legacy systems are expensive and clunky, while cheap solutions lock throughput behind slow interfaces, don't handle modifiers well, and fail when the internet drops. Staff need to take an accurate order and payment in seconds, and the kitchen needs to see it instantly.

### 1.3 Goals

- **G1** — Reduce time-per-order at the counter to under 45 seconds for a typical 3-item order.
- **G2** — Zero lost orders during network outages (offline-first).
- **G3** — Real-time, accurate order flow from register to kitchen.
- **G4** — Give owners actionable sales and product-mix data.
- **G5** — Provide a foundation that scales to kiosk, online, loyalty, and multi-location without a rewrite.

### 1.4 Non-Goals (for initial release)

- Full-service fine-dining coursing/seat-level firing (light table service only).
- Payroll/HR beyond basic clock-in.
- Accounting ledger (integration, not replacement).
- Native mobile apps (PWA covers tablet use).

### 1.5 Success Metrics

| Metric                              | Target         |
| ----------------------------------- | -------------- |
| Avg. order entry time (3 items)     | < 45s          |
| Order accuracy (kitchen complaints) | < 1% of orders |
| Uptime of ordering (incl. offline)  | 99.9%          |
| KDS order-to-display latency        | < 1s           |
| Payment success rate                | > 99%          |
| End-of-day reconciliation time      | < 5 min        |

---

## 2. Personas

| Persona                     | Role                       | Needs                                                    |
| --------------------------- | -------------------------- | -------------------------------------------------------- |
| **Maria — Cashier/Barista** | Takes orders, makes drinks | Fast entry, easy modifiers, minimal training             |
| **Sam — Shift Manager**     | Runs the floor             | Voids/refunds, discounts, cash reconciliation, oversight |
| **Owner — Admin**           | Owns the business          | Menu/pricing control, reporting, staff management        |
| **Cook — Kitchen**          | Prepares food              | Clear order queue, timing, mark-done                     |
| **Alex — Customer**         | Orders & pays              | Fast, accurate order; later: kiosk/online/loyalty        |

---

## 3. Scope & Phasing Overview

| Phase       | Theme          | Outcome                                                     |
| ----------- | -------------- | ----------------------------------------------------------- |
| **Phase 1** | MVP — Core POS | Take orders, route to kitchen, take payment                 |
| **Phase 2** | Operations     | Staff, tables, promotions, reporting, offline               |
| **Phase 3** | Growth         | Kiosk, online, delivery, loyalty, inventory, multi-location |

Each phase below contains: objectives, user stories, functional requirements (FR), acceptance criteria, and phase exit criteria.

---

# PHASE 1 — MVP: Core POS

**Objective:** A cashier can take an order with modifiers, send it to the kitchen, and process payment end-to-end on a tablet. This is the minimum to run a real shift.

**Timeline estimate:** 6–8 weeks
**Primary personas:** Cashier, Cook

### 3.1 User Stories

- As a **cashier**, I can browse the menu by category and add items to an order quickly.
- As a **cashier**, I can apply modifiers (size, milk, extras) to an item.
- As a **cashier**, I can mark the order as dine-in or takeaway.
- As a **cashier**, I can take cash or card payment and give change.
- As a **cashier**, I can hold an order and recall it later.
- As a **cook**, I see new orders on a kitchen screen instantly and mark them done.
- As an **admin**, I can add and edit menu items, categories, modifiers, and prices.

### 3.2 Functional Requirements

#### FR1 — Menu & Ordering

- **FR1.1** Display menu items grouped by category with name, price, image (optional).
- **FR1.2** Tap an item to add it to the current order (cart).
- **FR1.3** Support **modifier groups** per item:
  - Single-select (e.g., size: S/M/L) and multi-select (e.g., extras: whipped cream, extra shot).
  - Required vs optional groups; min/max selections.
  - Modifiers may add price deltas (e.g., +$0.50 large).
- **FR1.4** Adjust line quantity; remove a line; clear the whole order.
- **FR1.5** Free-text special instructions per line and/or per order.
- **FR1.6** **Order type**: dine-in or takeaway toggle (affects tax rules and kitchen ticket label).
- **FR1.7** Auto-calculate subtotal, tax, and total in real time.
- **FR1.8** Generate a sequential **order/token number** per order.
- **FR1.9** **Hold & recall**: park an open order and retrieve it by token/name.

#### FR2 — Payments

- **FR2.1** Cash payment with tendered-amount entry and change due calculation.
- **FR2.2** Card/contactless payment via **Stripe Terminal** (supported reader; PaymentIntents flow; SCA handled by Stripe).
- **FR2.3** **Split payment** across multiple tenders (e.g., part cash, part card).
- **FR2.4** Print receipt (thermal printer) and/or show digital receipt (QR/email).
- **FR2.5** **Void** an unpaid order; **refund** a paid order (manager-gated in Phase 2).
- **FR2.6** Record every transaction with timestamp, items, tender, and staff.

#### FR3 — Kitchen Display System (KDS)

- **FR3.1** New paid/confirmed orders appear on the kitchen screen in real time (< 1s).
- **FR3.2** Show items, modifiers, special instructions, order type, and token.
- **FR3.3** Order **timer** showing elapsed time since placed; color escalates past thresholds.
- **FR3.4** Mark item and/or whole order as "in progress" and "done" (bump).
- **FR3.5** Completed orders move to a "recently completed" view (recallable).

#### FR4 — Menu Administration

- **FR4.1** CRUD for categories, items, modifier groups, and modifiers.
- **FR4.2** Set prices, price deltas, and tax category per item.
- **FR4.3** Toggle item active/inactive.
- **FR4.4** Reorder items/categories for display.

#### FR5 — Basic Reporting

- **FR5.1** End-of-day summary: total sales, order count, tax collected, tender breakdown.
- **FR5.2** List of the day's transactions with drill-down.

### 3.3 Acceptance Criteria (samples)

- Adding a "Large Latte, oat milk, extra shot" takes ≤ 4 taps and shows correct price.
- Switching dine-in/takeaway updates tax and the KDS ticket label.
- A placed order appears on the KDS within 1 second on the same network.
- Cash payment of $10 on a $7.30 order shows $2.70 change.
- End-of-day totals reconcile with the sum of individual transactions.

### 3.4 Phase 1 Exit Criteria

- A full order can be taken, paid, sent to kitchen, and completed without errors.
- Menu can be fully managed by an admin without developer help.
- The system runs a simulated shift (50+ orders) without data loss.

---

# PHASE 2 — Operations: Run the Business

**Objective:** Turn the register into a business tool — staff accountability, light table service, promotions, reporting, and offline resilience.

**Timeline estimate:** 8–10 weeks
**Primary personas:** Manager, Admin, Cashier

### 4.1 User Stories

- As a **manager**, I log in with a PIN and only I can void, refund, or discount.
- As a **cashier**, I clock in/out and my sales are attributed to me.
- As a **manager**, I open the drawer with a float and reconcile cash at close.
- As a **cashier**, I assign an order to a table and add to it over time, then close the tab.
- As an **admin**, I create combos and set a breakfast menu that switches to lunch automatically.
- As a **cashier**, I keep taking orders even when the internet is down.
- As an **owner**, I see which items sell best and at what times.

### 4.2 Functional Requirements

#### FR6 — Staff, Roles & Security

- **FR6.1** User accounts with roles: **Admin, Manager, Cashier, Kitchen**.
- **FR6.2** PIN or credential login; fast user switching on shared terminals.
- **FR6.3** **Permission gating** — voids, refunds, discounts, price overrides, and menu edits restricted by role.
- **FR6.4** Clock-in / clock-out; attribute orders and sales to the logged-in staff member.
- **FR6.5** Audit log of sensitive actions (voids, refunds, discounts, drawer opens).

#### FR7 — Cash Management

- **FR7.1** Opening float entry per drawer/shift.
- **FR7.2** Cash in/out (paid-outs, safe drops) tracking.
- **FR7.3** End-of-shift **reconciliation**: expected vs counted, variance report.

#### FR8 — Table & Tab Management (light)

- **FR8.1** Define a simple floor/table list.
- **FR8.2** Assign an order to a table; add items across multiple rounds.
- **FR8.3** **Split, merge, and move** tabs/tables.
- **FR8.4** Open-tab view showing all active tables and their totals.

#### FR9 — Menu Intelligence

- **FR9.1** **Combos/meal deals**: bundle items with combined pricing.
- **FR9.2** **Dayparting**: schedule menus (breakfast → lunch) that switch by time automatically.
- **FR9.3** **86-ing**: mark an item out-of-stock/unavailable; it greys out at POS.
- **FR9.4** Optional upsell prompts on selected items.

#### FR10 — Discounts & Promotions

- **FR10.1** Percentage and fixed-amount discounts (line and order level), manager-gated.
- **FR10.2** Coupon/promo codes with validity rules.
- **FR10.3** Time-based pricing (happy hour).

#### FR11 — Reporting & Analytics

- **FR11.1** Sales by day, hour, and daypart.
- **FR11.2** **Product mix** — best/worst sellers by quantity and revenue.
- **FR11.3** Payment method breakdown.
- **FR11.4** Staff sales performance.
- **FR11.5** Discount and void/refund reports.
- **FR11.6** CSV export of all reports.

#### FR12 — Offline Resilience

- **FR12.1** POS operates offline: menu, cart, order placement, and cash payment work with no network.
- **FR12.2** Orders persist locally (IndexedDB/PWA) and **sync automatically** when connectivity returns.
- **FR12.3** KDS receives queued orders on reconnect; conflict-free ordering by token/timestamp.
- **FR12.4** Card payments gracefully degrade (queue or prompt cash) when the processor is unreachable.
- **FR12.5** No open order is lost on refresh, crash, or power cycle.

### 4.3 Acceptance Criteria (samples)

- A cashier without manager rights cannot complete a void; the action prompts for manager PIN.
- End-of-shift reconciliation shows a correct variance when the drawer is deliberately short.
- Disconnecting Wi-Fi mid-shift still allows placing and paying (cash) for orders; they appear on KDS after reconnect.
- Breakfast menu automatically hides at 11:00 and lunch items appear.
- Product-mix report matches manually tallied item counts for a test day.

### 4.4 Phase 2 Exit Criteria

- Multiple staff can work a shift with correct attribution and permissions.
- A full shift survives a simulated network outage with zero lost orders.
- Owner can answer "what sold, when, by whom, and for how much" from reports.

---

# PHASE 3 — Growth: Multi-Channel & Relationships

**Objective:** Grow revenue through customer-facing channels, loyalty, and operational depth (inventory, multi-location).

**Timeline estimate:** 12+ weeks (modular — build by priority)
**Primary personas:** Customer, Owner, Manager

### 5.1 User Stories

- As a **customer**, I order and pay at a self-service kiosk.
- As a **customer**, I scan a QR at my table and order from my phone.
- As a **customer**, I order online for pickup.
- As a **customer**, I earn and redeem loyalty points.
- As an **owner**, I track ingredient stock and get low-stock alerts.
- As an **owner**, I manage multiple locations from one back office.

### 5.2 Functional Requirements

#### FR13 — Self-Order Kiosk Mode

- **FR13.1** Customer-facing build of the menu with large touch targets and imagery.
- **FR13.2** Guided modifiers and upsell/cross-sell prompts.
- **FR13.3** Multi-language toggle; accessibility (contrast, screen-reader labels).
- **FR13.4** Kiosk payment and token issuance; feeds the same KDS queue.

#### FR14 — Online & QR Ordering

- **FR14.1** Web ordering page for **pickup** with menu, cart, and payment.
- **FR14.2** **QR-code table ordering**: scan → order → pay from phone → same kitchen queue.
- **FR14.3** Order status page (received → preparing → ready).

#### FR15 — Delivery Integration

- **FR15.1** Integrate delivery aggregators (Uber Eats / DoorDash / local) into one unified queue.
- **FR15.2** Menu/price/availability sync to aggregator platforms where APIs allow.

#### FR16 — Customer & Loyalty

- **FR16.1** Customer profiles (phone/email, consent-managed).
- **FR16.2** **Loyalty/points** program with earn rules and redemption at POS/kiosk/online.
- **FR16.3** Order history and one-tap reorder.
- **FR16.4** Targeted offers and digital receipts with opt-in marketing.

#### FR17 — Inventory Management

- **FR17.1** Ingredient/stock items with recipes mapping menu items → ingredients.
- **FR17.2** Auto-deduct stock on sale; **low-stock alerts** and auto-86.
- **FR17.3** Waste tracking and stock adjustments.
- **FR17.4** Suppliers and purchase orders.

#### FR18 — Multi-Location

- **FR18.1** Central menu/pricing with per-location overrides.
- **FR18.2** Consolidated and per-store reporting.
- **FR18.3** Role scoping by location.

#### FR19 — Advanced

- **FR19.1** Tips capture and distribution.
- **FR19.2** Speed-of-service and peak-hour forecasting analytics.
- **FR19.3** Accounting integration (QuickBooks/Xero export/API).

### 5.3 Phase 3 Exit Criteria

- At least one new customer channel (kiosk, QR, or online) is live and feeds the same kitchen queue.
- Loyalty can be earned and redeemed across channels.
- Inventory depletes correctly from real sales and triggers alerts.

---

## 6. Data Model (Core Entities)

Lock these in during Phase 1 — they are the hardest to change later.

```
Category        (id, name, sort_order, active)
MenuItem        (id, category_id, name, description, base_price, image_url,
                 tax_category_id, active, sort_order)   // base_price is VAT-INCLUSIVE gross
ModifierGroup   (id, name, min_select, max_select, required)
Modifier        (id, group_id, name, price_delta, active)
MenuItemModifierGroup (menu_item_id, modifier_group_id)   // many-to-many

Order           (id, token_number, type[dine_in|takeaway], status,
                 table_id?, staff_id, subtotal, vat_total, discount, total,
                 created_at, closed_at, sync_status)
OrderLine       (id, order_id, menu_item_id, quantity, unit_price,
                 line_total, vat_rate, vat_amount, notes)   // rate + amount snapshot
OrderLineModifier (id, order_line_id, modifier_id, price_delta)   // price snapshot

TaxCategory     (id, name)                                  // e.g. hot_food, cold_food, soft_drink, alcohol
VatRate         (id, tax_category_id, order_type[dine_in|takeaway],
                 rate, effective_from, effective_to)        // (category, order_type) -> rate, effective-dated

Payment         (id, order_id, method[cash|card|...], amount,
                 tendered, change, processor_ref, staff_id, created_at)

User            (id, name, role[admin|manager|cashier|kitchen], pin_hash, active)
Shift           (id, user_id, drawer_id, opening_float, clock_in, clock_out)

// Phase 2+
Table           (id, name, section, seats, status)
Discount        (id, type[pct|fixed], value, scope, rules)
Promotion       (id, code, rules, valid_from, valid_to)

// Phase 3+
Customer        (id, name, phone, email, loyalty_points, consent_flags)
Ingredient      (id, name, unit, stock_qty, reorder_level)
Recipe          (menu_item_id, ingredient_id, quantity)
Location        (id, name, config)
```

> **Design note:** always store a **price snapshot** AND the **VAT rate applied** on `OrderLine`/`OrderLineModifier` and `Payment`. Menu prices and VAT rates change; historical orders must reflect the price and tax at time of sale.

---

## 6.5 Localization & Compliance — Ireland

This product launches for a single location in **Ireland (EU)**. The following are hard requirements, not "nice to have."

### 6.5.1 Locale

- **Currency:** EUR (€); prices displayed and stored to 2 decimals; rounding to nearest cent.
- **Language:** English at launch. Structure UI strings for i18n so **Irish (Gaeilge)** can be added on customer-facing surfaces (kiosk/QR) in Phase 3.
- **Date/number formats:** Irish/EU conventions (DD/MM/YYYY, `€1.234,56`-style handled per locale settings).

### 6.5.2 VAT (this is the critical part)

Ireland has **multiple VAT rates**, and for a cafe the applicable rate depends on **what the item is** *and* **how it's supplied (dine-in vs takeaway)**. The system must model VAT as **configurable, per-item, and order-type-aware** — never a single global rate.

**Rate structure (verify current values with Revenue / your accountant — VAT rates and the hospitality rate change with Budgets):**

| Rate band                     | Typical use                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| **Standard (currently 23%)**  | Soft drinks, bottled water, confectionery, chocolate, crisps, ice cream, alcohol      |
| **Reduced (currently 13.5%)** | Restaurant/catering services, hot food, food & drink consumed on the premises         |
| **Second reduced (9%)**       | Applied to hospitality/food services in some periods — historically toggled by Budget |
| **Zero (0%)**                 | Many basic/cold takeaway foods (e.g. cold sandwich, bread, milk)                      |

**Design implications:**

- Each `MenuItem` carries a **tax category**, not a hard-coded rate.
- **Order type drives rate resolution.** The same cold item can be **13.5% (catering, eaten in)** vs **0% (cold takeaway)**; hot food is typically 13.5% either way; soft drinks/confectionery stay at **23%** regardless. So `dine_in | takeaway` (FR1.6) must feed VAT calculation, not just the kitchen ticket.
- A **rate table** maps `(tax_category, order_type) → vat_rate`, editable by an admin and effective-dated so past orders keep their historical rate.
- VAT is calculated **per line** and summed; store the rate and VAT amount on each `OrderLine`.

**Pricing is VAT-inclusive (Irish consumer standard):**

- Menu prices are **entered and displayed inclusive of VAT** (the gross the customer pays).
- The system **back-calculates** net and VAT from the gross: `net = gross / (1 + rate)`, `vat = gross − net`.
- **The displayed price stays constant across order type; only the VAT split changes.** Example — a cold sandwich priced at **€5.00**: eaten in (13.5%) → net €4.41 / VAT €0.59; cold takeaway (0%) → net €5.00 / VAT €0.00. The customer pays €5.00 either way.
- Store `base_price` as the VAT-inclusive gross; compute net/VAT at order time using the effective rate for `(tax_category, order_type)`.

> ⚠️ **Do not treat the rates above as authoritative.** Irish VAT on food/catering is detailed and periodically changed in the Budget. The build must make rates and mappings configurable, and the specific values must be confirmed with the **Revenue Commissioners** or a qualified accountant before go-live.

### 6.5.3 Receipts (thermal + digital, VAT-compliant)

- **Thermal receipt** printing is required (in-store printer).
- **Digital receipt** also required (email/QR) — both channels supported.
- Every receipt must show a **VAT breakdown**: net, VAT amount **by rate band**, and gross total, plus the business name and **VAT registration number**.
- Retain transaction records per Revenue requirements (see below).

### 6.5.4 Payments (SCA / PSD2)

- **Processor: Stripe Terminal (confirmed).** Card-present payments go through Stripe Terminal with a supported reader (e.g. **Stripe Reader S700**, or BBPOS WisePOS E). Stripe handles EMV, contactless, and PSD2 SCA; we never touch raw card data (keeps PCI scope minimal — SAQ A / P2PE).
- **Contactless-first** — tap-to-pay and mobile wallets (Apple Pay / Google Pay) dominate in Ireland; make contactless the primary path. Stripe Terminal supports Tap to Pay where available.
- Still **abstract payments behind an internal interface** so a different acquirer could be swapped later, but implement Stripe Terminal as the concrete provider for launch.
- Use Stripe's **PaymentIntents** flow; reconcile Stripe payouts against POS sales in reporting.

### 6.5.5 Data protection (GDPR / Irish DPA 2018)

- Storing customer data (loyalty, email receipts, profiles — mainly Phase 3) triggers **GDPR** and the **Irish Data Protection Act 2018**.
- Requirements: lawful basis + **explicit consent** for marketing, consent flags stored per customer, **data minimisation**, right to **access/erasure**, and a defined **retention policy**.
- Encrypt personal data at rest and in transit; keep an audit trail of access.

### 6.5.6 Fiscalization

- **Good news:** Ireland does **not** mandate certified fiscal cash registers / fiscal signing devices (unlike Italy, Germany, Portugal, Poland). No hardware fiscalization module is needed.
- **However:** Revenue requires accurate, tamper-evident **record-keeping** of sales and VAT, retained (generally 6 years). The immutable transaction/audit log (NFR) satisfies this — do not allow silent deletion or editing of completed transactions.

---

## 7. Non-Functional Requirements

| Category             | Requirement                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Performance**      | Menu-to-cart interaction < 100ms; KDS latency < 1s; page load < 2s on tablet.                                          |
| **Offline**          | Full ordering + cash payment offline (PWA); auto-sync on reconnect.                                                    |
| **Reliability**      | 99.9% ordering availability; no data loss on crash/refresh.                                                            |
| **Security**         | Role-based access; PIN hashing; audit log; HTTPS everywhere.                                                           |
| **PCI Compliance**   | Never store raw card data; use a certified processor/gateway only.                                                     |
| **PSD2 / SCA**       | Card payments enforce Strong Customer Authentication via the processor.                                                |
| **GDPR / DPA 2018**  | Consent management, data minimisation, access/erasure, defined retention; personal data encrypted.                     |
| **VAT compliance**   | Multi-rate, per-item, order-type-aware VAT; effective-dated rate table; VAT breakdown on receipts.                     |
| **Record retention** | Immutable transaction/audit log retained per Revenue (≈6 years); completed transactions never silently edited/deleted. |
| **Scalability**      | Support 100+ orders/hour per location; single location at launch, multi-location deferred to Phase 3.                  |
| **Usability**        | Touch-first; minimal taps per order; usable with < 30 min training.                                                    |
| **Localization**     | EUR currency, Irish VAT rules, English at launch (Gaeilge-ready i18n for customer surfaces).                           |
| **Accessibility**    | WCAG-aligned kiosk/customer surfaces (contrast, labels, focus).                                                        |
| **Auditability**     | Immutable transaction log; every sensitive action attributed.                                                          |

---

## 8. Recommended Technical Stack

| Concern          | Choice                                                      | Rationale                                                      |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Frontend         | React + TypeScript (Vite)                                   | Fast, component-driven, huge ecosystem                         |
| UI/Styling       | Tailwind CSS + shadcn/ui                                    | Touch-friendly, rapid build                                    |
| Offline          | PWA + IndexedDB (Dexie.js) + service worker                 | Local-first ordering                                           |
| State            | Zustand or Redux Toolkit                                    | Predictable cart/order state                                   |
| Backend          | **Django + Django REST Framework** (Python)                 | Batteries-included, robust ORM/migrations, admin for menu mgmt |
| Database         | **PostgreSQL**                                              | Relational integrity for orders/payments                       |
| Realtime (KDS)   | **Django Channels** (WebSockets)                            | Instant kitchen updates                                        |
| Payments         | **Stripe Terminal** (+ Stripe Python SDK)                   | PCI-compliant, EMV/contactless/SCA, EU presence                |
| Auth             | **DRF + SimpleJWT** + role-based permissions                | Staff roles & permissions                                      |
| Background/async | Celery + Redis (Phase 2+)                                   | Receipt email, syncs, scheduled tasks                          |
| Hosting          | Cloud API + local-first PWA (optional in-store sync server) | Resilience during outages                                      |

---

## 9. Assumptions & Dependencies

- A supported card payment processor is available in the target market.
- Store terminals are tablets/desktops with a modern browser (Chrome/Edge) and a thermal printer.
- Reliable-enough LAN for KDS realtime; internet may be intermittent (offline handles it).
- Delivery aggregator integrations depend on third-party API access and approval.

## 10. Risks & Mitigations

| Risk                                  | Mitigation                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| Offline sync conflicts                | Token/timestamp ordering; idempotent sync; server as source of truth on close |
| Payment integration complexity        | Start with one certified processor; abstract behind a payment interface       |
| Scope creep into Phase 2/3 early      | Enforce Phase 1 exit criteria before expanding                                |
| Menu/modifier model too rigid         | Model modifier groups flexibly (min/max, required) from day one               |
| Hardware variance (printers/scanners) | Standardize on a small supported hardware list                                |

## 11. Resolved Decisions & Remaining Questions

**Resolved:**

- **Market:** Ireland (EU), EUR currency, single location at launch.

- **Receipts:** Both thermal **and** digital required, with VAT breakdown.

- **Tax:** Follow Irish VAT — multi-rate, per-item, order-type-aware, configurable & effective-dated (see §6.5.2).

- **Compliance:** GDPR/DPA 2018 for customer data; no fiscalization hardware required, but Revenue record-keeping applies.

- **Payments:** **Stripe Terminal** (supported reader; PaymentIntents; SCA via Stripe), contactless-first.

- **Pricing:** menu prices **entered and shown VAT-inclusive**; system back-calculates net + VAT per line.

**Remaining to confirm before build/go-live:**

- **Exact current VAT rates & item→category mappings** — confirm with Revenue Commissioners / accountant (rates change with Budgets).
- **Stripe reader model** — Stripe Reader S700 vs BBPOS WisePOS E (affects hardware order and Tap-to-Pay availability).
- **Thermal printer model** — pick a supported model (e.g. Epson TM-series) to standardize the driver/integration.
- **Business VAT registration number** — required for compliant receipts.
- **Stripe account setup** — Irish Stripe account, business verification, and payout bank details.

---

## 12. Release Plan Summary

| Milestone           | Contents                                                        | Exit gate                                |
| ------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| **M1 — MVP**        | Phase 1 (order, pay, KDS, menu admin)                           | Simulated 50-order shift, zero data loss |
| **M2 — Operations** | Phase 2 (staff, cash, tables, promos, reporting, offline)       | Multi-staff shift survives outage        |
| **M3 — Growth**     | Phase 3 modules by priority (kiosk/QR/online/loyalty/inventory) | ≥1 new channel live on shared queue      |

---

*This PRD is a living document. Phase 2 and 3 requirements should be revalidated after Phase 1 ships and real usage data is available.*
