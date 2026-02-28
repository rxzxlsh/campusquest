import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ✅ TypeScript-safe challenge store
const challenges: { [key: string]: { prompt: string; xp: number; club: string } } = {
  CODING_001: { prompt: "Decrypt this cipher", xp: 50, club: "Coding Club" },
  PHOTO_001: { prompt: "Capture symmetry", xp: 30, club: "Photography Club" },
};

// GET challenge by ID
app.get("/challenges/:id", (req, res) => {
  const { id } = req.params;              // <--- Extract the id first
  const challenge = challenges[id];       // <--- Here is the TS-safe access

  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  res.json(challenge);
});

// POST simulate challenge completion
app.post("/challenges/:id/complete", (req, res) => {
  const { id } = req.params;
  const { walletAddress } = req.body;

  const challenge = challenges[id];       // <--- Same TS-safe access
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  // Normally: increment XP, mint NFT, etc.
  res.json({ success: true, id, walletAddress });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Backend running at http://0.0.0.0:3000");
});