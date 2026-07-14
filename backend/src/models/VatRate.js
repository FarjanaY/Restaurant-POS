import { Schema, model } from 'mongoose';

const vatRateSchema = new Schema(
  {
    taxCategoryId: { type: Schema.Types.ObjectId, ref: 'TaxCategory', required: true },
    orderType: { type: String, enum: ['dine_in', 'takeaway'], required: true },
    rate: { type: Number, required: true }, // e.g. 0.135 for 13.5%
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null }, // null = currently active
  },
  { timestamps: true }
);

// Never mutate historical rows — close one out (set effectiveTo) and insert a new one.
vatRateSchema.index({ taxCategoryId: 1, orderType: 1, effectiveFrom: 1 });

export default model('VatRate', vatRateSchema);
