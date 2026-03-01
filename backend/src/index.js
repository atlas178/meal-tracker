require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDb } = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initializeDb();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/families', require('./routes/families'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Meal Tracker API running on http://localhost:${PORT}`);
});
