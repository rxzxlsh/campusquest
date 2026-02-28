import express from 'express';
import { checkJwt } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Get or create user profile
router.post('/profile', checkJwt, async (req, res) => {
  try {
    const payload = (req.auth?.payload ?? {}) as { sub?: string; email?: string };
    const auth0Id = payload.sub;
    const email = payload.email;

    if (!auth0Id || !email) {
      return res.status(401).json({ error: 'Invalid auth payload' });
    }

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
    const payload = (req.auth?.payload ?? {}) as { sub?: string };
    const auth0Id = payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: 'Invalid auth payload' });
    }
    const user = await User.findOne({ auth0Id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
