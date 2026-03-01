const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, hash, name);
  const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const user = db.prepare('SELECT id, email, name, calorie_goal, protein_goal, carbs_goal, fats_goal FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, calorie_goal, protein_goal, carbs_goal, fats_goal, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.put('/profile', authenticate, (req, res) => {
  const { name, calorie_goal, protein_goal, carbs_goal, fats_goal } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE users SET name = COALESCE(?, name), calorie_goal = COALESCE(?, calorie_goal),
    protein_goal = COALESCE(?, protein_goal), carbs_goal = COALESCE(?, carbs_goal),
    fats_goal = COALESCE(?, fats_goal) WHERE id = ?
  `).run(name, calorie_goal, protein_goal, carbs_goal, fats_goal, req.userId);

  const user = db.prepare('SELECT id, email, name, calorie_goal, protein_goal, carbs_goal, fats_goal FROM users WHERE id = ?').get(req.userId);
  res.json({ user });
});

module.exports = router;
