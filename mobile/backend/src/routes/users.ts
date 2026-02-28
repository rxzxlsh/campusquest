import express from 'express';
import { checkJwt } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Get or create user profile
router.post('/profile', checkJwt, async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    const email = req.auth?.payload.email as string;

    let user = await User.findOne({ auth0Id });
    if (!user) {
      user = await User.create({ auth0Id, email });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/profile', checkJwt, async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    const user = await User.findOne({ auth0Id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;