const express = require('express');
const router = express.Router();

// GET /api/gebruikers
router.get('/', (req, res) => {
  res.json({ bericht: 'alle gebruikers ophalen — nog te implementeren' });
});

// GET /api/gebruikers/:id
router.get('/:id', (req, res) => {
  res.json({ bericht: `gebruiker ${req.params.id} ophalen — nog te implementeren` });
});

module.exports = router;
