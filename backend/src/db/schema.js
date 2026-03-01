const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'meal-tracker.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      calorie_goal INTEGER DEFAULT 2000,
      protein_goal INTEGER DEFAULT 150,
      carbs_goal INTEGER DEFAULT 250,
      fats_goal INTEGER DEFAULT 65,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT DEFAULT '',
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL,
      serving_size REAL DEFAULT 100,
      serving_unit TEXT DEFAULT 'g',
      user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      food_id INTEGER NOT NULL,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      servings REAL NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (food_id) REFERENCES foods(id)
    );

    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      joined_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(family_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
    CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
  `);

  seedFoods(db);
}

function seedFoods(db) {
  const count = db.prepare('SELECT COUNT(*) as count FROM foods WHERE user_id IS NULL').get();
  if (count.count > 0) return;

  const foods = [
    ['Chicken Breast (grilled)', '', 165, 31, 0, 3.6, 100, 'g'],
    ['Brown Rice (cooked)', '', 123, 2.7, 25.6, 1, 100, 'g'],
    ['Broccoli (steamed)', '', 35, 2.4, 7.2, 0.4, 100, 'g'],
    ['Salmon (baked)', '', 208, 20, 0, 13, 100, 'g'],
    ['Sweet Potato (baked)', '', 90, 2, 21, 0.1, 100, 'g'],
    ['Egg (large, whole)', '', 155, 13, 1.1, 11, 100, 'g'],
    ['Greek Yogurt (plain)', '', 59, 10, 3.6, 0.4, 100, 'g'],
    ['Banana', '', 89, 1.1, 23, 0.3, 100, 'g'],
    ['Oatmeal (cooked)', '', 68, 2.4, 12, 1.4, 100, 'g'],
    ['Almonds', '', 579, 21, 22, 50, 100, 'g'],
    ['Avocado', '', 160, 2, 9, 15, 100, 'g'],
    ['Whole Wheat Bread', '', 247, 13, 41, 3.4, 100, 'g'],
    ['Tuna (canned in water)', '', 116, 26, 0, 0.8, 100, 'g'],
    ['Apple', '', 52, 0.3, 14, 0.2, 100, 'g'],
    ['Cottage Cheese (low-fat)', '', 72, 12, 2.7, 1, 100, 'g'],
    ['Quinoa (cooked)', '', 120, 4.4, 21, 1.9, 100, 'g'],
    ['Turkey Breast (roasted)', '', 135, 30, 0, 0.7, 100, 'g'],
    ['Spinach (raw)', '', 23, 2.9, 3.6, 0.4, 100, 'g'],
    ['Peanut Butter', '', 588, 25, 20, 50, 100, 'g'],
    ['Milk (whole)', '', 61, 3.2, 4.8, 3.3, 100, 'ml'],
    ['Milk (skim)', '', 34, 3.4, 5, 0.1, 100, 'ml'],
    ['Cheddar Cheese', '', 403, 25, 1.3, 33, 100, 'g'],
    ['White Rice (cooked)', '', 130, 2.7, 28, 0.3, 100, 'g'],
    ['Pasta (cooked)', '', 131, 5, 25, 1.1, 100, 'g'],
    ['Olive Oil', '', 884, 0, 0, 100, 15, 'ml'],
    ['Steak (sirloin, grilled)', '', 271, 26, 0, 18, 100, 'g'],
    ['Tofu (firm)', '', 144, 17, 3, 9, 100, 'g'],
    ['Lentils (cooked)', '', 116, 9, 20, 0.4, 100, 'g'],
    ['Blueberries', '', 57, 0.7, 14, 0.3, 100, 'g'],
    ['Protein Shake (whey)', 'Generic', 120, 24, 3, 1.5, 1, 'scoop'],
  ];

  const insert = db.prepare(
    'INSERT INTO foods (name, brand, calories, protein, carbs, fats, serving_size, serving_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction((foods) => {
    for (const food of foods) insert.run(...food);
  });

  insertMany(foods);
}

module.exports = { getDb, initializeDb };
