import mongoose from "mongoose";

const CompletionSchema = new mongoose.Schema(
  {
    challengeId: { type: String, required: true },
    challengeClub: { type: String, required: true },
    rewardLamports: { type: Number, required: true },
    rewardTxSignature: { type: String, required: true },
    rewardTxUrl: { type: String, required: true },
    completedAt: { type: Date, required: true },
  },
  { _id: false }
);

const RewardProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    walletAddress: { type: String, required: true },
    totalRewardLamports: { type: Number, default: 0 },
    completedChallengeIds: [{ type: String }],
    completedChallenges: [CompletionSchema],
  },
  { timestamps: true }
);

export type RewardProfileDocument = mongoose.InferSchemaType<typeof RewardProfileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export default mongoose.model("RewardProfile", RewardProfileSchema);
