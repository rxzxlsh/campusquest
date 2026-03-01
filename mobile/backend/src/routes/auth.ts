import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'campusquest_secret';
const UOFT_DOMAINS = ['utoronto.ca', 'mail.utoronto.ca'];

const isUofTEmail = (email: string) => {
  const domain = email.split('@')[1];
  return UOFT_DOMAINS.includes(domain);
};

router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;

  if (!isUofTEmail(email)) {
    return res.status(403).json({ error: '🎓 UofT students only. Use @utoronto.ca or @mail.utoronto.ca' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, username });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
  } catch (err: any) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
});

export default router;