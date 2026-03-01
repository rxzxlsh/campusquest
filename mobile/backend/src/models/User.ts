import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String },
  xp: { type: Number, default: 0 },
  campusCoins: { type: Number, default: 0 },
  completedChallenges: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('User', UserSchema);