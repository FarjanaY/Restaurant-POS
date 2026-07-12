import { resolveVatRate } from './vatService.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function computeLine(line, orderType, resolveRate) {
  const modifiersTotal = (line.modifiers || []).reduce((sum, m) => sum + m.priceDelta, 0);
  const unitPrice = round2(line.menuItem.basePrice + modifiersTotal);
  const lineTotal = round2(unitPrice * line.quantity); // gross (VAT-inclusive), per PRD §6.5.2

  const rate = await resolveRate(line.menuItem.taxCategoryId, orderType);
  const net = round2(lineTotal / (1 + rate));
  const vatAmount = round2(lineTotal - net); // derived, not independently rounded — keeps net + vat === gross

  return {
    menuItemId: line.menuItem._id,
    nameSnapshot: line.menuItem.name,
    quantity: line.quantity,
    unitPrice,
    lineTotal,
    vatRate: rate,
    vatAmount,
    notes: line.notes || '',
    modifiers: (line.modifiers || []).map((m) => ({
      modifierId: m._id,
      nameSnapshot: m.name,
      priceDelta: m.priceDelta,
    })),
  };
}

// Discount is applied against the order's gross total only — apportioning a discount back across
// per-line VAT is a Phase 2 concern (FR10) once discount rules exist; Phase 1 discount is always 0.
export async function computeOrderTotals(cartLines, orderType, options = {}) {
  const { resolveRate = resolveVatRate, discount = 0 } = options;

  const lines = [];
  for (const line of cartLines) {
    lines.push(await computeLine(line, orderType, resolveRate));
  }

  const vatTotal = round2(lines.reduce((sum, l) => sum + l.vatAmount, 0));
  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0) - vatTotal);
  const total = round2(subtotal + vatTotal - discount);

  return { lines, subtotal, vatTotal, discount, total };
}
