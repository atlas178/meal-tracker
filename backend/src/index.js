require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDb } = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve frontend static files
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

async function start() {
  await initializeDb();

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/meals', require('./routes/meals'));
  app.use('/api/foods', require('./routes/foods'));
  app.use('/api/families', require('./routes/families'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Meal Tracker running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
