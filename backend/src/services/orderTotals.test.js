import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeOrderTotals } from './orderTotals.js';

const coldSandwich = { _id: 'item-1', name: 'Cold Sandwich', basePrice: 5.0, taxCategoryId: 'cold_food' };
const latte = { _id: 'item-2', name: 'Latte', basePrice: 3.5, taxCategoryId: 'hot_food' };
const oatMilk = { _id: 'mod-1', name: 'Oat Milk', priceDelta: 0.5 };

function stubResolveRate(rates) {
  return async (taxCategoryId) => rates[taxCategoryId];
}

test('cold sandwich: dine-in splits VAT out of the gross price (PRD §6.5.2 example)', async () => {
  const { lines, subtotal, vatTotal, total } = await computeOrderTotals(
    [{ menuItem: coldSandwich, quantity: 1 }],
    'dine_in',
    { resolveRate: stubResolveRate({ cold_food: 0.135 }) }
  );

  assert.equal(lines[0].lineTotal, 5.0);
  assert.equal(lines[0].vatAmount, 0.59);
  assert.equal(subtotal, 4.41);
  assert.equal(vatTotal, 0.59);
  assert.equal(total, 5.0);
});

test('cold sandwich: takeaway is zero-rated — same displayed price, no VAT', async () => {
  const { lines, subtotal, vatTotal, total } = await computeOrderTotals(
    [{ menuItem: coldSandwich, quantity: 1 }],
    'takeaway',
    { resolveRate: stubResolveRate({ cold_food: 0 }) }
  );

  assert.equal(lines[0].lineTotal, 5.0);
  assert.equal(lines[0].vatAmount, 0);
  assert.equal(subtotal, 5.0);
  assert.equal(vatTotal, 0);
  assert.equal(total, 5.0);
});

test('applies modifier price deltas and quantity to the line total', async () => {
  const { lines, total } = await computeOrderTotals(
    [{ menuItem: latte, quantity: 2, modifiers: [oatMilk] }],
    'takeaway',
    { resolveRate: stubResolveRate({ hot_food: 0.135 }) }
  );

  // (3.50 + 0.50) * 2 = 8.00 gross
  assert.equal(lines[0].unitPrice, 4.0);
  assert.equal(lines[0].lineTotal, 8.0);
  assert.equal(total, 8.0);
});

test('sums multiple lines at different VAT rates and applies a discount to the total', async () => {
  const { subtotal, vatTotal, total } = await computeOrderTotals(
    [
      { menuItem: coldSandwich, quantity: 1 },
      { menuItem: latte, quantity: 1 },
    ],
    'dine_in',
    { resolveRate: stubResolveRate({ cold_food: 0.135, hot_food: 0.135 }), discount: 1.0 }
  );

  assert.equal(subtotal, 7.49); // 4.41 + 3.08
  assert.equal(vatTotal, 1.01); // 0.59 + 0.42
  assert.equal(total, 7.5); // 8.50 gross - 1.00 discount
});
