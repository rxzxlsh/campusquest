import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import userRoutes from "./routes/users";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  campusCoins: number;
};

const challenges: { [key: string]: Challenge } = {
  CODING_001: {
    id: "CODING_001",
    club: "Coding Club",
    type: "puzzle",
    description: "Decrypt this cipher hidden in the QR",
    xp: 50,
    campusCoins: 100,
  },
  PHOTO_001: {
    id: "PHOTO_001",
    club: "Photography Club",
    type: "photo",
    description: "Capture symmetry on campus",
    xp: 30,
    campusCoins: 50,
  },
  FIT_001: {
    id: "FIT_001",
    club: "Fitness Club",
    type: "fitness",
    description: "Design a faster walking path between X and Y",
    xp: 40,
    campusCoins: 70,
  },
};
// GET challenge by ID
app.get("/challenges/:id", (req, res) => {
  const { id } = req.params;
  const challenge = challenges[id];
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });
  res.json(challenge);
});

// POST simulate challenge completion
app.post("/challenges/:id/complete", (req, res) => {
  const { id } = req.params;
  const { walletAddress } = req.body;
  const challenge = challenges[id];    
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  // Normally: increment XP, mint NFT, etc.
  res.json({ success: true, id, walletAddress });
});

app.use('/api/users', userRoutes);

app.listen(3000, "0.0.0.0", () => {
  console.log("Backend running at http://0.0.0.0:3000");
});