const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDb();
  const families = db.prepare(`
    SELECT f.id, f.name, f.invite_code, f.created_by, fm.role
    FROM families f
    JOIN family_members fm ON f.id = fm.family_id
    WHERE fm.user_id = ?
  `).all(req.userId);
  res.json({ families });
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Family name is required' });

  const db = getDb();
  const inviteCode = crypto.randomBytes(4).toString('hex');

  const insertFamily = db.transaction(() => {
    const result = db.prepare('INSERT INTO families (name, created_by, invite_code) VALUES (?, ?, ?)').run(name, req.userId, inviteCode);
    db.prepare('INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.userId, 'admin');
    return result.lastInsertRowid;
  });

  const familyId = insertFamily();
  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
  res.status(201).json({ family });
});

router.post('/join', (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code) return res.status(400).json({ error: 'Invite code is required' });

  const db = getDb();
  const family = db.prepare('SELECT * FROM families WHERE invite_code = ?').get(invite_code);
  if (!family) return res.status(404).json({ error: 'Invalid invite code' });

  const existing = db.prepare('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?').get(family.id, req.userId);
  if (existing) return res.status(409).json({ error: 'Already a member of this family' });

  db.prepare('INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)').run(family.id, req.userId, 'member');
  res.json({ family });
});

router.get('/:id/members', (req, res) => {
  const db = getDb();

  const membership = db.prepare('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!membership) return res.status(403).json({ error: 'Not a member of this family' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, fm.role, fm.joined_at
    FROM family_members fm JOIN users u ON fm.user_id = u.id
    WHERE fm.family_id = ?
    ORDER BY fm.joined_at
  `).all(req.params.id);
  res.json({ members });
});

router.get('/:id/members/:userId/summary', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  const db = getDb();
  const membership = db.prepare('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!membership) return res.status(403).json({ error: 'Not a member of this family' });

  const targetMembership = db.prepare('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?').get(req.params.id, req.params.userId);
  if (!targetMembership) return res.status(404).json({ error: 'User is not in this family' });

  const targetUser = db.prepare('SELECT id, name, calorie_goal, protein_goal, carbs_goal, fats_goal FROM users WHERE id = ?').get(req.params.userId);
  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(ROUND(f.calories * m.servings, 1)), 0) as total_calories,
      COALESCE(SUM(ROUND(f.protein * m.servings, 1)), 0) as total_protein,
      COALESCE(SUM(ROUND(f.carbs * m.servings, 1)), 0) as total_carbs,
      COALESCE(SUM(ROUND(f.fats * m.servings, 1)), 0) as total_fats
    FROM meals m JOIN foods f ON m.food_id = f.id
    WHERE m.user_id = ? AND m.date = ?
  `).get(req.params.userId, date);

  res.json({ user: targetUser, summary });
});

router.delete('/:id/leave', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM family_members WHERE family_id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Not a member' });
  res.json({ success: true });
});

module.exports = router;
