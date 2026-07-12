import { Schema, model } from 'mongoose';

const taxCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. hot_food, cold_food, soft_drink, alcohol
  },
  { timestamps: true }
);

export default model('TaxCategory', taxCategorySchema);
