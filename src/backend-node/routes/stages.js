
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('../middleware/authMiddelware');


// Hulpfunctie: gebruiker_id omzetten naar student_id
async function getStudentId(gebruikerId) {
  const [rijen] = await db.query(
    'SELECT id FROM student WHERE gebruiker_id = ?',
    [gebruikerId]
  );
  if (rijen.length === 0) return null;
  return rijen[0].id;
}

// POST /api/stages — stagevoorstel indienen
router.post('/', authMiddleware, async (req, res) => {
  const { bedrijf, sector, mentor, mentorEmail, docent_id, startDatum, eindDatum, omschrijving } = req.body;

  if (!bedrijf || !mentor || !mentorEmail || !docent_id || !startDatum || !eindDatum || !omschrijving) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' });
  }

  try {
    const student_id = await getStudentId(req.user.id);
    if (!student_id) {
      return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });
    }

    // Bedrijf aanmaken of ophalen
    let [bedrijfRows] = await db.query('SELECT id FROM bedrijf WHERE naam = ?', [bedrijf]);
    let bedrijf_id;
    if (bedrijfRows.length === 0) {
      const [result] = await db.query(
        'INSERT INTO bedrijf (naam, sector) VALUES (?, ?)',
        [bedrijf, sector || null]
      );
      bedrijf_id = result.insertId;
    } else {
      bedrijf_id = bedrijfRows[0].id;
    }

    // Stage aanmaken
    const [stage] = await db.query(
      `INSERT INTO stage (student_id, bedrijf_id, docent_id, omschrijving, startdatum, einddatum, contact_naam, contact_email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ingediend')`,
      [student_id, bedrijf_id, docent_id, omschrijving, startDatum, eindDatum, mentor, mentorEmail]
    );

    // Geschiedenis opslaan
    await db.query(
      `INSERT INTO stage_geschiedenis (stage_id, nieuwe_status, gewijzigd_door)
       VALUES (?, 'ingediend', ?)`,
      [stage.insertId, student_id]
    );

    res.status(201).json({
      message: 'Stagevoorstel succesvol ingediend',
      stage_id: stage.insertId
    });

  } catch (err) {
    console.error('Stage indienen fout:', err);
    res.status(500).json({ error: 'Server fout' });
  }
});

// GET /api/stages/mijn — alle stages van de ingelogde student
router.get('/mijn', authMiddleware, async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });
    }

    const [rows] = await db.query(
      `SELECT s.*, b.naam AS bedrijf_naam, b.sector
       FROM stage s
       LEFT JOIN bedrijf b ON b.id = s.bedrijf_id
       WHERE s.student_id = ?
       ORDER BY s.aangemaakt_op DESC`,
      [studentId]
    );

    res.json(rows);

  } catch (err) {
    console.error('Stage ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/stages/:id — één specifieke stage ophalen
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, b.naam AS bedrijf_naam, b.sector
       FROM stage s
       LEFT JOIN bedrijf b ON b.id = s.bedrijf_id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Stage niet gevonden.' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error('Stage ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;


