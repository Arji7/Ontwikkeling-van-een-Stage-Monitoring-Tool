const express = require('express');
const router = express.Router();

// GET /api/competenties
router.get('/', (req, res) => {
  res.json({ bericht: 'alle competenties ophalen — nog te implementeren' });
});

// POST /api/competenties
router.post('/', (req, res) => {
  res.json({ bericht: 'competentie aanmaken — nog te implementeren' });
});

// PUT /api/competenties/:id
router.put('/:id', (req, res) => {
  res.json({ bericht: `competentie ${req.params.id} wijzigen — nog te implementeren` });
});

// DELETE /api/competenties/:id
router.delete('/:id', (req, res) => {
  res.json({ bericht: `competentie ${req.params.id} verwijderen — nog te implementeren` });
});

module.exports = router;
