const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware, hasRole } = require('../middleware/authMiddelware');

async function getStudentId(gebruikerId) {
  const [rijen] = await db.query('SELECT id FROM student WHERE gebruiker_id = ?', [gebruikerId]);
  return rijen.length > 0 ? rijen[0].id : null;
}

function isStaf(user) {
  return (user.rollen || []).some(r => ['docent', 'mentor', 'commissielid', 'admin'].includes(r));
}

async function checkStageAccess(user, stageId) {
  if (isStaf(user)) return true;
  const studentId = await getStudentId(user.id);
  if (!studentId) return false;
  const [rows] = await db.query('SELECT student_id FROM stage WHERE id = ?', [stageId]);
  return rows.length > 0 && rows[0].student_id === studentId;
}

// GET /api/evaluaties/student/mijn — evaluaties van ingelogde student
router.get('/student/mijn', authMiddleware, async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });

    const [evaluaties] = await db.query(
      `SELECT e.*, s.titel AS stage_titel, b.naam AS bedrijf_naam,
              s.startdatum, s.einddatum
       FROM evaluatie e
       JOIN stage s ON s.id = e.stage_id
       LEFT JOIN bedrijf b ON b.id = s.bedrijf_id
       WHERE s.student_id = ?
       ORDER BY e.aangemaakt_op DESC`,
      [studentId]
    );

    res.json(evaluaties);
  } catch (err) {
    console.error('Student evaluaties fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// GET /api/evaluaties/competenties/rubriek — volledige rubriek
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

// GET /api/evaluaties/stage/:stageId — alle evaluaties voor een stage
router.get('/stage/:stageId', authMiddleware, async (req, res) => {
  try {
    if (!(await checkStageAccess(req.user, req.params.stageId))) {
      return res.status(403).json({ error: 'Geen toegang tot deze stage.' });
    }

    const [evaluaties] = await db.query(
      'SELECT * FROM evaluatie WHERE stage_id = ? ORDER BY aangemaakt_op ASC',
      [req.params.stageId]
    );

    for (const ev of evaluaties) {
      const [scores] = await db.query(
        `SELECT cs.*, sc.code, sc.naam AS subcompetentie_naam
         FROM competentiescore cs
         JOIN subcompetentie sc ON sc.id = cs.subcompetentie_id
         WHERE cs.evaluatie_id = ?
         ORDER BY sc.volgorde ASC`,
        [ev.id]
      );
      ev.scores = scores;
    }

    res.json(evaluaties);
  } catch (err) {
    console.error('Evaluaties stage ophalen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// GET /api/evaluaties/:id — enkele evaluatie met scores per competentie
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    const evaluatie = evaluaties[0];

    if (!(await checkStageAccess(req.user, evaluatie.stage_id))) {
      return res.status(403).json({ error: 'Geen toegang tot deze evaluatie.' });
    }

    const [scores] = await db.query(
      `SELECT cs.id, cs.subcompetentie_id, cs.score_docent, cs.score_mentor,
              cs.feedback_docent, cs.feedback_mentor, cs.student_reflectie, cs.eind_doelscore, cs.trend,
              sc.code, sc.naam AS subcompetentie_naam, sc.volgorde AS sub_volgorde,
              c.id AS competentie_id, c.naam AS competentie_naam, c.volgorde AS comp_volgorde
       FROM competentiescore cs
       JOIN subcompetentie sc ON sc.id = cs.subcompetentie_id
       JOIN competentie c ON c.id = sc.competentie_id
       WHERE cs.evaluatie_id = ?
       ORDER BY c.volgorde ASC, sc.volgorde ASC`,
      [req.params.id]
    );

    const competentieMap = {};
    for (const s of scores) {
      if (!competentieMap[s.competentie_id]) {
        competentieMap[s.competentie_id] = {
          competentie_id: s.competentie_id,
          competentie_naam: s.competentie_naam,
          volgorde: s.comp_volgorde,
          scores: []
        };
      }
      competentieMap[s.competentie_id].scores.push({
        id: s.id,
        subcompetentie_id: s.subcompetentie_id,
        code: s.code,
        subcompetentie_naam: s.subcompetentie_naam,
        score_docent: s.score_docent,
        score_mentor: s.score_mentor,
        feedback_docent: s.feedback_docent,
        feedback_mentor: s.feedback_mentor,
        student_reflectie: s.student_reflectie,
        eind_doelscore: s.eind_doelscore,
        trend: s.trend
      });
    }

    evaluatie.competenties = Object.values(competentieMap).sort((a, b) => a.volgorde - b.volgorde);

    res.json(evaluatie);
  } catch (err) {
    console.error('Evaluatie detail fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// POST /api/evaluaties — evaluatie aanmaken (docent/admin)
router.post('/', authMiddleware, hasRole('docent', 'admin'), async (req, res) => {
  const { stage_id, type, week_nummer } = req.body;

  if (!stage_id || !type) {
    return res.status(400).json({ error: 'stage_id en type zijn verplicht.' });
  }
  if (!['tussentijds', 'eind'].includes(type)) {
    return res.status(400).json({ error: 'Type moet "tussentijds" of "eind" zijn.' });
  }

  try {
    const [stageRows] = await db.query('SELECT id FROM stage WHERE id = ?', [stage_id]);
    if (stageRows.length === 0) return res.status(404).json({ error: 'Stage niet gevonden.' });

    const [result] = await db.query(
      `INSERT INTO evaluatie (stage_id, type, week_nummer, status) VALUES (?, ?, ?, 'open')`,
      [stage_id, type, week_nummer || null]
    );
    const evaluatieId = result.insertId;

    const [subs] = await db.query('SELECT id FROM subcompetentie ORDER BY volgorde ASC');
    for (const sub of subs) {
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

// PUT /api/evaluaties/:id/scores — docent werkt totaalpunt en feedback bij
router.put('/:id/scores', authMiddleware, hasRole('docent', 'admin'), async (req, res) => {
  const { scores, officieel_eindcijfer, globale_feedback } = req.body;

  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    if (evaluaties[0].status === 'afgerond') {
      return res.status(400).json({ error: 'Een afgeronde evaluatie kan niet meer bewerkt worden.' });
    }

    if (officieel_eindcijfer !== undefined || globale_feedback !== undefined) {
      const updates = [];
      const params = [];
      if (officieel_eindcijfer !== undefined) { updates.push('officieel_eindcijfer = ?'); params.push(officieel_eindcijfer); }
      if (globale_feedback !== undefined) { updates.push('globale_feedback = ?'); params.push(globale_feedback); }
      params.push(req.params.id);
      await db.query(`UPDATE evaluatie SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    if (Array.isArray(scores)) {
      for (const s of scores) {
        if (!s.subcompetentie_id) continue;
        const updates = [];
        const params = [];
        if (s.feedback_docent !== undefined) { updates.push('feedback_docent = ?'); params.push(s.feedback_docent); }
        if (updates.length > 0) {
          params.push(req.params.id, s.subcompetentie_id);
          await db.query(`UPDATE competentiescore SET ${updates.join(', ')} WHERE evaluatie_id = ? AND subcompetentie_id = ?`, params);
        }
      }
    }

    res.json({ message: 'Scores bijgewerkt' });
  } catch (err) {
    console.error('Scores bijwerken fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// PUT /api/evaluaties/:id/mentor-scores — mentor werkt score_mentor bij
router.put('/:id/mentor-scores', authMiddleware, hasRole('mentor', 'admin'), async (req, res) => {
  const { scores } = req.body;

  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    if (evaluaties[0].status === 'afgerond') {
      return res.status(400).json({ error: 'Een afgeronde evaluatie kan niet meer bewerkt worden.' });
    }

    if (Array.isArray(scores)) {
      for (const s of scores) {
        if (!s.subcompetentie_id) continue;
        const updates = [];
        const params = [];
        if (s.score_mentor !== undefined) { updates.push('score_mentor = ?'); params.push(s.score_mentor); }
        if (s.feedback_mentor !== undefined) { updates.push('feedback_mentor = ?'); params.push(s.feedback_mentor); }
        if (updates.length > 0) {
          params.push(req.params.id, s.subcompetentie_id);
          await db.query(
            `UPDATE competentiescore SET ${updates.join(', ')} WHERE evaluatie_id = ? AND subcompetentie_id = ?`,
            params
          );
        }
      }
    }

    res.json({ message: 'Mentor scores bijgewerkt' });
  } catch (err) {
    console.error('Mentor scores bijwerken fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// PUT /api/evaluaties/:id/reflectie — student vult reflectie in
router.put('/:id/reflectie', authMiddleware, async (req, res) => {
  const { reflecties } = req.body;

  if (!Array.isArray(reflecties) || reflecties.length === 0) {
    return res.status(400).json({ error: 'reflecties array is verplicht.' });
  }

  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    const studentId = await getStudentId(req.user.id);
    const [stageRows] = await db.query('SELECT student_id FROM stage WHERE id = ?', [evaluaties[0].stage_id]);
    if (!studentId || stageRows.length === 0 || stageRows[0].student_id !== studentId) {
      return res.status(403).json({ error: 'Alleen de student van deze stage kan reflecties invullen.' });
    }

    for (const r of reflecties) {
      if (!r.subcompetentie_id) continue;
      await db.query(
        'UPDATE competentiescore SET student_reflectie = ? WHERE evaluatie_id = ? AND subcompetentie_id = ?',
        [r.student_reflectie || null, req.params.id, r.subcompetentie_id]
      );
    }

    res.json({ message: 'Reflecties opgeslagen' });
  } catch (err) {
    console.error('Reflectie opslaan fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// POST /api/evaluaties/:id/indienen — evaluatie indienen (docent)
router.post('/:id/indienen', authMiddleware, hasRole('docent', 'admin'), async (req, res) => {
  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    if (evaluaties[0].status !== 'open') {
      return res.status(400).json({ error: 'Alleen evaluaties met status "open" kunnen ingediend worden.' });
    }

    await db.query("UPDATE evaluatie SET status = 'ingediend' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Evaluatie ingediend' });
  } catch (err) {
    console.error('Evaluatie indienen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// POST /api/evaluaties/:id/feedback — feedback plaatsen
router.post('/:id/feedback', authMiddleware, async (req, res) => {
  const { feedback } = req.body;
  if (!feedback) return res.status(400).json({ error: 'Feedback is verplicht.' });

  try {
    const [evaluaties] = await db.query('SELECT * FROM evaluatie WHERE id = ?', [req.params.id]);
    if (evaluaties.length === 0) return res.status(404).json({ error: 'Evaluatie niet gevonden.' });

    if (!(await checkStageAccess(req.user, evaluaties[0].stage_id))) {
      return res.status(403).json({ error: 'Geen toegang.' });
    }

    await db.query(
      'INSERT INTO evaluatie_feedback (evaluatie_id, gebruiker_id, feedback) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, feedback]
    );
    res.status(201).json({ message: 'Feedback geplaatst' });
  } catch (err) {
    console.error('Evaluatie feedback fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// GET /api/evaluaties/alle — alle evaluaties (commissie/admin)
router.get('/alle', authMiddleware, hasRole('commissielid', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.type, e.status, e.eindscore, e.aangemaakt_op, e.ingediend_op,
              g.voornaam AS student_voornaam, g.achternaam AS student_achternaam,
              b.naam AS bedrijf_naam,
              dg.voornaam AS docent_voornaam, dg.achternaam AS docent_achternaam,
              s.startdatum, s.einddatum, s.id AS stage_id
       FROM evaluatie e
       JOIN stage s ON s.id = e.stage_id
       JOIN student st ON st.id = s.student_id
       JOIN gebruiker g ON g.id = st.gebruiker_id
       LEFT JOIN bedrijf b ON b.id = s.bedrijf_id
       LEFT JOIN docent d ON d.id = s.docent_id
       LEFT JOIN gebruiker dg ON dg.id = d.gebruiker_id
       ORDER BY e.aangemaakt_op DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Alle evaluaties ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
