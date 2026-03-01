const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { date, start_date, end_date } = req.query;
  const db = getDb();

  if (date) {
    const meals = db.prepare(`
      SELECT m.id, m.meal_type, m.servings, m.date, m.created_at,
        f.id as food_id, f.name as food_name, f.brand, f.calories, f.protein, f.carbs, f.fats,
        f.serving_size, f.serving_unit,
        ROUND(f.calories * m.servings, 1) as total_calories,
        ROUND(f.protein * m.servings, 1) as total_protein,
        ROUND(f.carbs * m.servings, 1) as total_carbs,
        ROUND(f.fats * m.servings, 1) as total_fats
      FROM meals m JOIN foods f ON m.food_id = f.id
      WHERE m.user_id = ? AND m.date = ?
      ORDER BY m.meal_type, m.created_at
    `).all(req.userId, date);
    return res.json({ meals });
  }

  if (start_date && end_date) {
    const meals = db.prepare(`
      SELECT m.id, m.meal_type, m.servings, m.date, m.created_at,
        f.id as food_id, f.name as food_name, f.brand, f.calories, f.protein, f.carbs, f.fats,
        f.serving_size, f.serving_unit,
        ROUND(f.calories * m.servings, 1) as total_calories,
        ROUND(f.protein * m.servings, 1) as total_protein,
        ROUND(f.carbs * m.servings, 1) as total_carbs,
        ROUND(f.fats * m.servings, 1) as total_fats
      FROM meals m JOIN foods f ON m.food_id = f.id
      WHERE m.user_id = ? AND m.date BETWEEN ? AND ?
      ORDER BY m.date DESC, m.meal_type, m.created_at
    `).all(req.userId, start_date, end_date);
    return res.json({ meals });
  }

  const meals = db.prepare(`
    SELECT m.id, m.meal_type, m.servings, m.date, m.created_at,
      f.id as food_id, f.name as food_name, f.brand,
      ROUND(f.calories * m.servings, 1) as total_calories,
      ROUND(f.protein * m.servings, 1) as total_protein,
      ROUND(f.carbs * m.servings, 1) as total_carbs,
      ROUND(f.fats * m.servings, 1) as total_fats
    FROM meals m JOIN foods f ON m.food_id = f.id
    WHERE m.user_id = ?
    ORDER BY m.date DESC, m.meal_type, m.created_at
    LIMIT 100
  `).all(req.userId);
  res.json({ meals });
});

router.get('/daily-summary', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  const db = getDb();
  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(ROUND(f.calories * m.servings, 1)), 0) as total_calories,
      COALESCE(SUM(ROUND(f.protein * m.servings, 1)), 0) as total_protein,
      COALESCE(SUM(ROUND(f.carbs * m.servings, 1)), 0) as total_carbs,
      COALESCE(SUM(ROUND(f.fats * m.servings, 1)), 0) as total_fats
    FROM meals m JOIN foods f ON m.food_id = f.id
    WHERE m.user_id = ? AND m.date = ?
  `).get(req.userId, date);
  res.json({ summary });
});

router.get('/weekly-summary', (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }

  const db = getDb();
  const days = db.prepare(`
    SELECT m.date,
      COALESCE(SUM(ROUND(f.calories * m.servings, 1)), 0) as total_calories,
      COALESCE(SUM(ROUND(f.protein * m.servings, 1)), 0) as total_protein,
      COALESCE(SUM(ROUND(f.carbs * m.servings, 1)), 0) as total_carbs,
      COALESCE(SUM(ROUND(f.fats * m.servings, 1)), 0) as total_fats
    FROM meals m JOIN foods f ON m.food_id = f.id
    WHERE m.user_id = ? AND m.date BETWEEN ? AND ?
    GROUP BY m.date
    ORDER BY m.date
  `).all(req.userId, start_date, end_date);
  res.json({ days });
});

router.post('/', (req, res) => {
  const { food_id, meal_type, servings, date } = req.body;
  if (!food_id || !meal_type || !date) {
    return res.status(400).json({ error: 'food_id, meal_type, and date are required' });
  }

  const db = getDb();
  const food = db.prepare('SELECT id FROM foods WHERE id = ?').get(food_id);
  if (!food) return res.status(404).json({ error: 'Food not found' });

  const result = db.prepare(
    'INSERT INTO meals (user_id, food_id, meal_type, servings, date) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, food_id, meal_type, servings || 1, date);

  const meal = db.prepare(`
    SELECT m.id, m.meal_type, m.servings, m.date, m.created_at,
      f.id as food_id, f.name as food_name, f.brand, f.calories, f.protein, f.carbs, f.fats,
      f.serving_size, f.serving_unit,
      ROUND(f.calories * m.servings, 1) as total_calories,
      ROUND(f.protein * m.servings, 1) as total_protein,
      ROUND(f.carbs * m.servings, 1) as total_carbs,
      ROUND(f.fats * m.servings, 1) as total_fats
    FROM meals m JOIN foods f ON m.food_id = f.id WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ meal });
});

router.put('/:id', (req, res) => {
  const { servings, meal_type } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM meals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Meal not found' });

  db.prepare('UPDATE meals SET servings = COALESCE(?, servings), meal_type = COALESCE(?, meal_type) WHERE id = ?')
    .run(servings, meal_type, req.params.id);

  const meal = db.prepare(`
    SELECT m.id, m.meal_type, m.servings, m.date, m.created_at,
      f.id as food_id, f.name as food_name, f.brand,
      ROUND(f.calories * m.servings, 1) as total_calories,
      ROUND(f.protein * m.servings, 1) as total_protein,
      ROUND(f.carbs * m.servings, 1) as total_carbs,
      ROUND(f.fats * m.servings, 1) as total_fats
    FROM meals m JOIN foods f ON m.food_id = f.id WHERE m.id = ?
  `).get(req.params.id);

  res.json({ meal });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Meal not found' });
  res.json({ success: true });
});

module.exports = router;
