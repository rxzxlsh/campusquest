import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { connectDB } from "./db";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import RewardProfile from "./models/RewardProfile";
import User from "./models/User";

dotenv.config({ override: true });

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

connectDB();

/**
 * -------------------------
 * Game Logic Types + Store
 * -------------------------
 */
type Challenge = {
  id: string;
  club: string;
  type: string; // "puzzle" | "quiz" | "photo" | etc
  description: string;
  xp: number;
  rewardLamports: number;
  options?: string[]; // ✅ quiz choices
  solution?: string; // ✅ for answer-checked challenges (puzzle/quiz)
};

type ProgressState = "started" | "completed";
const userProgress: Record<string, Record<string, ProgressState>> = {};

/**
 * -------------------------
 * Rewards / Profile Types
 * -------------------------
 */
type CompletionRecord = {
  challengeId: string;
  challengeClub: string;
  rewardLamports: number;
  rewardTxSignature: string;
  rewardTxUrl: string;
  completedAt: string;
};

type RewardProfileSnapshot = {
  userId: string;
  walletAddress: string;
  totalRewardLamports: number;
  completedChallengeIds: string[];
  completedChallenges: CompletionRecord[];
};

const FALLBACK_REWARD_LAMPORTS = 5_000_000; // 0.005 SOL (matches map UI reward copy)
const parsedRewardLamports = Number(process.env.SOLANA_REWARD_LAMPORTS);
const defaultRewardLamports =
  Number.isFinite(parsedRewardLamports) && parsedRewardLamports > 0
    ? Math.floor(parsedRewardLamports)
    : FALLBACK_REWARD_LAMPORTS;
const rpcUrl = process.env.SOLANA_RPC_URL ?? clusterApiUrl("devnet");
const connection = new Connection(rpcUrl, "confirmed");
const demoUserId = process.env.DEMO_USER_ID ?? "demo-user-001";
const demoUserWallet = process.env.DEMO_USER_WALLET ?? "";
const memoryProfiles = new Map<string, RewardProfileSnapshot>();

/**
 * -------------------------
 * Challenge Store
 * (questions + solutions)
 * -------------------------
 *
 * NOTE:
 * - Challenges with a `solution` require a correct answer.
 * - Challenges without a `solution` auto-pass on submit (good for attendance / photo missions).
 * - `/challenges/:id` will not leak `solution`.
 */
const challenges: { [key: string]: Challenge } = {
  // Green Leading Club UTM — Quiz
  GREEN_002: {
    id: "GREEN_002",
    club: "Green Leading Club UTM",
    type: "quiz",
    description: "Which action reduces your carbon footprint the most on campus?",
    options: [
      "A) Using reusable bottles",
      "B) Turning off lights",
      "C) Carpooling",
      "D) Printing double-sided",
    ],
    solution: "C) Carpooling",
    xp: 50,
    rewardLamports: defaultRewardLamports,
  },

  // Fitness for Noobs — Quiz
  FIT_002: {
    id: "FIT_002",
    club: "Fitness for Noobs",
    type: "quiz",
    description: "How many minutes of moderate exercise is recommended per week?",
    options: ["A) 30", "B) 60", "C) 150", "D) 300"],
    solution: "C) 150",
    xp: 50,
    rewardLamports: defaultRewardLamports,
  },

  // Computer Science Student Community (Coding Club) — Fill in the blank / text input
  CODING_003: {
    id: "CODING_003",
    club: "Computer Science Student Community",
    type: "puzzle",
    description:
      "Which sorting algorithm has average time complexity O(n log n) and uses divide-and-conquer? (fill in the blank)",
    solution: "merge sort",
    xp: 75,
    rewardLamports: defaultRewardLamports,
  },

  // Hart House Camera Club — Quiz
  PHOTO_002: {
    id: "PHOTO_002",
    club: "Hart House Camera Club",
    type: "quiz",
    description:
      "What photography technique creates a mirror-like balance across a central axis?",
    options: ["A) Exposure stacking", "B) Symmetry", "C) Panning", "D) Framing"],
    solution: "B) Symmetry",
    xp: 40,
    rewardLamports: defaultRewardLamports,
  },

  // UTM Nature Club — Text input
  NATURE_001: {
    id: "NATURE_001",
    club: "UTM Nature Club",
    type: "puzzle",
    description: "What animal is famously spotted around UofT Mississauga campus?",
    solution: "deer",
    xp: 50,
    rewardLamports: defaultRewardLamports,
  },

  // UTM MCCS — Attendance event (auto-pass)
  MCCS_001: {
    id: "MCCS_001",
    club: "UTM MCCS",
    type: "attendance",
    description: "Attend Deerhacks",
    xp: 75,
    rewardLamports: defaultRewardLamports,
    // no solution => auto-pass
  },

  // UTM HOSA — Attendance event (auto-pass)
  HOSA_001: {
    id: "HOSA_001",
    club: "UTM HOSA",
    type: "attendance",
    description: "Attend a UTM HOSA event",
    xp: 75,
    rewardLamports: defaultRewardLamports,
    // no solution => auto-pass
  },
};

