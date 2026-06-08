const express = require('express');
const router = express.Router();

// GET /api/evaluaties/:stageId
router.get('/:stageId', (req, res) => {
  res.json({ bericht: 'evaluaties ophalen — nog te implementeren' });
});

// POST /api/evaluaties
router.post('/', (req, res) => {
  res.json({ bericht: 'evaluatie aanmaken — nog te implementeren' });
});

module.exports = router;
