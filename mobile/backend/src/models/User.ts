import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  username: { type: String },
  xp: { type: Number, default: 0 },
  campusCoins: { type: Number, default: 0 },
  completedChallenges: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('User', UserSchema);