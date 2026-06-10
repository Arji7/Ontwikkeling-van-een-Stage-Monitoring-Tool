
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
  const { bedrijf, sector, mentor, mentorEmail, docent, startDatum, eindDatum, omschrijving } = req.body;
  const student_id = req.user.id;

  if (!bedrijf || !mentor || !mentorEmail || !startDatum || !eindDatum || !omschrijving) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' });
  }

  try {
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
      `INSERT INTO stage (student_id, bedrijf_id, omschrijving, startdatum, einddatum, status)
       VALUES (?, ?, ?, ?, ?, 'ingediend')`,
      [student_id, bedrijf_id, omschrijving, startDatum, eindDatum]
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

module.exports = router;


