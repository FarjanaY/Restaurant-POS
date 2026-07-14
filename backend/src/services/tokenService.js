import Counter from '../models/Counter.js';

export async function nextOrderToken() {
  const counter = await Counter.findByIdAndUpdate(
    'orderToken',
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return counter.seq;
}
