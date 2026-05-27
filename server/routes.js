const { Router } = require('express');
const { getAllState, getState, putState, putStateBatch } = require('./db');

const router = Router();

router.get('/state', (_req, res) => {
  try {
    const data = getAllState();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/state/:key', (req, res) => {
  try {
    const row = getState(req.params.key);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/state/:key', (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'Missing value' });
    putState(req.params.key, typeof value === 'string' ? value : JSON.stringify(value));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/state', (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || typeof entries !== 'object') return res.status(400).json({ error: 'Missing entries' });
    const stringified = {};
    for (const [k, v] of Object.entries(entries)) {
      stringified[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    putStateBatch(stringified);
    res.json({ ok: true, count: Object.keys(stringified).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
