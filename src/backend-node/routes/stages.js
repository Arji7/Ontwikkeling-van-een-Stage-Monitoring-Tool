const express = require('express');
const router = express.Router();

// GET /api/stages
router.get('/', (req, res) => {
  res.json({ bericht: 'alle stages ophalen — nog te implementeren' });
});

// GET /api/stages/:id
router.get('/:id', (req, res) => {
  res.json({ bericht: `stage ${req.params.id} ophalen — nog te implementeren` });
});

// POST /api/stages
router.post('/', (req, res) => {
  res.json({ bericht: 'stage indienen — nog te implementeren' });
});

// PUT /api/stages/:id/status
router.put('/:id/status', (req, res) => {
  res.json({ bericht: `status van stage ${req.params.id} wijzigen — nog te implementeren` });
});

module.exports = router;
