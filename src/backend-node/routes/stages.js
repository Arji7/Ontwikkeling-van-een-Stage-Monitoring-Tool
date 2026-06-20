
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const db      = require('../db');
const { authMiddleware, hasRole } = require('../middleware/authMiddelware');

const OVEREENKOMST_DIR = path.join(__dirname, '..', 'uploads', 'overeenkomsten');
if (!fs.existsSync(OVEREENKOMST_DIR)) fs.mkdirSync(OVEREENKOMST_DIR, { recursive: true });


// Hulpfunctie: gebruiker_id omzetten naar student_id
async function getStudentId(gebruikerId) {
  const [rijen] = await db.query(
    'SELECT id FROM student WHERE gebruiker_id = ?',
    [gebruikerId]
  );
  if (rijen.length === 0) return null;
  return rijen[0].id;
}

async function getBedrijfIdVoorAccount(gebruikerId) {
  try {
    const [[bedrijfAccount]] = await db.query(
      'SELECT bedrijf_id FROM bedrijf_account WHERE gebruiker_id = ?',
      [gebruikerId]
    );
    return bedrijfAccount ? bedrijfAccount.bedrijf_id : null;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return null;
    throw err;
  }
}

// Hulpfunctie: heeft de gebruiker een staf-rol (docent/mentor/commissielid/admin)?
function isStaf(user) {
  const stafRollen = ['docent', 'mentor', 'commissielid', 'admin'];
  return (user.rollen || []).some(r => stafRollen.includes(r));
}

// Standaard artikel-teksten voor de stageovereenkomst (reglement)
const ARTIKEL_TEKSTEN = {
  taken: "De student voert gedurende de stage de overeengekomen taken uit zoals beschreven in het stagevoorstel. " +
         "De stagementor stuurt bij waar nodig en zorgt voor voldoende leerkansen aangepast aan het opleidingsniveau.",
  rechtenPlichten: "De student houdt zich aan de geldende werk- en veiligheidsregels van de onderneming, " +
                   "respecteert de vertrouwelijkheid van informatie waarmee hij/zij in aanraking komt, " +
                   "en dient wekelijks een logboek in via het Stage Monitor platform.",
  verplichtingen: "De onderneming voorziet de student van een werkomgeving die past bij de opleidingsdoelen, " +
                  "stelt een stagementor aan en informeert de hogeschool tijdig bij problemen of afwezigheden.",
  verzekering: "De Erasmushogeschool Brussel voorziet in een verzekering burgerlijke aansprakelijkheid en " +
               "lichamelijke ongevallen voor de duur van de stage. De onderneming sluit geen bijkomende " +
               "arbeidsovereenkomst met de student.",
  evaluatie: "De student wordt tussentijds en op het einde van de stage geëvalueerd op basis van de " +
             "opleidingscompetenties. Stagementor en schoolbegeleider vullen samen een evaluatieformulier in.",
  beeindiging: "Bij ernstige tekortkomingen of overmacht kan de stage vroegtijdig worden beëindigd in overleg " +
               "tussen student, stagementor en schoolbegeleider. Eventuele beslissing wordt schriftelijk gemotiveerd.",
  toepasselijkRecht: "Op deze overeenkomst is het Belgisch recht van toepassing. Eventuele geschillen worden " +
                     "in eerste instantie minnelijk geregeld; bij gebrek aan akkoord zijn de rechtbanken van Brussel bevoegd."
};

