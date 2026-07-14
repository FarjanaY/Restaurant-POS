import { Schema, model } from 'mongoose';

const tableSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 2, min: 1 },
    section: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('Table', tableSchema);
