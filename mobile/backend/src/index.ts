import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import userRoutes from "./routes/users";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  campusCoins: number;
  solution: string; // Add the correct answer
};

const challenges: { [key: string]: Challenge } = {
  CODING_001: {
    id: "CODING_001",
    club: "Coding Club",
    type: "puzzle",
    description: "Decrypt this simple cipher: A=B, B=C, C=D...",
    xp: 50,
    campusCoins: 100,
    solution: "BCD", // For testing
  },
  PHOTO_001: {
    id: "PHOTO_001",
    club: "Photography Club",
    type: "puzzle",
    description: "Type the word 'Symmetry' as a test puzzle",
    xp: 30,
    campusCoins: 50,
    solution: "Symmetry",
  },
};

// Hard-coded wallet
const testWallet = "0xTESTWALLET";

const userProgress: { [wallet: string]: { [challengeId: string]: "started" | "completed" } } = {};

app.get("/challenges/:id", (req, res) => {
  const { id } = req.params;
  const challenge = challenges[id];
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });
  res.json(challenge);
});

app.post("/challenges/:id/start", (req, res) => {
  const { id } = req.params;
  if (!challenges[id]) return res.status(404).json({ error: "Challenge not found" });

  if (!userProgress[testWallet]) userProgress[testWallet] = {};
  userProgress[testWallet][id] = "started";

  console.log(`${testWallet} started ${id}`);
  res.json({ message: "Challenge started" });
});

app.post("/challenges/:id/submit", (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  if (!challenges[id]) return res.status(404).json({ error: "Challenge not found" });

  if (!userProgress[testWallet]?.[id] || userProgress[testWallet][id] !== "started") {
    return res.status(400).json({ error: "Challenge not started yet" });
  }

  const challenge = challenges[id];

  if (answer.trim().toLowerCase() === challenge.solution.trim().toLowerCase()) {
    userProgress[testWallet][id] = "completed";
    console.log(`${testWallet} completed ${id}, earned ${challenge.xp} XP & ${challenge.campusCoins} CampusCoins`);
    res.json({ message: "Correct!", xp: challenge.xp, campusCoins: challenge.campusCoins });
  } else {
    res.json({ message: "Incorrect, try again." });
  }
});

app.use('/api/users', userRoutes);

app.listen(3000, "0.0.0.0", () => {
  console.log("Backend running at http://0.0.0.0:3000");
});