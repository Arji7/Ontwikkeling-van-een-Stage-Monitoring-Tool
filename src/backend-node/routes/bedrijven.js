const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware, hasRole } = require('../middleware/authMiddelware');

// GET /api/bedrijven — lijst van bedrijven (voor stage-aanvraag formulier)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, naam, sector, adres, postcode, stad, btw_nummer FROM bedrijf ORDER BY naam ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Bedrijven ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// POST /api/bedrijven — nieuw bedrijf aanmaken (admin)
router.post('/', authMiddleware, hasRole('admin'), async (req, res) => {
  const { naam, sector, adres, postcode, stad, btw_nummer } = req.body;
  if (!naam) return res.status(400).json({ error: 'Naam is verplicht.' });
  try {
    const [bestaand] = await db.query('SELECT id FROM bedrijf WHERE naam = ?', [naam]);
    if (bestaand.length > 0) return res.status(400).json({ error: 'Bedrijf met deze naam bestaat al.' });

    const [result] = await db.query(
      `INSERT INTO bedrijf (naam, sector, adres, postcode, stad, btw_nummer)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [naam, sector || null, adres || null, postcode || null, stad || null, btw_nummer || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Bedrijf aangemaakt.' });
  } catch (err) {
    console.error('Bedrijf aanmaken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// PUT /api/bedrijven/:id — bedrijf aanpassen (admin)
router.put('/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  const { naam, sector, adres, postcode, stad, btw_nummer } = req.body;
  try {
    await db.query(
      `UPDATE bedrijf SET naam = ?, sector = ?, adres = ?, postcode = ?, stad = ?, btw_nummer = ?
       WHERE id = ?`,
      [naam, sector || null, adres || null, postcode || null, stad || null, btw_nummer || null, req.params.id]
    );
    res.json({ message: 'Bedrijf bijgewerkt.' });
  } catch (err) {
    console.error('Bedrijf updaten fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// DELETE /api/bedrijven/:id — bedrijf verwijderen (admin)
router.delete('/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [inGebruik] = await db.query('SELECT COUNT(*) AS n FROM stage WHERE bedrijf_id = ?', [req.params.id]);
    if (inGebruik[0].n > 0) {
      return res.status(400).json({ error: 'Bedrijf in gebruik door bestaande stages — kan niet verwijderd worden.' });
    }
    await db.query('DELETE FROM bedrijf WHERE id = ?', [req.params.id]);
    res.json({ message: 'Bedrijf verwijderd.' });
  } catch (err) {
    console.error('Bedrijf verwijderen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
