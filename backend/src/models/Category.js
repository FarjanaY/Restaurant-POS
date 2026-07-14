import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
<<<<<<< HEAD
    imageUrl: { type: String, default: '' },
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('Category', categorySchema);
