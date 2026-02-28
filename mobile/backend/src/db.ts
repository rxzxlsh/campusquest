import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ override: true });

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn("MONGO_URI is not set. Running with in-memory fallback for reward profiles.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.warn("Continuing without MongoDB. Reward profile data will be in-memory only.");
  }
};
