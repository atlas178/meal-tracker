const express = require('express');
const router = express.Router();

const SECRET = process.env.AGENT_STATUS_SECRET || 'openclaw-mission-control-2026';

// Latest session health posted by OpenClaw
let sessionHealth = null;

// GET — read current session health
router.get('/', (req, res) => {
  if (!sessionHealth) {
    return res.json({
      model: null,
      tokensUsed: 0,
      contextWindow: 200000,
      updatedAt: new Date().toISOString(),
      message: 'No data yet — OpenClaw will post when active',
    });
  }
  res.json(sessionHealth);
});

// POST — OpenClaw writes its session health here
router.post('/', (req, res) => {
  const secret = req.headers['x-agent-secret'] || req.body.secret;
  if (secret !== SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const { model, tokensUsed, contextWindow } = req.body;
  sessionHealth = {
    model: model || 'claude-sonnet-4-6',
    tokensUsed: tokensUsed || 0,
    contextWindow: contextWindow || 200000,
    updatedAt: new Date().toISOString(),
  };

  res.json({ ok: true, health: sessionHealth });
});

module.exports = router;
