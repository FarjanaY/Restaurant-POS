import { Schema, model } from 'mongoose';

const menuItemSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    basePrice: { type: Number, required: true }, // VAT-inclusive gross
    imageUrl: { type: String, default: '' },
    taxCategoryId: { type: Schema.Types.ObjectId, ref: 'TaxCategory', required: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    modifierGroupIds: [{ type: Schema.Types.ObjectId, ref: 'ModifierGroup' }],
  },
  { timestamps: true }
);

export default model('MenuItem', menuItemSchema);
