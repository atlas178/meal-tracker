const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const db = getDb();
  const foods = db.prepare(`
    SELECT * FROM foods
    WHERE (user_id IS NULL OR user_id = ?) AND name LIKE ?
    ORDER BY CASE WHEN user_id IS NULL THEN 0 ELSE 1 END, name
    LIMIT 50
  `).all(req.userId, `%${q}%`);

  res.json({ foods });
});

router.get('/', (req, res) => {
  const db = getDb();
  const foods = db.prepare(`
    SELECT * FROM foods WHERE user_id IS NULL OR user_id = ?
    ORDER BY name LIMIT 100
  `).all(req.userId);
  res.json({ foods });
});

router.post('/', (req, res) => {
  const { name, brand, calories, protein, carbs, fats, serving_size, serving_unit } = req.body;
  if (!name || calories == null || protein == null || carbs == null || fats == null) {
    return res.status(400).json({ error: 'Name, calories, protein, carbs, and fats are required' });
  }

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO foods (name, brand, calories, protein, carbs, fats, serving_size, serving_unit, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, brand || '', calories, protein, carbs, fats, serving_size || 100, serving_unit || 'g', req.userId);

  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ food });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM foods WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Food not found or not deletable' });
  res.json({ success: true });
});

module.exports = router;
