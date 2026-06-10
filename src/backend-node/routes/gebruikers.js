const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('../middleware/authMiddelware');

// GET /api/gebruikers/docenten — alle docenten ophalen
router.get('/docenten', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.id, g.voornaam, g.achternaam, d.id AS docent_id
       FROM gebruiker g
       JOIN docent d ON d.gebruiker_id = g.id`
    );
    res.json(rows);
  } catch (err) {
    console.error('Docenten ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
