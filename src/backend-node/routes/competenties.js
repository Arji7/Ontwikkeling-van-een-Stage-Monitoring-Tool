const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('../middleware/authMiddelware');

// GET /api/competenties — alle competenties ophalen
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, naam, beschrijving, volgorde FROM competentie ORDER BY volgorde ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Competenties ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
