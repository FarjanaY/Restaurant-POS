import { Schema, model } from 'mongoose';

// One entry per calendar day (UTC) — the admin-entered running cost (food
// cost, labor, overhead, whatever they choose to track) shown alongside
// revenue on the Dashboard's Revenue chart. Purely informational: nothing
// else in the system derives pricing or totals from this.
const dailyCostSchema = new Schema(
  {
    date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default model('DailyCost', dailyCostSchema);
