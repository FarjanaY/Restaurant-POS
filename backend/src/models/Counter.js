import { Schema, model } from 'mongoose';

// Generic atomic counter (e.g. _id: 'orderToken') — avoids the race condition of
// countDocuments()+1 when multiple orders are created concurrently.
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default model('Counter', counterSchema);
