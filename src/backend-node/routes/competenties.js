const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('../middleware/authMiddelware');

async function fetchCompetentiesVolledig(opleidingId) {
  let competenties;
  if (opleidingId) {
    [competenties] = await db.query(
      `SELECT c.id, c.naam, c.beschrijving, c.volgorde
       FROM competentie c
       JOIN opleiding_competentie oc ON oc.competentie_id = c.id
       WHERE oc.opleiding_id = ?
       ORDER BY c.volgorde ASC`,
      [opleidingId]
    );
  } else {
    [competenties] = await db.query(
      'SELECT id, naam, beschrijving, volgorde FROM competentie ORDER BY volgorde ASC'
    );
  }

  for (const comp of competenties) {
    const [subs] = await db.query(
      'SELECT id, code, naam, beschrijving, volgorde FROM subcompetentie WHERE competentie_id = ? ORDER BY volgorde ASC',
      [comp.id]
    );
    for (const sub of subs) {
      const [niveaus] = await db.query(
        'SELECT niveau, label, sublabel, beschrijving FROM subcompetentie_niveau WHERE subcompetentie_id = ? ORDER BY niveau ASC',
        [sub.id]
      );
      sub.niveaus = niveaus;
    }
    comp.subcompetenties = subs;
  }

  return competenties;
}

// GET /api/competenties — alle competenties (optioneel gefilterd op ?opleiding_id=X)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const opleidingId = req.query.opleiding_id || null;
    const data = await fetchCompetentiesVolledig(opleidingId);
    res.json(data);
  } catch (err) {
    console.error('Competenties ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/competenties/stage/:stageId — competenties gefilterd op opleiding van de student
router.get('/stage/:stageId', authMiddleware, async (req, res) => {
  try {
    const [[stage]] = await db.query(
      `SELECT st.opleiding_id
       FROM stage s
       JOIN student st ON st.id = s.student_id
       WHERE s.id = ?`,
      [req.params.stageId]
    );
    const opleidingId = stage ? stage.opleiding_id : null;
    const data = await fetchCompetentiesVolledig(opleidingId);
    res.json(data);
  } catch (err) {
    console.error('Competenties stage fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
