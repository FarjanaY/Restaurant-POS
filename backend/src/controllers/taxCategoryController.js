import TaxCategory from '../models/TaxCategory.js';

// Read-only for now — tax categories are seeded (seed.js) and rarely change;
// full CRUD would need to come with VAT rate management, which is a bigger
// feature tied to the Ireland compliance work (PRD.md §6.5.2), not Phase 1 menu admin.
export async function listTaxCategories(req, res, next) {
  try {
    res.json(await TaxCategory.find().sort('name'));
  } catch (err) {
    next(err);
  }
}
