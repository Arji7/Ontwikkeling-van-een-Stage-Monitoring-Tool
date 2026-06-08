const express = require('express');
const router = express.Router();

// GET /api/logboeken/:stageId
router.get('/:stageId', (req, res) => {
  res.json({ bericht: 'logboeken ophalen — nog te implementeren' });
});

// POST /api/logboeken
router.post('/', (req, res) => {
  res.json({ bericht: 'logboek aanmaken — nog te implementeren' });
});

// PUT /api/logboeken/:id/aftekenen
router.put('/:id/aftekenen', (req, res) => {
  res.json({ bericht: 'logboek aftekenen door mentor — nog te implementeren' });
});

module.exports = router;
