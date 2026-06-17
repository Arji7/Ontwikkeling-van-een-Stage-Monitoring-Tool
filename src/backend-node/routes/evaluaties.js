const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware, hasRole } = require('../middleware/authMiddelware');

// Hulpfunctie: gebruiker_id → student_id
async function getStudentId(gebruikerId) {
  const [rijen] = await db.query(
    'SELECT id FROM student WHERE gebruiker_id = ?',
    [gebruikerId]
  );
  if (rijen.length === 0) return null;
  return rijen[0].id;
}

// Hulpfunctie: heeft de gebruiker een staf-rol?
function isStaf(user) {
  const stafRollen = ['docent', 'mentor', 'commissielid', 'admin'];
  return (user.rollen || []).some(r => stafRollen.includes(r));
}

// ────────────────────────────────────────────────────────────
// GET /api/evaluaties/stage/:stageId — alle evaluaties voor een stage
// ────────────────────────────────────────────────────────────
router.get('/stage/:stageId', authMiddleware, async (req, res) => {
  try {
    // Toegangscontrole: staf mag alles, student alleen eigen stage
    if (!isStaf(req.user)) {
      const studentId = await getStudentId(req.user.id);
      const [stageRows] = await db.query(
        'SELECT student_id FROM stage WHERE id = ?',
        [req.params.stageId]
      );
      if (stageRows.length === 0) return res.status(404).json({ error: 'Stage niet gevonden.' });
      if (stageRows[0].student_id !== studentId) {
        return res.status(403).json({ error: 'Geen toegang tot deze stage.' });
      }
    }

    const [evaluaties] = await db.query(
      `SELECT e.*
       FROM evaluatie e
       WHERE e.stage_id = ?
       ORDER BY e.datum_bespreking ASC, e.aangemaakt_op ASC`,
      [req.params.stageId]
    );

    // Haal competentiescores op per evaluatie
    for (const evaluatie of evaluaties) {
      const [scores] = await db.query(
        `SELECT cs.*, sc.code, sc.naam AS subcompetentie_naam
         FROM competentiescore cs
         JOIN subcompetentie sc ON sc.id = cs.subcompetentie_id
         WHERE cs.evaluatie_id = ?
         ORDER BY sc.volgorde ASC`,
        [evaluatie.id]
      );
      evaluatie.scores = scores;
    }

    res.json(evaluaties);
  } catch (err) {
    console.error('Evaluaties stage ophalen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/evaluaties/competenties/rubriek — volledige rubriek
// ────────────────────────────────────────────────────────────
router.get('/competenties/rubriek', authMiddleware, async (req, res) => {
  try {
    const [competenties] = await db.query(
      'SELECT id, naam, beschrijving, volgorde FROM competentie ORDER BY volgorde ASC'
    );

    for (const comp of competenties) {
      const [subs] = await db.query(
        'SELECT id, code, naam, beschrijving, volgorde FROM subcompetentie WHERE competentie_id = ? ORDER BY volgorde ASC',
        [comp.id]
      );

      for (const sub of subs) {
        const [niveaus] = await db.query(
          'SELECT id, niveau, label, sublabel, beschrijving FROM subcompetentie_niveau WHERE subcompetentie_id = ? ORDER BY niveau ASC',
          [sub.id]
        );
        sub.niveaus = niveaus;
      }

      comp.subcompetenties = subs;
    }

    res.json(competenties);
  } catch (err) {
    console.error('Rubriek ophalen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/evaluaties/:id — enkele evaluatie met scores gegroepeerd per competentie
// ────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    const evaluatie = evaluaties[0];

    // Toegangscontrole
    if (!isStaf(req.user)) {
      const studentId = await getStudentId(req.user.id);
      const [stageRows] = await db.query(
        'SELECT student_id FROM stage WHERE id = ?',
        [evaluatie.stage_id]
      );
      if (stageRows.length === 0 || stageRows[0].student_id !== studentId) {
        return res.status(403).json({ error: 'Geen toegang tot deze evaluatie.' });
      }
    }

    // Haal scores op met subcompetentie en competentie info
    const [scores] = await db.query(
      `SELECT cs.*,
              sc.code, sc.naam AS subcompetentie_naam, sc.volgorde AS sub_volgorde,
              c.id AS competentie_id, c.naam AS competentie_naam, c.volgorde AS comp_volgorde
       FROM competentiescore cs
       JOIN subcompetentie sc ON sc.id = cs.subcompetentie_id
       JOIN competentie c ON c.id = sc.competentie_id
       WHERE cs.evaluatie_id = ?
       ORDER BY c.volgorde ASC, sc.volgorde ASC`,
      [req.params.id]
    );

    // Groepeer per competentie
    const competentieMap = {};
    for (const score of scores) {
      const key = score.competentie_id;
      if (!competentieMap[key]) {
        competentieMap[key] = {
          competentie_id: score.competentie_id,
          competentie_naam: score.competentie_naam,
          volgorde: score.comp_volgorde,
          scores: [],
        };
      }
      competentieMap[key].scores.push({
        id: score.id,
        subcompetentie_id: score.subcompetentie_id,
        code: score.code,
        subcompetentie_naam: score.subcompetentie_naam,
        score_docent: score.score_docent,
        score_mentor: score.score_mentor,
        feedback_docent: score.feedback_docent,
        student_reflectie: score.student_reflectie,
        eind_doelscore: score.eind_doelscore,
        trend: score.trend,
      });
    }

    // Sorteer en maak array
    evaluatie.competenties = Object.values(competentieMap).sort((a, b) => a.volgorde - b.volgorde);

    // Haal feedback op
    const [feedback] = await db.query(
      `SELECT ef.*, g.voornaam, g.achternaam
       FROM evaluatie_feedback ef
       JOIN gebruiker g ON g.id = ef.gebruiker_id
       WHERE ef.evaluatie_id = ?
       ORDER BY ef.aangemaakt_op ASC`,
      [req.params.id]
    );
    evaluatie.feedback = feedback;

    res.json(evaluatie);
  } catch (err) {
    console.error('Evaluatie detail fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/evaluaties — evaluatie aanmaken (docent/admin)
// ────────────────────────────────────────────────────────────
router.post('/', authMiddleware, hasRole('docent', 'admin'), async (req, res) => {
  const { stage_id, type, week_nummer } = req.body;

  if (!stage_id || !type) {
    return res.status(400).json({ error: 'stage_id en type zijn verplicht.' });
  }

  if (!['tussentijds', 'eind'].includes(type)) {
    return res.status(400).json({ error: 'Type moet "tussentijds" of "eind" zijn.' });
  }

  try {
    // Controleer of stage bestaat
    const [stageRows] = await db.query('SELECT id FROM stage WHERE id = ?', [stage_id]);
    if (stageRows.length === 0) {
      return res.status(404).json({ error: 'Stage niet gevonden.' });
    }

    // Evaluatie aanmaken
    const [result] = await db.query(
      `INSERT INTO evaluatie (stage_id, type, week_nummer, status)
       VALUES (?, ?, ?, 'open')`,
      [stage_id, type, week_nummer || null]
    );

    const evaluatieId = result.insertId;

    // Auto-create lege competentiescores voor alle subcompetenties
    const [subcompetenties] = await db.query(
      'SELECT id FROM subcompetentie ORDER BY volgorde ASC'
    );

    for (const sub of subcompetenties) {
      await db.query(
        'INSERT INTO competentiescore (evaluatie_id, subcompetentie_id) VALUES (?, ?)',
        [evaluatieId, sub.id]
      );
    }

    res.status(201).json({ message: 'Evaluatie aangemaakt', id: evaluatieId });
  } catch (err) {
    console.error('Evaluatie aanmaken fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/evaluaties/:id/scores — competentiescores bijwerken (docent)
// ────────────────────────────────────────────────────────────
router.put('/:id/scores', authMiddleware, hasRole('docent', 'admin'), async (req, res) => {
  const { scores, officieel_eindcijfer, globale_feedback } = req.body;

  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    const evaluatie = evaluaties[0];

    if (evaluatie.status === 'afgerond') {
      return res.status(400).json({ error: 'Een afgeronde evaluatie kan niet meer bewerkt worden.' });
    }

    // Evaluatie-level velden bijwerken
    if (officieel_eindcijfer !== undefined || globale_feedback !== undefined) {
      const updates = [];
      const params = [];

      if (officieel_eindcijfer !== undefined) {
        updates.push('officieel_eindcijfer = ?');
        params.push(officieel_eindcijfer);
      }
      if (globale_feedback !== undefined) {
        updates.push('globale_feedback = ?');
        params.push(globale_feedback);
      }

      params.push(req.params.id);
      await db.query(
        `UPDATE evaluatie SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Individuele scores bijwerken
    if (Array.isArray(scores) && scores.length > 0) {
      for (const score of scores) {
        if (!score.subcompetentie_id) continue;

        const scoreUpdates = [];
        const scoreParams = [];

        if (score.score_docent !== undefined) {
          scoreUpdates.push('score_docent = ?');
          scoreParams.push(score.score_docent);
        }
        if (score.feedback_docent !== undefined) {
          scoreUpdates.push('feedback_docent = ?');
          scoreParams.push(score.feedback_docent);
        }

        if (scoreUpdates.length > 0) {
          scoreParams.push(req.params.id, score.subcompetentie_id);
          await db.query(
            `UPDATE competentiescore SET ${scoreUpdates.join(', ')}
             WHERE evaluatie_id = ? AND subcompetentie_id = ?`,
            scoreParams
          );
        }
      }
    }

    res.json({ message: 'Scores bijgewerkt' });
  } catch (err) {
    console.error('Scores bijwerken fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/evaluaties/:id/indienen — evaluatie indienen (docent)
// ────────────────────────────────────────────────────────────
router.post('/:id/indienen', authMiddleware, hasRole('docent', 'admin'), async (req, res) => {
  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    const evaluatie = evaluaties[0];

    if (evaluatie.status !== 'open') {
      return res.status(400).json({ error: 'Alleen evaluaties met status "open" kunnen ingediend worden.' });
    }

    await db.query(
      `UPDATE evaluatie SET status = 'ingediend' WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Evaluatie ingediend' });
  } catch (err) {
    console.error('Evaluatie indienen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

module.exports = router;
