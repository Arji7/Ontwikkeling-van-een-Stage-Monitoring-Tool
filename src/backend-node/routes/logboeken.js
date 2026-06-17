const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { authMiddleware, hasRole } = require('../middleware/authMiddelware');

// Multer config voor logboek bestanden
const uploadDir = path.join(__dirname, '..', 'uploads', 'logboeken');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniek = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniek + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// Hulpfunctie: gebruiker_id → student_id
async function getStudentId(gebruikerId) {
  const [rijen] = await db.query(
    'SELECT id FROM student WHERE gebruiker_id = ?',
    [gebruikerId]
  );
  if (rijen.length === 0) return null;
  return rijen[0].id;
}

// Hulpfunctie: haal goedgekeurde stage op van student
async function getActieveStage(studentId) {
  const [rijen] = await db.query(
    `SELECT id FROM stage
     WHERE student_id = ? AND status IN ('actief')
     ORDER BY aangemaakt_op DESC LIMIT 1`,
    [studentId]
  );
  if (rijen.length === 0) return null;
  return rijen[0].id;
}

// Hulpfunctie: heeft de gebruiker een staf-rol?
function isStaf(user) {
  const stafRollen = ['docent', 'mentor', 'commissielid', 'admin'];
  return (user.rollen || []).some(r => stafRollen.includes(r));
}

// Hulpfunctie: check of een logboek bij de ingelogde student hoort
async function isEigenLogboek(logboekId, gebruikerId) {
  const [rijen] = await db.query(
    `SELECT s.student_id, st.gebruiker_id
       FROM logboek l
       JOIN stage s   ON s.id  = l.stage_id
       JOIN student st ON st.id = s.student_id
      WHERE l.id = ?`,
    [logboekId]
  );
  if (rijen.length === 0) return false;
  return rijen[0].gebruiker_id === gebruikerId;
}

