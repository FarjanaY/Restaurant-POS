import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  await mongoose.connect(uri);
}