function isValidWalletAddress(walletAddress: string) {
  try {
    new PublicKey(walletAddress);
    return true;
  } catch {
    return false;
  }
}

function getTreasuryKeypair() {
  const encodedSecret = process.env.SOLANA_REWARD_TREASURY_SECRET_KEY;
  if (!encodedSecret) return null;

  try {
    const rawSecret = JSON.parse(encodedSecret) as number[];
    if (!Array.isArray(rawSecret) || rawSecret.length === 0) return null;
    return Keypair.fromSecretKey(Uint8Array.from(rawSecret));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("Failed to parse SOLANA_REWARD_TREASURY_SECRET_KEY:", message);
    return null;
  }
}

function explorerClusterFromRpcUrl(url: string) {
  if (url.includes("devnet")) return "devnet";
  if (url.includes("testnet")) return "testnet";
  return "mainnet-beta";
}

function txExplorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${explorerClusterFromRpcUrl(
    rpcUrl
  )}`;
}

function toSol(lamports: number) {
  return lamports / 1_000_000_000;
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function normalizeProfile(profile: RewardProfileSnapshot | null) {
  if (!profile) return null;
  return {
    userId: profile.userId,
    walletAddress: profile.walletAddress,
    totalRewardLamports: profile.totalRewardLamports,
    totalRewardSol: toSol(profile.totalRewardLamports),
    completedChallenges: profile.completedChallenges,
  };
}

async function getRewardProfile(
  userId: string
): Promise<RewardProfileSnapshot | null> {
  if (isMongoReady()) {
    const profile = await RewardProfile.findOne({ userId }).lean();
    if (!profile) return null;
    return {
      userId: profile.userId,
      walletAddress: profile.walletAddress,
      totalRewardLamports: profile.totalRewardLamports,
      completedChallengeIds: profile.completedChallengeIds ?? [],
      completedChallenges: (profile.completedChallenges ?? []).map((entry) => ({
        challengeId: entry.challengeId,
        challengeClub: entry.challengeClub,
        rewardLamports: entry.rewardLamports,
        rewardTxSignature: entry.rewardTxSignature,
        rewardTxUrl: entry.rewardTxUrl,
        completedAt: new Date(entry.completedAt).toISOString(),
      })),
    };
  }
  return memoryProfiles.get(userId) ?? null;
}

async function upsertWalletProfile(
  userId: string,
  walletAddress: string
): Promise<RewardProfileSnapshot> {
  if (isMongoReady()) {
    const profile = await RewardProfile.findOneAndUpdate(
      { userId },
      {
        $set: { userId, walletAddress },
        $setOnInsert: {
          totalRewardLamports: 0,
          completedChallengeIds: [],
          completedChallenges: [],
        },
      },
      { new: true, upsert: true }
    ).lean();

    return {
      userId: profile.userId,
      walletAddress: profile.walletAddress,
      totalRewardLamports: profile.totalRewardLamports,
      completedChallengeIds: profile.completedChallengeIds ?? [],
      completedChallenges: (profile.completedChallenges ?? []).map((entry) => ({
        challengeId: entry.challengeId,
        challengeClub: entry.challengeClub,
        rewardLamports: entry.rewardLamports,
        rewardTxSignature: entry.rewardTxSignature,
        rewardTxUrl: entry.rewardTxUrl,
        completedAt: new Date(entry.completedAt).toISOString(),
      })),
    };
  }

  const existing = memoryProfiles.get(userId);
  const profile: RewardProfileSnapshot =
    existing ?? {
      userId,
      walletAddress,
      totalRewardLamports: 0,
      completedChallengeIds: [],
      completedChallenges: [],
    };
  profile.walletAddress = walletAddress;
  memoryProfiles.set(userId, profile);
  return profile;
}

async function recordCompletion(
  userId: string,
  walletAddress: string,
  challengeId: string,
  completion: CompletionRecord
): Promise<RewardProfileSnapshot> {
  if (isMongoReady()) {
    const profile = await RewardProfile.findOneAndUpdate(
      { userId },
      {
        $set: { userId, walletAddress },
        $inc: { totalRewardLamports: completion.rewardLamports },
        $addToSet: { completedChallengeIds: challengeId },
        $push: { completedChallenges: { $each: [completion], $position: 0 } },
      },
      { new: true, upsert: true }
    ).lean();

    const challenge = challenges[challengeId];
    await User.findByIdAndUpdate(userId, {
      $inc: { xp: challenge?.xp ?? 0 },
      $addToSet: { completedChallenges: challengeId },
    });

    return {
      userId: profile.userId,
      walletAddress: profile.walletAddress,
      totalRewardLamports: profile.totalRewardLamports,
      completedChallengeIds: profile.completedChallengeIds ?? [],
      completedChallenges: (profile.completedChallenges ?? []).map((entry) => ({
        challengeId: entry.challengeId,
        challengeClub: entry.challengeClub,
        rewardLamports: entry.rewardLamports,
        rewardTxSignature: entry.rewardTxSignature,
        rewardTxUrl: entry.rewardTxUrl,
        completedAt: new Date(entry.completedAt).toISOString(),
      })),
    };
  }

  const existing = memoryProfiles.get(userId);
  const profile: RewardProfileSnapshot =
    existing ?? {
      userId,
      walletAddress,
      totalRewardLamports: 0,
      completedChallengeIds: [],
      completedChallenges: [],
    };
  profile.walletAddress = walletAddress;
  profile.totalRewardLamports += completion.rewardLamports;
  if (!profile.completedChallengeIds.includes(challengeId)) {
    profile.completedChallengeIds.push(challengeId);
  }
  profile.completedChallenges.unshift(completion);
  memoryProfiles.set(userId, profile);
  return profile;
}

async function sendLamports(toWallet: string, lamports: number) {
  const treasury = getTreasuryKeypair();
  if (!treasury) {
    throw new Error(
      "Treasury wallet is not configured. Set SOLANA_REWARD_TREASURY_SECRET_KEY in backend/.env."
    );
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: new PublicKey(toWallet),
      lamports,
    })
  );

  return sendAndConfirmTransaction(connection, transaction, [treasury], {
    commitment: "confirmed",
  });
}

async function resolvePayoutLamports(
  walletAddress: string,
  configuredLamports: number
) {
  const accountInfo = await connection.getAccountInfo(
    new PublicKey(walletAddress),
    "confirmed"
  );
  if (accountInfo) return configuredLamports;

  const minimumForNewSystemAccount =
    await connection.getMinimumBalanceForRentExemption(0);
  return Math.max(configuredLamports, minimumForNewSystemAccount);
}

app.get("/health", (_req, res) => {
  const treasury = getTreasuryKeypair();

  res.json({
    ok: true,
    rpcUrl,
    explorerCluster: explorerClusterFromRpcUrl(rpcUrl),
    mongoState: mongoose.connection.readyState,
    treasuryConfigured: Boolean(treasury),
    treasuryPublicKey: treasury?.publicKey.toBase58() ?? null,
    treasuryEnvPresent: Boolean(process.env.SOLANA_REWARD_TREASURY_SECRET_KEY),
    demoUserId,
    demoUserWallet: demoUserWallet || null,
    usingMongo: isMongoReady(),
  });
});

/**
 * -------------------------
 * Game Logic Routes
 * -------------------------
 */

// GET challenge by ID (do not leak solution)
app.get("/challenges/:id", (req, res) => {
  const { id } = req.params;
  const normalizedId = id.toUpperCase();
  const challenge = challenges[normalizedId];

  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const { solution, ...safeChallenge } = challenge;
  return res.json(safeChallenge);
});

// Start a challenge (marks progress)
app.post("/challenges/:id/start", (req, res) => {
  const challengeId = req.params.id.toUpperCase();
  const challenge = challenges[challengeId];
  const body = req.body as { userId?: string };

  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const userId = (body.userId?.trim() || demoUserId).trim();
  if (!userProgress[userId]) userProgress[userId] = {};
  userProgress[userId][challengeId] = "started";

  return res.json({
    success: true,
    message: "Challenge started",
    userId,
    challengeId,
  });
});

// Submit an answer
// ✅ quiz works automatically because it has options + solution
// ✅ non-solution challenges auto-pass and auto-reward
app.post("/challenges/:id/submit", async (req, res) => {
  const challengeId = req.params.id.toUpperCase();
  const challenge = challenges[challengeId];
  const body = req.body as {
    userId?: string;
    answer?: string;
    walletAddress?: string;
  };

  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const userId = (body.userId?.trim() || demoUserId).trim();

  if (userProgress[userId]?.[challengeId] !== "started") {
    return res.status(400).json({ error: "Challenge not started yet" });
  }

  // Determine pass/fail
  let passed = false;
  if (!challenge.solution) {
    passed = true; // auto-pass for non-solution missions
  } else {
    const answer = (body.answer ?? "").trim();
    passed = answer.toLowerCase() === challenge.solution.trim().toLowerCase();
  }

  if (!passed) {
    return res.json({
      success: false,
      message: "Incorrect, try again.",
      userId,
      challengeId,
    });
  }

  // Auto reward payout (same logic as /complete)
  const existingProfile = await getRewardProfile(userId);
  const fallbackDemoWallet = userId === demoUserId ? demoUserWallet.trim() : "";
  const walletAddress = (
    body.walletAddress?.trim() ||
    existingProfile?.walletAddress ||
    fallbackDemoWallet
  ).trim();

  if (!walletAddress) {
    return res.status(400).json({
      error:
        "No wallet found. Provide walletAddress or link wallet using /wallets/users/link.",
    });
  }
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  // One reward per user per challenge (but replay returns success)
  if (existingProfile?.completedChallengeIds?.includes(challengeId)) {
    userProgress[userId][challengeId] = "completed";
    return res.json({
      success: true,
      message: "Completed! Reward already claimed for this user.",
      challengeId,
      userId,
      walletAddress,
      xp: challenge.xp,
      alreadyClaimed: true,
    });
  }

  try {
    const rewardLamports = await resolvePayoutLamports(
      walletAddress,
      challenge.rewardLamports
    );
    const rewardTxSignature = await sendLamports(walletAddress, rewardLamports);

    const completion: CompletionRecord = {
      challengeId,
      challengeClub: challenge.club,
      rewardLamports,
      rewardTxSignature,
      rewardTxUrl: txExplorerUrl(rewardTxSignature),
      completedAt: new Date().toISOString(),
    };

    const profile = await recordCompletion(
      userId,
      walletAddress,
      challengeId,
      completion
    );

    userProgress[userId][challengeId] = "completed";

    return res.json({
      success: true,
      message: "Completed! Reward sent.",
      challengeId,
      userId,
      walletAddress,
      xp: challenge.xp,
      rewardLamports,
      rewardSol: toSol(rewardLamports),
      rewardTxSignature,
      rewardTxUrl: txExplorerUrl(rewardTxSignature),
      totalRewardLamports: profile.totalRewardLamports,
      totalRewardSol: toSol(profile.totalRewardLamports),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reward transfer failed";
    return res.status(500).json({ error: message });
  }
});

/**
 * -------------------------
 * Existing Wallet/Profile Routes
 * -------------------------
 */
app.post("/wallets/users/link", async (req, res) => {
  const { userId, walletAddress } = req.body as {
    userId?: string;
    walletAddress?: string;
  };

  if (!userId || !walletAddress) {
    return res.status(400).json({ error: "userId and walletAddress are required" });
  }
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  const profile = await upsertWalletProfile(userId.trim(), walletAddress.trim());

  return res.json({
    success: true,
    userId: profile.userId,
    walletAddress: profile.walletAddress,
  });
});

app.get("/users/:userId/profile", async (req, res) => {
  const userId = req.params.userId.trim();
  const profile = await getRewardProfile(userId);

  if (!profile) {
    return res
      .status(404)
      .json({ error: "User profile not found. Complete a challenge first." });
  }

  return res.json(normalizeProfile(profile));
});

// Keep your original complete endpoint (still usable if client calls it directly)
app.post("/challenges/:id/complete", async (req, res) => {
  const challengeId = req.params.id.toUpperCase();
  const challenge = challenges[challengeId];
  const body = req.body as { userId?: string; walletAddress?: string };

  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const userId = (body.userId?.trim() || demoUserId).trim();
  const existingProfile = await getRewardProfile(userId);
  const fallbackDemoWallet = userId === demoUserId ? demoUserWallet.trim() : "";
  const walletAddress = (
    body.walletAddress?.trim() ||
    existingProfile?.walletAddress ||
    fallbackDemoWallet
  ).trim();

  if (!walletAddress) {
    return res.status(400).json({
      error:
        "No wallet found. Provide walletAddress or link wallet using /wallets/users/link.",
    });
  }
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  if (existingProfile?.completedChallengeIds?.includes(challengeId)) {
    return res
      .status(409)
      .json({ error: "Challenge already completed for this user." });
  }

  try {
    const rewardLamports = await resolvePayoutLamports(
      walletAddress,
      challenge.rewardLamports
    );
    const rewardTxSignature = await sendLamports(walletAddress, rewardLamports);

    const completion: CompletionRecord = {
      challengeId,
      challengeClub: challenge.club,
      rewardLamports,
      rewardTxSignature,
      rewardTxUrl: txExplorerUrl(rewardTxSignature),
      completedAt: new Date().toISOString(),
    };

    const profile = await recordCompletion(
      userId,
      walletAddress,
      challengeId,
      completion
    );

    return res.json({
      success: true,
      challengeId,
      userId,
      walletAddress,
      rewardLamports,
      rewardSol: toSol(rewardLamports),
      rewardTxSignature,
      rewardTxUrl: txExplorerUrl(rewardTxSignature),
      totalRewardLamports: profile.totalRewardLamports,
      totalRewardSol: toSol(profile.totalRewardLamports),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reward transfer failed";
    return res.status(500).json({ error: message });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend running at http://0.0.0.0:${port}`);
});