// GET /api/stages/overeenkomst-document — alle data voor het overeenkomst document
// MOET vóór router.get('/:id') staan, anders matcht :id de path 'overeenkomst-document'
router.get('/overeenkomst-document', authMiddleware, async (req, res) => {
  try {
    // Staf met expliciet stage_id mag elk overeenkomst-document ophalen
    const stageIdParam = req.query.stage_id ? parseInt(req.query.stage_id, 10) : null;
    let whereClause = '';
    let params = [];
    if (stageIdParam && isStaf(req.user)) {
      whereClause = 'WHERE s.id = ?';
      params = [stageIdParam];
    } else if (stageIdParam && (req.user.rollen || []).includes('bedrijf')) {
      const bedrijfId = await getBedrijfIdVoorAccount(req.user.id);
      if (!bedrijfId) {
        return res.status(403).json({ error: 'Geen bedrijfprofiel gevonden.' });
      }
      whereClause = 'WHERE s.id = ? AND s.bedrijf_id = ?';
      params = [stageIdParam, bedrijfId];
    } else {
      const studentId = await getStudentId(req.user.id);
      if (!studentId) return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });
      whereClause = `WHERE s.student_id = ? AND s.status IN ('goedgekeurd', 'wacht_op_overeenkomst', 'actief')`;
      params = [studentId];
    }

    const [rijen] = await db.query(
      `SELECT s.id           AS stage_id,
              s.startdatum, s.einddatum, s.omschrijving,
              s.contact_naam, s.contact_email,
              s.status,
              b.naam         AS bedrijf_naam,
              b.adres        AS bedrijf_adres,
              b.postcode     AS bedrijf_postcode,
              b.stad         AS bedrijf_stad,
              b.btw_nummer   AS bedrijf_btw,
              st.studentnummer,
              sg.voornaam    AS student_voornaam,
              sg.achternaam  AS student_achternaam,
              o.naam         AS opleiding_naam,
              aj.naam        AS academiejaar_naam,
              dg.voornaam    AS docent_voornaam,
              dg.achternaam  AS docent_achternaam
       FROM stage s
       LEFT JOIN bedrijf      b  ON b.id  = s.bedrijf_id
       LEFT JOIN student      st ON st.id = s.student_id
       LEFT JOIN gebruiker    sg ON sg.id = st.gebruiker_id
       LEFT JOIN opleiding    o  ON o.id  = st.opleiding_id
       LEFT JOIN academiejaar aj ON aj.id = s.academiejaar_id
       LEFT JOIN docent       d  ON d.id  = s.docent_id
       LEFT JOIN gebruiker    dg ON dg.id = d.gebruiker_id
       ${whereClause}
       ORDER BY s.aangemaakt_op DESC
       LIMIT 1`,
      params
    );

    if (rijen.length === 0) {
      return res.status(404).json({ error: 'Geen goedgekeurde stage gevonden.' });
    }
    const r = rijen[0];

    const adres = [r.bedrijf_adres, r.bedrijf_postcode, r.bedrijf_stad].filter(Boolean).join(', ') || '—';
    const docentNaam = (r.docent_voornaam || r.docent_achternaam)
      ? ((r.docent_voornaam || '') + ' ' + (r.docent_achternaam || '')).trim()
      : '—';

    res.json({
      stage_id: r.stage_id,
      academiejaar: r.academiejaar_naam || '—',
      referentie: 'STG-' + (r.academiejaar_naam || 'XXXX') + '-' + r.stage_id,
      student: {
        naam: ((r.student_voornaam || '') + ' ' + (r.student_achternaam || '')).trim() || '—',
        studentnummer: r.studentnummer || '—',
        opleiding: r.opleiding_naam || '—',
        hogeschool: 'Erasmushogeschool Brussel'
      },
      onderneming: {
        naam: r.bedrijf_naam || '—',
        ondernemingsnr: r.bedrijf_btw || '—',
        adres: adres,
        stagementor: r.contact_naam || '—',
        begeleiderSchool: docentNaam
      },
      periode: {
        startdatum: r.startdatum || '—',
        einddatum: r.einddatum || '—',
        totaalUren: '—',
        werkdagen: '—',
        werkuren: '—',
        locatie: r.bedrijf_naam || '—'
      },
      artikels: ARTIKEL_TEKSTEN,
      ondertekenaars: await getOndertekenaars(r.stage_id, req.user.id, r)
    });
  } catch (err) {
    console.error('Overeenkomst document ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

async function getOndertekenaars(stageId, currentGebruikerId, r) {
  const [tekens] = await db.query(
    `SELECT oh.rol, oh.ondertekend_op, oh.gebruiker_id, g.voornaam, g.achternaam
     FROM overeenkomst_handtekening oh
     JOIN stageovereenkomst so ON so.id = oh.overeenkomst_id
     LEFT JOIN gebruiker g ON g.id = oh.gebruiker_id
     WHERE so.stage_id = ?`,
    [stageId]
  );

  const studentNaam = ((r.student_voornaam || '') + ' ' + (r.student_achternaam || '')).trim() || '—';
  const bedrijfNaam = r.bedrijf_naam || 'Bedrijf';
  const labels = { student: 'Student', bedrijf: 'Bedrijf', commissielid: 'Stagecommissie' };

  function bouw(rol, naam) {
    const t = tekens.find(t => t.rol === rol || (rol === 'bedrijf' && t.rol === 'mentor'));
    if (t) {
      return {
        naam: ((t.voornaam || '') + ' ' + (t.achternaam || '')).trim() || naam,
        rol: labels[rol] || rol,
        status: 'ondertekend',
        datum: t.ondertekend_op ? new Date(t.ondertekend_op).toLocaleDateString('nl-BE') : '',
        isHuidigeGebruiker: t.gebruiker_id === currentGebruikerId
      };
    }
    return { naam: naam, rol: labels[rol] || rol, status: 'in_afwachting', datum: '', isHuidigeGebruiker: false };
  }

  return [bouw('student', studentNaam), bouw('bedrijf', bedrijfNaam), bouw('commissielid', 'Stagecommissie')];
}

// POST /api/stages — stagevoorstel indienen
router.post('/', authMiddleware, async (req, res) => {
  const { bedrijf, sector, mentor, mentorEmail, startDatum, eindDatum, omschrijving, bedrijfNieuw } = req.body;

  if (!bedrijf || !mentor || !mentorEmail || !startDatum || !eindDatum || !omschrijving) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' });
  }

  try {
    const student_id = await getStudentId(req.user.id);
    if (!student_id) {
      return res.status(403).json({ error: 'Geen studentprofiel gevonden.' });
    }

    const [bedrijfRows] = await db.query('SELECT id FROM bedrijf WHERE naam = ?', [bedrijf]);
    let bedrijf_id;
    if (bedrijfRows.length > 0) {
      bedrijf_id = bedrijfRows[0].id;
    } else {
      if (!bedrijfNieuw || !bedrijfNieuw.adres || !bedrijfNieuw.btw || !bedrijfNieuw.email) {
        return res.status(400).json({ error: 'Vul de gegevens van het nieuwe bedrijf volledig in (adres, BTW, e-mail).' });
      }
      const [ins] = await db.query(
        `INSERT INTO bedrijf (naam, sector, adres, postcode, stad, btw_nummer, website, email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bedrijf,
          sector || null,
          bedrijfNieuw.adres,
          bedrijfNieuw.postcode || null,
          bedrijfNieuw.stad || null,
          bedrijfNieuw.btw,
          bedrijfNieuw.website || null,
          bedrijfNieuw.email,
        ]
      );
      bedrijf_id = ins.insertId;
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

// PUT /api/stages/:id/bewerken — stage bewerken (commissie/admin)
router.put('/:id/bewerken', authMiddleware, async (req, res) => {
  try {
    const rollen = req.user.rollen || [];
    const magBewerken = ['commissielid', 'admin'].some(r => rollen.includes(r));
    if (!magBewerken) return res.status(403).json({ error: 'Geen toegang.' });

    const { docent, mentor, mentorEmail, startdatum, einddatum, status } = req.body;

    await db.query(
      `UPDATE stage SET contact_naam = ?, contact_email = ?, startdatum = ?, einddatum = ?, status = ?
       WHERE id = ?`,
      [mentor || null, mentorEmail || null, startdatum || null, einddatum || null, status || 'actief', req.params.id]
    );

    if (docent) {
      const [docenten] = await db.query(
        `SELECT d.id FROM docent d JOIN gebruiker g ON g.id = d.gebruiker_id
         WHERE CONCAT(g.voornaam, ' ', g.achternaam) = ?`,
        [docent]
      );
      if (docenten.length > 0) {
        await db.query('UPDATE stage SET docent_id = ? WHERE id = ?', [docenten[0].id, req.params.id]);
      }
    }

    res.json({ message: 'Stage bijgewerkt.' });
  } catch (err) {
    console.error('Stage bewerken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
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

// GET /api/stages/docent/mijn — alle stages toegewezen aan ingelogde docent
router.get('/docent/mijn', authMiddleware, async (req, res) => {
  try {
    const [docentRows] = await db.query(
      'SELECT id FROM docent WHERE gebruiker_id = ?',
      [req.user.id]
    );
    if (docentRows.length === 0) {
      return res.status(403).json({ error: 'Geen docentprofiel gevonden.' });
    }
    const docent_id = docentRows[0].id;

    const [rows] = await db.query(
      `SELECT s.*,
              b.naam        AS bedrijf_naam,
              b.sector,
              sg.voornaam   AS student_voornaam,
              sg.achternaam AS student_achternaam,
              sg.email      AS student_email
       FROM stage s
       LEFT JOIN bedrijf   b  ON b.id  = s.bedrijf_id
       LEFT JOIN student   st ON st.id = s.student_id
       LEFT JOIN gebruiker sg ON sg.id = st.gebruiker_id
       WHERE s.docent_id = ?
       ORDER BY s.aangemaakt_op DESC`,
      [docent_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Docent stages fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/stages/mentor/mijn — stages van ingelogde mentor (via contact_email)
router.get('/mentor/mijn', authMiddleware, async (req, res) => {
  try {
    const [[gebruiker]] = await db.query('SELECT email FROM gebruiker WHERE id = ?', [req.user.id]);
    if (!gebruiker) return res.status(404).json({ error: 'Gebruiker niet gevonden.' });
    const [[mentorProfiel]] = await db.query('SELECT id FROM mentor WHERE gebruiker_id = ?', [req.user.id]);

    const [rows] = await db.query(
      `SELECT s.*,
              b.naam        AS bedrijf_naam,
              sg.voornaam   AS student_voornaam,
              sg.achternaam AS student_achternaam,
              sg.email      AS student_email,
              o.naam        AS opleiding_naam,
              IFNULL((SELECT MAX(l.week_nummer) FROM logboek l WHERE l.stage_id = s.id), 0) AS huidige_week,
              IFNULL(s.totaal_weken, 14) AS totaal_weken,
              so2.status    AS overeenkomst_status
       FROM stage s
       LEFT JOIN bedrijf          b   ON b.id   = s.bedrijf_id
       LEFT JOIN student          st  ON st.id  = s.student_id
       LEFT JOIN gebruiker        sg  ON sg.id  = st.gebruiker_id
       LEFT JOIN opleiding         o  ON o.id   = st.opleiding_id
       LEFT JOIN stageovereenkomst so2 ON so2.stage_id = s.id
       WHERE s.contact_email = ? OR s.mentor_id = ?
       ORDER BY s.aangemaakt_op DESC`,
      [gebruiker.email, mentorProfiel ? mentorProfiel.id : 0]
    );
    res.json(rows);
  } catch (err) {
    console.error('Mentor stages fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/stages/bedrijf/mijn — stages van ingelogd bedrijf
router.get('/bedrijf/mijn', authMiddleware, hasRole('bedrijf'), async (req, res) => {
  try {
    const bedrijfId = await getBedrijfIdVoorAccount(req.user.id);

    if (!bedrijfId) {
      return res.status(403).json({ error: 'Geen bedrijf gekoppeld aan dit account.' });
    }

    const [rows] = await db.query(
      `SELECT s.*,
              b.naam        AS bedrijf_naam,
              sg.voornaam   AS student_voornaam,
              sg.achternaam AS student_achternaam,
              sg.email      AS student_email,
              dg.voornaam   AS docent_voornaam,
              dg.achternaam AS docent_achternaam
       FROM stage s
       LEFT JOIN bedrijf   b  ON b.id  = s.bedrijf_id
       LEFT JOIN student   st ON st.id = s.student_id
       LEFT JOIN gebruiker sg ON sg.id = st.gebruiker_id
       LEFT JOIN docent    d  ON d.id  = s.docent_id
       LEFT JOIN gebruiker dg ON dg.id = d.gebruiker_id
       WHERE s.bedrijf_id = ?
         AND s.status IN ('goedgekeurd', 'wacht_op_overeenkomst', 'actief')
       ORDER BY s.aangemaakt_op DESC`,
      [bedrijfId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Bedrijf stages fout:', err);
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
              dg.achternaam AS docent_achternaam,
              so2.status    AS overeenkomst_status
       FROM stage s
       LEFT JOIN bedrijf           b   ON b.id   = s.bedrijf_id
       LEFT JOIN student           st  ON st.id  = s.student_id
       LEFT JOIN gebruiker         sg  ON sg.id  = st.gebruiker_id
       LEFT JOIN opleiding          o  ON o.id   = st.opleiding_id
       LEFT JOIN academiejaar       aj ON aj.id  = s.academiejaar_id
       LEFT JOIN docent             d  ON d.id   = s.docent_id
       LEFT JOIN gebruiker          dg ON dg.id  = d.gebruiker_id
       LEFT JOIN stageovereenkomst so2 ON so2.stage_id = s.id
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

// PATCH /api/stages/:id/koppelingen — admin koppelt bedrijf en/of mentor aan een stage
router.patch('/:id/koppelingen', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const stageId = req.params.id;
    const { bedrijf_id, mentor_id } = req.body;

    const [[stage]] = await db.query('SELECT id FROM stage WHERE id = ?', [stageId]);
    if (!stage) {
      return res.status(404).json({ error: 'Stage niet gevonden.' });
    }

    let bedrijfId = bedrijf_id ? Number(bedrijf_id) : null;
    const mentorId = mentor_id ? Number(mentor_id) : null;
    let gekozenMentor = null;

    if (!bedrijfId && !mentorId) {
      return res.status(400).json({ error: 'Kies minstens een bedrijf of mentor.' });
    }

    if (bedrijfId) {
      const [[bedrijf]] = await db.query('SELECT id FROM bedrijf WHERE id = ?', [bedrijfId]);
      if (!bedrijf) {
        return res.status(400).json({ error: 'Gekozen bedrijf bestaat niet.' });
      }
    }

    if (mentorId) {
      const [mentoren] = await db.query(
        `SELECT m.id, m.bedrijf_id, g.voornaam, g.achternaam, g.email
         FROM mentor m
         JOIN gebruiker g ON g.id = m.gebruiker_id
         WHERE m.id = ?`,
        [mentorId]
      );
      if (mentoren.length === 0) {
        return res.status(400).json({ error: 'Gekozen mentor bestaat niet.' });
      }
      gekozenMentor = mentoren[0];

      if (!bedrijfId && gekozenMentor.bedrijf_id) {
        bedrijfId = gekozenMentor.bedrijf_id;
      }
      if (bedrijfId && gekozenMentor.bedrijf_id && Number(gekozenMentor.bedrijf_id) !== bedrijfId) {
        return res.status(400).json({ error: 'Deze mentor hoort niet bij het gekozen bedrijf.' });
      }
    }

    const updates = [];
    const params = [];

    if (bedrijfId) {
      updates.push('bedrijf_id = ?');
      params.push(bedrijfId);
    }
    if (mentorId && gekozenMentor) {
      updates.push('mentor_id = ?', 'contact_naam = ?', 'contact_email = ?');
      params.push(
        mentorId,
        `${gekozenMentor.voornaam || ''} ${gekozenMentor.achternaam || ''}`.trim(),
        gekozenMentor.email
      );
    }

    params.push(stageId);
    await db.query(`UPDATE stage SET ${updates.join(', ')} WHERE id = ?`, params);

    await db.query(
      `INSERT INTO stage_geschiedenis (stage_id, oude_status, nieuwe_status, opmerking, gewijzigd_door)
       SELECT id, status, status, 'Admin heeft bedrijf/mentor-koppeling aangepast.', ?
       FROM stage
       WHERE id = ?`,
      [req.user.id, stageId]
    );

    res.json({ message: 'Koppeling opgeslagen.' });
  } catch (err) {
    console.error('Stage koppelingen opslaan fout:', err);
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

    // Bedrijf moet al bestaan (admin beheert de bedrijvenlijst)
    const [bedrijfRows] = await db.query('SELECT id FROM bedrijf WHERE naam = ?', [bedrijf]);
    if (bedrijfRows.length === 0) {
      return res.status(400).json({ error: 'Onbekend bedrijf. Vraag de admin om dit bedrijf eerst toe te voegen.' });
    }
    const bedrijf_id = bedrijfRows[0].id;

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
              b.naam           AS bedrijf_naam,
              b.sector,
              g.voornaam       AS student_voornaam,
              g.achternaam     AS student_achternaam,
              g.email          AS student_email,
              dg.voornaam      AS docent_voornaam,
              dg.achternaam    AS docent_achternaam,
              s.contact_naam   AS mentor_naam,
              s.contact_email  AS mentor_email,
              so2.status       AS overeenkomst_status
       FROM stage s
       LEFT JOIN bedrijf  b  ON b.id  = s.bedrijf_id
       LEFT JOIN student  st ON st.id = s.student_id
       LEFT JOIN gebruiker g ON g.id  = st.gebruiker_id
       LEFT JOIN docent    d  ON d.id  = s.docent_id
       LEFT JOIN gebruiker dg ON dg.id = d.gebruiker_id
       LEFT JOIN stageovereenkomst so2 ON so2.stage_id = s.id
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
  const { beslissing, opmerking, docent_id, bedrijf_id, mentor_id } = req.body;
  const commissielid_id = req.user.id;
  const isAdmin = (req.user.rollen || []).includes('admin');

  const geldigeBeslissingen = ['goedgekeurd', 'afgekeurd', 'aanpassingen_vereist'];
  if (!geldigeBeslissingen.includes(beslissing)) {
    return res.status(400).json({ error: 'Ongeldige beslissing.' });
  }

  // Bij goedkeuring is een docent verplicht
  if (beslissing === 'goedgekeurd' && !docent_id) {
    return res.status(400).json({ error: 'Bij goedkeuring moet een docent gekozen worden.' });
  }

  let docentRecordId = null;

  try {
    if (docent_id) {
      // docent_id kan een gebruiker_id of docent.id zijn — zoek het docent record
      let [docentRows] = await db.query('SELECT id FROM docent WHERE id = ?', [docent_id]);
      if (docentRows.length === 0) {
        [docentRows] = await db.query('SELECT id FROM docent WHERE gebruiker_id = ?', [docent_id]);
      }
      if (docentRows.length === 0) {
        return res.status(400).json({ error: 'Gekozen docent bestaat niet.' });
      }
      docentRecordId = docentRows[0].id;
    }
    const [stageRows] = await db.query('SELECT status FROM stage WHERE id = ?', [stage_id]);
    if (stageRows.length === 0) {
      return res.status(404).json({ error: 'Stage niet gevonden.' });
    }
    const oudeStatus = stageRows[0].status;

    if (!isAdmin && (bedrijf_id || mentor_id)) {
      return res.status(403).json({ error: 'Alleen admin mag een bedrijf of mentor koppelen.' });
    }

    if (bedrijf_id) {
      const [bedrijven] = await db.query('SELECT id FROM bedrijf WHERE id = ?', [bedrijf_id]);
      if (bedrijven.length === 0) {
        return res.status(400).json({ error: 'Gekozen bedrijf bestaat niet.' });
      }
    }

    let gekozenMentor = null;
    if (mentor_id) {
      const [mentoren] = await db.query(
        `SELECT m.id, g.voornaam, g.achternaam, g.email
         FROM mentor m
         JOIN gebruiker g ON g.id = m.gebruiker_id
         WHERE m.id = ?`,
        [mentor_id]
      );
      if (mentoren.length === 0) {
        return res.status(400).json({ error: 'Gekozen mentor bestaat niet.' });
      }
      gekozenMentor = mentoren[0];
    }

    // Definitieve beslissingen kunnen niet meer worden herzien
    if (['goedgekeurd', 'afgekeurd', 'wacht_op_overeenkomst', 'actief'].includes(oudeStatus)) {
      return res.status(400).json({ error: 'Deze aanvraag is al definitief beoordeeld en kan niet meer worden gewijzigd.' });
    }

    await db.query(
      `INSERT INTO beslissing (stage_id, commissielid_id, beslissing, opmerking)
       VALUES (?, ?, ?, ?)`,
      [stage_id, commissielid_id, beslissing, opmerking || null]
    );

    const updates = ['status = ?'];
    const updateParams = [beslissing];

    if (beslissing === 'goedgekeurd' && docentRecordId) {
      updates.push('docent_id = ?');
      updateParams.push(docentRecordId);
    }
    if (bedrijf_id) {
      updates.push('bedrijf_id = ?');
      updateParams.push(bedrijf_id);
    }
    if (mentor_id && gekozenMentor) {
      updates.push('mentor_id = ?', 'contact_naam = ?', 'contact_email = ?');
      updateParams.push(
        mentor_id,
        `${gekozenMentor.voornaam || ''} ${gekozenMentor.achternaam || ''}`.trim(),
        gekozenMentor.email
      );
    }

    updateParams.push(stage_id);
    await db.query(
      `UPDATE stage SET ${updates.join(', ')} WHERE id = ?`,
      updateParams
    );

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

// POST /api/stages/:id/onderteken — student, bedrijf of commissie ondertekent met canvas-PNG
router.post('/:id/onderteken', authMiddleware, async (req, res) => {
  const stageId = Number(req.params.id);
  const { handtekening } = req.body;

  if (!handtekening || typeof handtekening !== 'string' || !handtekening.startsWith('data:image/png;base64,')) {
    return res.status(400).json({ error: 'Ongeldige handtekening (verwacht data:image/png;base64,...).' });
  }

  try {
    const [stageRows] = await db.query(
      `SELECT s.id, s.student_id, s.bedrijf_id, s.status,
              st.gebruiker_id AS student_gebruiker_id
       FROM stage s
       LEFT JOIN student st ON st.id = s.student_id
       WHERE s.id = ?`,
      [stageId]
    );
    if (stageRows.length === 0) return res.status(404).json({ error: 'Stage niet gevonden.' });
    const stage = stageRows[0];

    if (!['goedgekeurd', 'wacht_op_overeenkomst'].includes(stage.status)) {
      return res.status(400).json({ error: 'Stage status laat ondertekenen niet toe.' });
    }

    const rollen = req.user.rollen || [];
    let rol = null;
    let bedrijfId = null;
    if (rollen.includes('bedrijf')) {
      bedrijfId = await getBedrijfIdVoorAccount(req.user.id);
    }
    if (rollen.includes('student') && stage.student_gebruiker_id === req.user.id) {
      rol = 'student';
    } else if (rollen.includes('bedrijf') && bedrijfId && Number(bedrijfId) === Number(stage.bedrijf_id)) {
      rol = 'bedrijf';
    } else if (rollen.includes('commissielid') || rollen.includes('admin')) {
      rol = 'commissielid';
    }
    if (!rol) return res.status(403).json({ error: 'Niet bevoegd om deze stage te ondertekenen.' });

    let [overeenkomstRows] = await db.query(
      'SELECT id FROM stageovereenkomst WHERE stage_id = ?', [stageId]
    );
    let overeenkomstId;
    if (overeenkomstRows.length === 0) {
      const [result] = await db.query(
        `INSERT INTO stageovereenkomst (stage_id, status, ondertekening_methode)
         VALUES (?, 'wacht_op_ondertekening', 'handtekening')`,
        [stageId]
      );
      overeenkomstId = result.insertId;
    } else {
      overeenkomstId = overeenkomstRows[0].id;
    }

    const [bestaand] = rol === 'bedrijf'
      ? await db.query(
          "SELECT id FROM overeenkomst_handtekening WHERE overeenkomst_id = ? AND rol IN ('bedrijf', 'mentor')",
          [overeenkomstId]
        )
      : await db.query(
          'SELECT id FROM overeenkomst_handtekening WHERE overeenkomst_id = ? AND rol = ?',
          [overeenkomstId, rol]
        );
    if (bestaand.length > 0) {
      return res.status(400).json({ error: 'Deze rol heeft al getekend.' });
    }

    const base64 = handtekening.replace(/^data:image\/png;base64,/, '');
    const bestand = path.join(OVEREENKOMST_DIR, stageId + '-' + rol + '.png');
    fs.writeFileSync(bestand, Buffer.from(base64, 'base64'));

    await db.query(
      `INSERT INTO overeenkomst_handtekening (overeenkomst_id, gebruiker_id, rol, methode, ip_adres)
       VALUES (?, ?, ?, 'handtekening', ?)`,
      [overeenkomstId, req.user.id, rol, req.ip || null]
    );

    const [alleTekens] = await db.query(
      'SELECT rol FROM overeenkomst_handtekening WHERE overeenkomst_id = ?',
      [overeenkomstId]
    );
    const rollenGetekend = alleTekens.map(t => t.rol);
    const bedrijfGetekend = rollenGetekend.includes('bedrijf') || rollenGetekend.includes('mentor');
    const alleGetekend = rollenGetekend.includes('student') && bedrijfGetekend && rollenGetekend.includes('commissielid');

    if (alleGetekend) {
      await db.query("UPDATE stage SET status = 'actief' WHERE id = ?", [stageId]);
      await db.query(
        "UPDATE stageovereenkomst SET status = 'ondertekend', ondertekend_op = NOW() WHERE id = ?",
        [overeenkomstId]
      );
      await db.query(
        `INSERT INTO stage_geschiedenis (stage_id, oude_status, nieuwe_status, opmerking, gewijzigd_door)
         VALUES (?, ?, 'actief', 'Overeenkomst door alle partijen ondertekend', ?)`,
        [stageId, stage.status, req.user.id]
      );
    }

    res.json({ ok: true, rol, alleGetekend, nieuweStatus: alleGetekend ? 'actief' : stage.status });
  } catch (err) {
    console.error('Onderteken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
