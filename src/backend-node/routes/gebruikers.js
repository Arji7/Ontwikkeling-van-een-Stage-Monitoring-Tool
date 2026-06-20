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

// GET /api/gebruikers/mentoren — alle mentoraccounts ophalen
router.get('/mentoren', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.id AS gebruiker_id,
              g.voornaam,
              g.achternaam,
              g.email,
              m.id AS mentor_id,
              m.bedrijf_id,
              b.naam AS bedrijf_naam
       FROM mentor m
       JOIN gebruiker g ON g.id = m.gebruiker_id
       LEFT JOIN bedrijf b ON b.id = m.bedrijf_id
       WHERE g.actief = TRUE
       ORDER BY g.voornaam, g.achternaam`
    );
    res.json(rows);
  } catch (err) {
    console.error('Mentoren ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
