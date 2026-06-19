const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('../middleware/authMiddelware');

async function fetchCompetentiesVolledig(opleidingId) {
  let competentieRows;
  if (opleidingId) {
    [competentieRows] = await db.query(
      `SELECT c.id, c.naam, c.beschrijving, c.volgorde
       FROM competentie c
       JOIN opleiding_competentie oc ON oc.competentie_id = c.id
       WHERE oc.opleiding_id = ?
       ORDER BY c.volgorde ASC`,
      [opleidingId]
    );
  } else {
    [competentieRows] = await db.query(
      'SELECT id, naam, beschrijving, volgorde FROM competentie ORDER BY volgorde ASC'
    );
  }

  if (competentieRows.length === 0) return [];

  const competentieIds = competentieRows.map(c => c.id);

  const [subRows] = await db.query(
    `SELECT id, competentie_id, code, naam, beschrijving, volgorde
       FROM subcompetentie
      WHERE competentie_id IN (?)
      ORDER BY competentie_id ASC, volgorde ASC`,
    [competentieIds]
  );

  const subIds = subRows.map(s => s.id);

  let niveauRows = [];
  if (subIds.length > 0) {
    [niveauRows] = await db.query(
      `SELECT subcompetentie_id, niveau, label, sublabel, beschrijving
         FROM subcompetentie_niveau
        WHERE subcompetentie_id IN (?)
        ORDER BY subcompetentie_id ASC, niveau ASC`,
      [subIds]
    );
  }

  const niveauMap = {};
  for (const n of niveauRows) {
    if (!niveauMap[n.subcompetentie_id]) niveauMap[n.subcompetentie_id] = [];
    niveauMap[n.subcompetentie_id].push(n);
  }

  const subMap = {};
  for (const s of subRows) {
    if (!subMap[s.competentie_id]) subMap[s.competentie_id] = [];
    subMap[s.competentie_id].push({ ...s, niveaus: niveauMap[s.id] || [] });
  }

  return competentieRows.map(c => ({
    ...c,
    subcompetenties: subMap[c.id] || [],
  }));
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

// GET /api/competenties/stage/:stageId
router.get('/stage/:stageId', authMiddleware, async (req, res) => {
  try {
    const [[stageRow]] = await db.query(
      `SELECT st.opleiding_id
         FROM stage s
         JOIN student st ON st.id = s.student_id
        WHERE s.id = ?`,
      [req.params.stageId]
    );

    if (!stageRow) return res.status(404).json({ error: 'Stage niet gevonden.' });

    const data = await fetchCompetentiesVolledig(stageRow.opleiding_id);
    res.json(data);
  } catch (err) {
    console.error('Competenties stage ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
