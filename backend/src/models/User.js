import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'cashier', 'kitchen'], required: true },
    pinHash: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('User', userSchema);
