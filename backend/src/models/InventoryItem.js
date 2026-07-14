import { Schema, model } from 'mongoose';

const inventoryItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: 'pcs', trim: true }, // e.g. kg, L, pcs
    quantityOnHand: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('InventoryItem', inventoryItemSchema);
