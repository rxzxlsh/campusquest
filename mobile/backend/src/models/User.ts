import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth0Id: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String },
  password: { type: String, required: true, select: false },
  walletAddress: { type: String, default: "" },
  xp: { type: Number, default: 0 },
  campusCoins: { type: Number, default: 0 },
  equippedItems: [{ type: String }],   // e.g. ["HAT_001", "HOODIE_UTM"]
  unlockedItems: [{ type: String }],   // items purchased from shop
  completedChallenges: [{ type: String }],
}, { timestamps: true });
  

export default mongoose.model('User', UserSchema);