// ────────────────────────────────────────────────────────────
// GET /api/logboeken/mijn — alle logboeken van ingelogde student
// ────────────────────────────────────────────────────────────
router.get('/mijn', authMiddleware, async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });

    const stageId = await getActieveStage(studentId);
    if (!stageId) return res.json([]);

    const [rows] = await db.query(
      `SELECT l.*,
              (SELECT COUNT(*) FROM logboek_dag ld WHERE ld.logboek_id = l.id) AS aantal_dagen,
              (SELECT SUM(ld.uren_gewerkt) FROM logboek_dag ld WHERE ld.logboek_id = l.id) AS totaal_dag_uren
       FROM logboek l
       WHERE l.stage_id = ?
       ORDER BY l.week_nummer DESC`,
      [stageId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Logboeken ophalen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/logboeken/mijn/overzicht — stage info + aantal weken berekenen
// Gebruikt door het dashboard om de "Nog in te dienen" teller te tonen.
// ────────────────────────────────────────────────────────────
router.get('/mijn/overzicht', authMiddleware, async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });

    // Haal goedgekeurde / actieve stage op
    const [rijen] = await db.query(
      `SELECT s.id AS stage_id, s.startdatum, s.einddatum, s.status, b.naam AS bedrijf_naam
       FROM stage s
       LEFT JOIN bedrijf b ON b.id = s.bedrijf_id
       WHERE s.student_id = ? AND s.status IN ('actief')
       ORDER BY s.aangemaakt_op DESC
       LIMIT 1`,
      [studentId]
    );

    if (rijen.length === 0) {
      return res.json({ stage_id: null, aantal_weken: 0 });
    }

    const stage = rijen[0];

    // Bereken aantal weken: ceil((einddatum - startdatum) / 7 dagen) — partiële weken tellen mee
    const start = new Date(stage.startdatum);
    const eind  = new Date(stage.einddatum);
    const dagen = Math.floor((eind - start) / (1000 * 60 * 60 * 24)) + 1;
    const aantal_weken = Math.ceil(dagen / 7);

    res.json({
      stage_id:      stage.stage_id,
      bedrijf_naam:  stage.bedrijf_naam,
      startdatum:    stage.startdatum,
      einddatum:     stage.einddatum,
      status:        stage.status,
      aantal_weken
    });
  } catch (err) {
    console.error('Overzicht ophalen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/logboeken/stage/:stageId — logboeken voor een stage (docent/admin/commissie)
// ────────────────────────────────────────────────────────────
router.get('/stage/:stageId', authMiddleware, async (req, res) => {
  try {
    // Ownership check — student moet eigenaar zijn van de stage
    if (!isStaf(req.user)) {
      const studentId = await getStudentId(req.user.id);
      const [stageRows] = await db.query(
        'SELECT student_id FROM stage WHERE id = ?',
        [req.params.stageId]
      );
      if (stageRows.length === 0) return res.status(404).json({ error: 'Stage niet gevonden' });
      if (stageRows[0].student_id !== studentId) {
        return res.status(403).json({ error: 'Geen toegang tot deze stage.' });
      }
    }

    const [rows] = await db.query(
      `SELECT l.*,
              (SELECT COUNT(*) FROM logboek_dag ld WHERE ld.logboek_id = l.id) AS aantal_dagen,
              (SELECT SUM(ld.uren_gewerkt) FROM logboek_dag ld WHERE ld.logboek_id = l.id) AS totaal_dag_uren
       FROM logboek l
       WHERE l.stage_id = ?
       ORDER BY l.week_nummer ASC`,
      [req.params.stageId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Logboeken stage ophalen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/logboeken/mentor/te-beoordelen — logboeken voor de ingelogde mentor
// ────────────────────────────────────────────────────────────
router.get('/mentor/te-beoordelen', authMiddleware, async (req, res) => {
  try {
    const [[gebruiker]] = await db.query('SELECT email FROM gebruiker WHERE id = ?', [req.user.id]);
    if (!gebruiker) return res.status(404).json({ error: 'Gebruiker niet gevonden.' });

    const [rows] = await db.query(
      `SELECT l.id, l.week_nummer, l.ingediend_op, l.status, l.totaal_uren, l.stage_id,
              sg.voornaam AS student_voornaam, sg.achternaam AS student_achternaam
       FROM logboek l
       JOIN stage     s  ON s.id  = l.stage_id
       JOIN student   st ON st.id = s.student_id
       JOIN gebruiker sg ON sg.id = st.gebruiker_id
       WHERE s.contact_email = ?
         AND l.status IN ('ingediend', 'wacht_op_mentor')
       ORDER BY l.ingediend_op ASC`,
      [gebruiker.email]
    );

    res.json(rows);
  } catch (err) {
    console.error('Mentor logboeken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/logboeken/:id — enkel logboek met dagen + reacties
// ────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [logboeken] = await db.query('SELECT * FROM logboek WHERE id = ?', [req.params.id]);
    if (logboeken.length === 0) return res.status(404).json({ error: 'Logboek niet gevonden' });

    const logboek = logboeken[0];

    // Ownership check: student mag enkel eigen logboeken zien
    if (!isStaf(req.user)) {
      const eigenaar = await isEigenLogboek(logboek.id, req.user.id);
      if (!eigenaar) return res.status(403).json({ error: 'Geen toegang tot dit logboek.' });
    }

    const [dagen] = await db.query(
      'SELECT * FROM logboek_dag WHERE logboek_id = ? ORDER BY datum ASC',
      [logboek.id]
    );

    const [reacties] = await db.query(
      `SELECT lr.*, g.voornaam, g.achternaam
       FROM logboek_reactie lr
       JOIN gebruiker g ON g.id = lr.gebruiker_id
       WHERE lr.logboek_id = ?
       ORDER BY lr.aangemaakt_op ASC`,
      [logboek.id]
    );

    const [competenties] = await db.query(
      `SELECT c.id, c.naam
       FROM logboek_competentie lc
       JOIN competentie c ON c.id = lc.competentie_id
       WHERE lc.logboek_id = ?
       ORDER BY c.volgorde ASC`,
      [logboek.id]
    );

    const [bestanden] = await db.query(
      `SELECT id, bestandsnaam, origineel_naam, mimetype, bestandsgrootte, geupload_op
       FROM logboek_bestand
       WHERE logboek_id = ?
       ORDER BY geupload_op ASC`,
      [logboek.id]
    );

    res.json({ ...logboek, dagen, reacties, competenties, bestanden });
  } catch (err) {
    console.error('Logboek detail fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/logboeken — nieuw logboek aanmaken (student)
// ────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { week_nummer, titel, datum_van, datum_tot, uitgevoerde_taken, leerpunten, dagen, competenties } = req.body;

  if (!week_nummer || !datum_van || !datum_tot) {
    return res.status(400).json({ error: 'week_nummer, datum_van en datum_tot zijn verplicht.' });
  }

  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });

    const stageId = await getActieveStage(studentId);
    if (!stageId) return res.status(400).json({ error: 'Geen actieve/goedgekeurde stage gevonden.' });

    // Check of week al bestaat
    const [bestaand] = await db.query(
      'SELECT id FROM logboek WHERE stage_id = ? AND week_nummer = ?',
      [stageId, week_nummer]
    );
    if (bestaand.length > 0) {
      return res.status(409).json({ error: `Logboek voor week ${week_nummer} bestaat al.` });
    }

    const [result] = await db.query(
      `INSERT INTO logboek (stage_id, week_nummer, titel, datum_van, datum_tot, uitgevoerde_taken, leerpunten, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'concept')`,
      [stageId, week_nummer, titel || `Week ${week_nummer}`, datum_van, datum_tot, uitgevoerde_taken || '', leerpunten || '']
    );

    const logboekId = result.insertId;

    // Dagen toevoegen als meegegeven
    if (Array.isArray(dagen) && dagen.length > 0) {
      for (const dag of dagen) {
        await db.query(
          `INSERT INTO logboek_dag (logboek_id, datum, uren_gewerkt, uitgevoerde_taken, is_afwezig, afwezig_reden)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [logboekId, dag.datum, dag.uren_gewerkt || 0, dag.uitgevoerde_taken || '', dag.is_afwezig || false, dag.afwezig_reden || null]
        );
      }
    }

    // Competenties koppelen
    if (Array.isArray(competenties) && competenties.length > 0) {
      for (const compId of competenties) {
        await db.query(
          'INSERT INTO logboek_competentie (logboek_id, competentie_id) VALUES (?, ?)',
          [logboekId, compId]
        );
      }
    }

    res.status(201).json({ message: 'Logboek aangemaakt', id: logboekId });
  } catch (err) {
    console.error('Logboek aanmaken fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/logboeken/:id — logboek bewerken (student, alleen als concept)
// ────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  const { titel, uitgevoerde_taken, leerpunten, dagen, competenties } = req.body;

  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });

    const [logboeken] = await db.query('SELECT * FROM logboek WHERE id = ?', [req.params.id]);
    if (logboeken.length === 0) return res.status(404).json({ error: 'Logboek niet gevonden' });

    const logboek = logboeken[0];

    // Controleer eigenaarschap
    const stageId = await getActieveStage(studentId);
    if (logboek.stage_id !== stageId) {
      return res.status(403).json({ error: 'Dit is niet jouw logboek.' });
    }

    if (logboek.status !== 'concept') {
      return res.status(400).json({ error: 'Alleen logboeken met status "concept" kunnen bewerkt worden.' });
    }

    await db.query(
      `UPDATE logboek SET titel = ?, uitgevoerde_taken = ?, leerpunten = ?
       WHERE id = ?`,
      [titel || logboek.titel, uitgevoerde_taken || '', leerpunten || '', req.params.id]
    );

    // Dagen vervangen als meegegeven
    if (Array.isArray(dagen)) {
      await db.query('DELETE FROM logboek_dag WHERE logboek_id = ?', [req.params.id]);
      for (const dag of dagen) {
        await db.query(
          `INSERT INTO logboek_dag (logboek_id, datum, uren_gewerkt, uitgevoerde_taken, is_afwezig, afwezig_reden)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [req.params.id, dag.datum, dag.uren_gewerkt || 0, dag.uitgevoerde_taken || '', dag.is_afwezig || false, dag.afwezig_reden || null]
        );
      }
    }

    // Competenties vervangen als meegegeven
    if (Array.isArray(competenties)) {
      await db.query('DELETE FROM logboek_competentie WHERE logboek_id = ?', [req.params.id]);
      for (const compId of competenties) {
        await db.query(
          'INSERT INTO logboek_competentie (logboek_id, competentie_id) VALUES (?, ?)',
          [req.params.id, compId]
        );
      }
    }

    res.json({ message: 'Logboek bijgewerkt' });
  } catch (err) {
    console.error('Logboek bewerken fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/logboeken/:id/indienen — logboek indienen (student)
// ────────────────────────────────────────────────────────────
router.post('/:id/indienen', authMiddleware, async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });

    const [logboeken] = await db.query('SELECT * FROM logboek WHERE id = ?', [req.params.id]);
    if (logboeken.length === 0) return res.status(404).json({ error: 'Logboek niet gevonden' });

    const logboek = logboeken[0];

    const stageId = await getActieveStage(studentId);
    if (logboek.stage_id !== stageId) {
      return res.status(403).json({ error: 'Dit is niet jouw logboek.' });
    }

    if (logboek.status !== 'concept') {
      return res.status(400).json({ error: 'Dit logboek is al ingediend.' });
    }

    await db.query(
      `UPDATE logboek SET status = 'ingediend', ingediend_op = NOW() WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Logboek ingediend' });
  } catch (err) {
    console.error('Logboek indienen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/logboeken/:id/reactie — reactie plaatsen (docent/mentor)
// ────────────────────────────────────────────────────────────
router.post('/:id/reactie', authMiddleware, hasRole('docent', 'mentor', 'admin'), async (req, res) => {
  const { reactie } = req.body;

  if (!reactie || !reactie.trim()) {
    return res.status(400).json({ error: 'Reactie mag niet leeg zijn.' });
  }

  try {
    const [logboeken] = await db.query('SELECT * FROM logboek WHERE id = ?', [req.params.id]);
    if (logboeken.length === 0) return res.status(404).json({ error: 'Logboek niet gevonden' });

    await db.query(
      `INSERT INTO logboek_reactie (logboek_id, gebruiker_id, reactie)
       VALUES (?, ?, ?)`,
      [req.params.id, req.user.id, reactie.trim()]
    );

    res.status(201).json({ message: 'Reactie geplaatst' });
  } catch (err) {
    console.error('Reactie plaatsen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/logboeken/:id/goedkeuren — logboek goedkeuren (docent/mentor)
// ────────────────────────────────────────────────────────────
router.post('/:id/goedkeuren', authMiddleware, hasRole('mentor', 'docent', 'admin'), async (req, res) => {
  const { mentor_feedback } = req.body;

  try {
    const [logboeken] = await db.query('SELECT * FROM logboek WHERE id = ?', [req.params.id]);
    if (logboeken.length === 0) return res.status(404).json({ error: 'Logboek niet gevonden' });

    await db.query(
      `UPDATE logboek SET status = 'goedgekeurd', mentor_feedback = ? WHERE id = ?`,
      [mentor_feedback || null, req.params.id]
    );

    res.json({ message: 'Logboek goedgekeurd' });
  } catch (err) {
    console.error('Logboek goedkeuren fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/logboeken/:id/bestanden — bestand uploaden naar logboek
// ────────────────────────────────────────────────────────────
router.post('/:id/bestanden', authMiddleware, upload.single('bestand'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Geen bestand ontvangen.' });
  }

  try {
    // Check of logboek bestaat
    const [logboeken] = await db.query('SELECT id FROM logboek WHERE id = ?', [req.params.id]);
    if (logboeken.length === 0) {
      fs.unlinkSync(req.file.path); // ruim het opgeslagen bestand op
      return res.status(404).json({ error: 'Logboek niet gevonden' });
    }

    // Ownership check — student moet eigenaar zijn
    if (!isStaf(req.user)) {
      const eigenaar = await isEigenLogboek(req.params.id, req.user.id);
      if (!eigenaar) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Geen toegang tot dit logboek.' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO logboek_bestand (logboek_id, bestandsnaam, origineel_naam, mimetype, bestandsgrootte)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]
    );

    res.status(201).json({
      id: result.insertId,
      bestandsnaam: req.file.filename,
      origineel_naam: req.file.originalname,
      mimetype: req.file.mimetype,
      bestandsgrootte: req.file.size,
      url: '/uploads/logboeken/' + req.file.filename
    });
  } catch (err) {
    console.error('Bestand upload fout:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// ────────────────────────────────────────────────────────────
// DELETE /api/logboeken/bestanden/:bestandId — bestand verwijderen
// ────────────────────────────────────────────────────────────
router.delete('/bestanden/:bestandId', authMiddleware, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT bestandsnaam, logboek_id FROM logboek_bestand WHERE id = ?',
      [req.params.bestandId]
    );
    if (rijen.length === 0) return res.status(404).json({ error: 'Bestand niet gevonden' });

    // Ownership check — student moet eigenaar zijn van het logboek
    if (!isStaf(req.user)) {
      const eigenaar = await isEigenLogboek(rijen[0].logboek_id, req.user.id);
      if (!eigenaar) return res.status(403).json({ error: 'Geen toegang tot dit bestand.' });
    }

    const filePath = path.join(uploadDir, rijen[0].bestandsnaam);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query('DELETE FROM logboek_bestand WHERE id = ?', [req.params.bestandId]);

    res.json({ message: 'Bestand verwijderd' });
  } catch (err) {
    console.error('Bestand verwijderen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

module.exports = router;
