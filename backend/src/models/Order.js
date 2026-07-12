import { Schema, model } from 'mongoose';

const orderLineModifierSchema = new Schema(
  {
    modifierId: { type: Schema.Types.ObjectId, ref: 'ModifierGroup.modifiers' },
    nameSnapshot: { type: String, required: true },
    priceDelta: { type: Number, required: true },
  },
  { _id: false }
);

const orderLineSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    nameSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    vatRate: { type: Number, required: true },
    vatAmount: { type: Number, required: true },
    notes: { type: String, default: '' },
    done: { type: Boolean, default: false }, // per-item KDS bump (FR3.4)
    modifiers: [orderLineModifierSchema],
  },
  { _id: true }
);

const paymentSchema = new Schema(
  {
    method: { type: String, enum: ['cash', 'card'], required: true },
    amount: { type: Number, required: true },
    tendered: { type: Number },
    change: { type: Number },
    processorRef: { type: String },
    staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    tokenNumber: { type: Number, required: true },
    type: { type: String, enum: ['dine_in', 'takeaway'], required: true },
    status: {
      type: String,
      enum: ['open', 'held', 'paid', 'voided', 'completed'],
      default: 'open',
    },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', default: null },
    staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subtotal: { type: Number, default: 0 },
    vatTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    closedAt: { type: Date, default: null },
    notes: { type: String, default: '' }, // order-level special instructions (FR1.5) — see also per-line notes
    syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
    clientOrderId: { type: String, index: true, sparse: true, unique: true }, // idempotency key for offline sync
    lines: [orderLineSchema],
    payments: [paymentSchema],
  },
  // optimisticConcurrency guards against two concurrent payment/edit requests silently
  // clobbering each other — a lost update here means a real, unrecovered cash transaction.
  { timestamps: true, optimisticConcurrency: true }
);

export default model('Order', orderSchema);
