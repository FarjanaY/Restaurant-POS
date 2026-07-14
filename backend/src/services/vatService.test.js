import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import TaxCategory from '../models/TaxCategory.js';
import VatRate from '../models/VatRate.js';
import { resolveVatRate } from './vatService.js';

let mongod;
let coldFood;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  coldFood = await TaxCategory.create({ name: 'cold_food' });

  await VatRate.create([
    {
      taxCategoryId: coldFood._id,
      orderType: 'dine_in',
      rate: 0.135,
      effectiveFrom: new Date('2020-01-01'),
      effectiveTo: null,
    },
    {
      taxCategoryId: coldFood._id,
      orderType: 'takeaway',
      rate: 0,
      effectiveFrom: new Date('2020-01-01'),
      effectiveTo: null,
    },
    // superseded rate — must never be returned once effectiveTo has passed
    {
      taxCategoryId: coldFood._id,
      orderType: 'takeaway',
      rate: 0.09,
      effectiveFrom: new Date('2015-01-01'),
      effectiveTo: new Date('2019-12-31'),
    },
  ]);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('resolves different rates for dine-in vs takeaway on the same tax category', async () => {
  const dineInRate = await resolveVatRate(coldFood._id, 'dine_in');
  const takeawayRate = await resolveVatRate(coldFood._id, 'takeaway');

  assert.equal(dineInRate, 0.135);
  assert.equal(takeawayRate, 0);
});

test('resolves a historical rate as of a past date', async () => {
  const rate = await resolveVatRate(coldFood._id, 'takeaway', new Date('2016-01-01'));
  assert.equal(rate, 0.09);
});

test('throws when no VAT rate exists for the given category/orderType/date', async () => {
  const bogusId = new mongoose.Types.ObjectId();
  await assert.rejects(() => resolveVatRate(bogusId, 'dine_in'));
});
