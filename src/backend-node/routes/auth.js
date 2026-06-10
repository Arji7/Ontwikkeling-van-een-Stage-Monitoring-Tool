const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, wachtwoord } = req.body;

  // 1. Validatie
  if (!email || !wachtwoord) {
    return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
  }

  try {
    // 2. Gebruiker ophalen uit database
    const [rows] = await db.query(
      `SELECT g.*, GROUP_CONCAT(r.naam) AS rollen
       FROM gebruiker g
       LEFT JOIN gebruiker_rol gr ON gr.gebruiker_id = g.id
       LEFT JOIN rol r ON r.id = gr.rol_id
       WHERE g.email = ? AND g.actief = true
       GROUP BY g.id`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Ongeldig email of wachtwoord' });
    }

    const gebruiker = rows[0];

    // 3. Wachtwoord controleren
    const wachtwoordKlopt = await bcrypt.compare(wachtwoord, gebruiker.wachtwoord_hash);
    if (!wachtwoordKlopt) {
      return res.status(401).json({ error: 'Ongeldig email of wachtwoord' });
    }

    // 4. JWT token aanmaken
    const token = jwt.sign(
      {
        id:     gebruiker.id,
        email:  gebruiker.email,
        rollen: gebruiker.rollen ? gebruiker.rollen.split(',') : []
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 5. Antwoord sturen
    res.json({
      token,
      gebruiker: {
        id:        gebruiker.id,
        voornaam:  gebruiker.voornaam,
        achternaam: gebruiker.achternaam,
        email:     gebruiker.email,
        rollen:    gebruiker.rollen ? gebruiker.rollen.split(',') : []
      }
    });

  } catch (err) {
    console.error('Login fout:', err);
    res.status(500).json({ error: 'Server fout' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Uitgelogd' });
});

module.exports = router;
