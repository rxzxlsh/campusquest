import express from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'campusquest_secret';

const getUser = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

// get user profile
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const decoded = getUser(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  try {
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// get leaderboard by sorting users by xp
router.get('/leaderboard', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const decoded = getUser(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  try {
    const users = await User.find()
      .sort({ xp: -1 }) // sort in descending order
      .limit(15)
      .select('username xp completedChallenges')
      .lean();

    const leaderboard = users.map(u => ({
      id: u._id,
      username: u.username || 'Anonymous CampusQuestor',
      xp: u.xp || 0,
      challengesCompleted: u.completedChallenges?.length || 0,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
