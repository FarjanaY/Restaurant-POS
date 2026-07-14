import { Schema, model } from 'mongoose';

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('Customer', customerSchema);
