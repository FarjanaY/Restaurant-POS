import { Schema, model } from 'mongoose';

const modifierSchema = new Schema(
  {
    name: { type: String, required: true },
    priceDelta: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

const modifierGroupSchema = new Schema(
  {
    name: { type: String, required: true },
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number, default: 1 },
    required: { type: Boolean, default: false },
    modifiers: [modifierSchema],
  },
  { timestamps: true }
);

export default model('ModifierGroup', modifierGroupSchema);
