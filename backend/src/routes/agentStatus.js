const express = require('express');
const router = express.Router();

// In-memory agent status store
const agentStatuses = {};

const API_SECRET = process.env.AGENT_STATUS_SECRET || 'openclaw-mission-control-2026';

// GET /api/agent-status — public read
router.get('/', (req, res) => {
  const agents = Object.values(agentStatuses).sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  res.json({ agents, timestamp: new Date().toISOString() });
});

// POST /api/agent-status — write (requires secret)
router.post('/', (req, res) => {
  const secret = req.headers['x-agent-secret'] || req.body.secret;
  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { agentId, name, task, status, metadata } = req.body;
  if (!agentId) return res.status(400).json({ error: 'agentId required' });

  const now = new Date().toISOString();
  agentStatuses[agentId] = {
    agentId,
    name: name || agentId,
    task: task || 'Idle',
    status: status || 'idle',
    metadata: metadata || {},
    startedAt: agentStatuses[agentId]?.startedAt || now,
    updatedAt: now,
  };

  res.json({ ok: true, agent: agentStatuses[agentId] });
});

// DELETE /api/agent-status/:agentId
router.delete('/:agentId', (req, res) => {
  const secret = req.headers['x-agent-secret'] || req.query.secret;
  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  delete agentStatuses[req.params.agentId];
  res.json({ ok: true });
});

module.exports = router;
