const express = require('express');
const router = express.Router();

const SECRET = process.env.AGENT_STATUS_SECRET || 'openclaw-mission-control-2026';

// Default notification rules
let rules = [
  { id: 'cost-daily',     label: 'Daily cost exceeds $2',           enabled: true,  threshold: 2,     unit: 'USD',  check: 'cost_daily'    },
  { id: 'blocked-24h',    label: 'Agent blocked > 24 hours',        enabled: true,  threshold: 86400, unit: 'sec',  check: 'blocked_time'  },
  { id: 'ctx-80pct',      label: 'Context window > 80% used',       enabled: true,  threshold: 80,    unit: 'pct',  check: 'ctx_window'    },
  { id: 'no-activity-8h', label: 'No agent activity > 8 hours',     enabled: false, threshold: 28800, unit: 'sec',  check: 'idle_time'     },
  { id: 'build-failed',   label: 'EAS build failure detected',       enabled: true,  threshold: 0,     unit: 'bool', check: 'build_failed'  },
  { id: 'cost-monthly',   label: 'Monthly cost exceeds $50',         enabled: true,  threshold: 50,    unit: 'USD',  check: 'cost_monthly'  },
];

// GET rules
router.get('/', (req, res) => res.json({ rules }));

// PATCH rule
router.patch('/:id', (req, res) => {
  const secret = req.headers['x-agent-secret'] || req.body.secret;
  if (secret !== SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const rule = rules.find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });

  if (typeof req.body.enabled === 'boolean') rule.enabled = req.body.enabled;
  if (typeof req.body.threshold === 'number') rule.threshold = req.body.threshold;

  res.json({ ok: true, rule });
});

module.exports = router;
