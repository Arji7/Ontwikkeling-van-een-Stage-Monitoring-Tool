
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware, hasRole } = require('../middleware/authMiddelware');


// Hulpfunctie: gebruiker_id omzetten naar student_id
async function getStudentId(gebruikerId) {
  const [rijen] = await db.query(
    'SELECT id FROM student WHERE gebruiker_id = ?',
    [gebruikerId]
  );
  if (rijen.length === 0) return null;
  return rijen[0].id;
}

// Hulpfunctie: heeft de gebruiker een staf-rol (docent/mentor/commissielid/admin)?
function isStaf(user) {
  const stafRollen = ['docent', 'mentor', 'commissielid', 'admin'];
  return (user.rollen || []).some(r => stafRollen.includes(r));
}

// POST /api/stages — stagevoorstel indienen
router.post('/', authMiddleware, async (req, res) => {
  const { bedrijf, sector, mentor, mentorEmail, startDatum, eindDatum, omschrijving } = req.body;

  if (!bedrijf || !mentor || !mentorEmail || !startDatum || !eindDatum || !omschrijving) {
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

    // Stage aanmaken (docent_id wordt later toegekend door commissie/admin)
    const [stage] = await db.query(
      `INSERT INTO stage (student_id, bedrijf_id, omschrijving, startdatum, einddatum, contact_naam, contact_email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ingediend')`,
      [student_id, bedrijf_id, omschrijving, startDatum, eindDatum, mentor, mentorEmail]
    );

    // Geschiedenis opslaan
    await db.query(
      `INSERT INTO stage_geschiedenis (stage_id, nieuwe_status, gewijzigd_door)
       VALUES (?, 'ingediend', ?)`,
      [stage.insertId, req.user.id]
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
      `SELECT s.*,
              b.naam AS bedrijf_naam,
              b.sector,
              s.aangemaakt_op AS ingediend_op,
              (SELECT bs.opmerking
                 FROM beslissing bs
                WHERE bs.stage_id = s.id
                ORDER BY bs.datum DESC
                LIMIT 1) AS laatste_opmerking,
              (SELECT bs.opmerking
                 FROM beslissing bs
                WHERE bs.stage_id = s.id
                ORDER BY bs.datum DESC
                LIMIT 1) AS feedback,
              (SELECT bs.beslissing
                 FROM beslissing bs
                WHERE bs.stage_id = s.id
                ORDER BY bs.datum DESC
                LIMIT 1) AS laatste_beslissing,
              (SELECT bs.datum
                 FROM beslissing bs
                WHERE bs.stage_id = s.id
                ORDER BY bs.datum DESC
                LIMIT 1) AS beoordeeld_op,
              (SELECT CONCAT(g.voornaam, ' ', g.achternaam)
                 FROM beslissing bs
                 JOIN gebruiker g ON g.id = bs.commissielid_id
                WHERE bs.stage_id = s.id
                ORDER BY bs.datum DESC
                LIMIT 1) AS beoordeeld_door
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

// GET /api/stages/:id — één specifieke stage ophalen (met alle JOINs voor admin/commissie)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*,
              b.naam        AS bedrijf_naam,
              b.sector,
              sg.voornaam   AS student_voornaam,
              sg.achternaam AS student_achternaam,
              sg.email      AS student_email,
              o.naam        AS opleiding_naam,
              aj.naam       AS academiejaar_naam,
              dg.voornaam   AS docent_voornaam,
              dg.achternaam AS docent_achternaam
       FROM stage s
       LEFT JOIN bedrijf      b  ON b.id  = s.bedrijf_id
       LEFT JOIN student      st ON st.id = s.student_id
       LEFT JOIN gebruiker    sg ON sg.id = st.gebruiker_id
       LEFT JOIN opleiding    o  ON o.id  = st.opleiding_id
       LEFT JOIN academiejaar aj ON aj.id = s.academiejaar_id
       LEFT JOIN docent       d  ON d.id  = s.docent_id
       LEFT JOIN gebruiker    dg ON dg.id = d.gebruiker_id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Stage niet gevonden.' });
    }

    // Als geen staf-rol: alleen eigen stage mag bekeken worden
    if (!isStaf(req.user)) {
      const eigenStudentId = await getStudentId(req.user.id);
      if (rows[0].student_id !== eigenStudentId) {
        return res.status(403).json({ error: 'Geen toegang tot deze stage.' });
      }
    }

    res.json(rows[0]);

  } catch (err) {
    console.error('Stage ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// PUT /api/stages/:id — student past zijn stagevoorstel aan en dient opnieuw in
router.put('/:id', authMiddleware, async (req, res) => {
  const stage_id = req.params.id;
  const { bedrijf, sector, mentor, mentorEmail, startDatum, eindDatum, omschrijving } = req.body;

  if (!bedrijf || !mentor || !mentorEmail || !startDatum || !eindDatum || !omschrijving) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' });
  }

  try {
    const student_id = await getStudentId(req.user.id);
    if (!student_id) {
      return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });
    }

    // Check eigenaarschap + huidige status
    const [stageRows] = await db.query(
      'SELECT student_id, status FROM stage WHERE id = ?',
      [stage_id]
    );
    if (stageRows.length === 0) {
      return res.status(404).json({ error: 'Stage niet gevonden.' });
    }
    if (stageRows[0].student_id !== student_id) {
      return res.status(403).json({ error: 'Deze stage is niet van jou.' });
    }
    const oudeStatus = stageRows[0].status;
    const mogenAanpassen = ['concept', 'aanpassingen_vereist'];
    if (!mogenAanpassen.includes(oudeStatus)) {
      return res.status(400).json({ error: 'Aanpassen niet toegelaten — status is "' + oudeStatus + '".' });
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

    // Stage updaten — status terug naar "ingediend"
    await db.query(
      `UPDATE stage
          SET bedrijf_id    = ?,
              omschrijving  = ?,
              startdatum    = ?,
              einddatum     = ?,
              contact_naam  = ?,
              contact_email = ?,
              status        = 'ingediend'
        WHERE id = ?`,
      [bedrijf_id, omschrijving, startDatum, eindDatum, mentor, mentorEmail, stage_id]
    );

    // Geschiedenis bijhouden
    await db.query(
      `INSERT INTO stage_geschiedenis (stage_id, oude_status, nieuwe_status, opmerking, gewijzigd_door)
       VALUES (?, ?, 'ingediend', 'Student heeft voorstel aangepast en opnieuw ingediend', ?)`,
      [stage_id, oudeStatus, req.user.id]
    );

    res.json({ message: 'Stagevoorstel succesvol aangepast en opnieuw ingediend', stage_id: Number(stage_id) });

  } catch (err) {
    console.error('Stage updaten fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// =============================================
// COMMISSIE / ADMIN ROUTES
// =============================================

// GET /api/stages — alle stages ophalen (voor commissie/admin)
router.get('/', authMiddleware, hasRole('admin', 'commissielid'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*,
              b.naam        AS bedrijf_naam,
              b.sector,
              g.voornaam    AS student_voornaam,
              g.achternaam  AS student_achternaam,
              g.email       AS student_email
       FROM stage s
       LEFT JOIN bedrijf  b  ON b.id  = s.bedrijf_id
       LEFT JOIN student  st ON st.id = s.student_id
       LEFT JOIN gebruiker g ON g.id  = st.gebruiker_id
       ORDER BY s.aangemaakt_op DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Stages ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// POST /api/stages/:id/beslissing — stage goedkeuren / afkeuren / aanpassingen vereisen
router.post('/:id/beslissing', authMiddleware, hasRole('admin', 'commissielid'), async (req, res) => {
  const stage_id = req.params.id;
  const { beslissing, opmerking, docent_id } = req.body;
  const commissielid_id = req.user.id;

  const geldigeBeslissingen = ['goedgekeurd', 'afgekeurd', 'aanpassingen_vereist'];
  if (!geldigeBeslissingen.includes(beslissing)) {
    return res.status(400).json({ error: 'Ongeldige beslissing.' });
  }

  // Bij goedkeuring is een docent verplicht
  if (beslissing === 'goedgekeurd' && !docent_id) {
    return res.status(400).json({ error: 'Bij goedkeuring moet een docent gekozen worden.' });
  }

  try {
    const [stageRows] = await db.query('SELECT status FROM stage WHERE id = ?', [stage_id]);
    if (stageRows.length === 0) {
      return res.status(404).json({ error: 'Stage niet gevonden.' });
    }
    const oudeStatus = stageRows[0].status;

    await db.query(
      `INSERT INTO beslissing (stage_id, commissielid_id, beslissing, opmerking)
       VALUES (?, ?, ?, ?)`,
      [stage_id, commissielid_id, beslissing, opmerking || null]
    );

    // Bij goedkeuring ook de docent toewijzen
    if (beslissing === 'goedgekeurd') {
      await db.query(
        'UPDATE stage SET status = ?, docent_id = ? WHERE id = ?',
        [beslissing, docent_id, stage_id]
      );
    } else {
      await db.query(
        'UPDATE stage SET status = ? WHERE id = ?',
        [beslissing, stage_id]
      );
    }

    await db.query(
      `INSERT INTO stage_geschiedenis (stage_id, oude_status, nieuwe_status, opmerking, gewijzigd_door)
       VALUES (?, ?, ?, ?, ?)`,
      [stage_id, oudeStatus, beslissing, opmerking || null, commissielid_id]
    );

    res.json({
      message: 'Beslissing succesvol opgeslagen.',
      beslissing,
      stage_id: Number(stage_id)
    });

  } catch (err) {
    console.error('Beslissing opslaan fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;


