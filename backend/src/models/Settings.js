import { Schema, model } from 'mongoose';

// Deliberately a singleton (one document total, found via findOne rather than
// by a fixed id) — this app runs single-venue, so there's exactly one settings
// record for the whole restaurant, not one per user/session.
const restaurantProfileSchema = new Schema(
  {
    name: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    address: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    openingTime: { type: String, default: '' }, // free-form display string, e.g. "7:00 AM"
    closingTime: { type: String, default: '' },
  },
  { _id: false }
);

// Store-facing config the app has no consumer for yet (no public storefront
// or theming engine exists) — same "admin-entered, display/config only" deal
// as restaurantProfile's opening/closing time, just not wired up anywhere yet.
const generalSettingsSchema = new Schema(
  {
    metaTitle: { type: String, default: '' },
    metaKeyword: { type: String, default: '' },
    theme: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const socialSettingsSchema = new Schema(
  {
    facebookUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
  },
  { _id: false }
);

// Per-page list-view preference (table vs. card), one independent setting
// per admin page rather than a single venue-wide switch — Orders can be a
// table while Staff is cards, etc. Not per-user, switchable anytime from
// Store Settings.
const listLayoutsSchema = new Schema(
  {
    orders: { type: String, enum: ['table', 'card'], default: 'table' },
    tables: { type: String, enum: ['table', 'card'], default: 'table' },
    staff: { type: String, enum: ['table', 'card'], default: 'table' },
    categories: { type: String, enum: ['table', 'card'], default: 'table' },
    items: { type: String, enum: ['table', 'card'], default: 'table' },
    discount: { type: String, enum: ['table', 'card'], default: 'table' },
    inventory: { type: String, enum: ['table', 'card'], default: 'table' },
    customers: { type: String, enum: ['table', 'card'], default: 'table' },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    // Table management (floor plan, table picker on Register) is opt-in — a
    // quick-service/takeaway-only operation has no use for it (FR: Tables).
    tablesEnabled: { type: Boolean, default: false },
    listLayouts: { type: listLayoutsSchema, default: () => ({}) },
    // Shown on the admin Dashboard's "Restaurant Description" card — display
    // info only, not used anywhere in order/tax/receipt logic.
    restaurantProfile: { type: restaurantProfileSchema, default: () => ({}) },
    generalSettings: { type: generalSettingsSchema, default: () => ({}) },
    socialSettings: { type: socialSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default model('Settings', settingsSchema);
