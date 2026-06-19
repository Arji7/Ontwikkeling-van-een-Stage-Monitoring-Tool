const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('../middleware/authMiddelware');
const bcrypt  = require('bcrypt');

function hasRole(...rollen) {
  return (req, res, next) => {
    if (!req.user || !req.user.rollen) return res.status(403).json({ error: 'Geen toegang.' });
    const heeftRol = rollen.some(r => req.user.rollen.includes(r));
    if (!heeftRol) return res.status(403).json({ error: 'Geen toegang.' });
    next();
  };
}

// GET /api/admin/stats — dashboard statistieken
router.get('/stats', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [[{ totaalGebruikers }]] = await db.query('SELECT COUNT(*) AS totaalGebruikers FROM gebruiker WHERE actief = TRUE');
    const [[{ totaalStudenten }]]  = await db.query('SELECT COUNT(*) AS totaalStudenten FROM student');
    const [[{ totaalDocenten }]]   = await db.query('SELECT COUNT(*) AS totaalDocenten FROM docent');
    const [[{ totaalMentoren }]]   = await db.query('SELECT COUNT(*) AS totaalMentoren FROM mentor');
    const [[{ totaalStages }]]     = await db.query('SELECT COUNT(*) AS totaalStages FROM stage');
    const [[{ actieveStages }]]    = await db.query("SELECT COUNT(*) AS actieveStages FROM stage WHERE status = 'actief'");
    const [[{ totaalEvaluaties }]] = await db.query('SELECT COUNT(*) AS totaalEvaluaties FROM evaluatie');

    res.json({
      totaalGebruikers,
      totaalStudenten,
      totaalDocenten,
      totaalMentoren,
      totaalStages,
      actieveStages,
      totaalEvaluaties
    });
  } catch (err) {
    console.error('Admin stats fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/admin/gebruikers — alle gebruikers met rollen
router.get('/gebruikers', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.id, g.voornaam, g.achternaam, g.email, g.actief, g.aangemaakt_op,
              GROUP_CONCAT(r.naam SEPARATOR ', ') AS rollen
       FROM gebruiker g
       LEFT JOIN gebruiker_rol gr ON gr.gebruiker_id = g.id
       LEFT JOIN rol r ON r.id = gr.rol_id
       GROUP BY g.id
       ORDER BY g.aangemaakt_op DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin gebruikers fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// POST /api/admin/gebruikers — nieuwe gebruiker aanmaken
router.post('/gebruikers', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { voornaam, achternaam, email, wachtwoord, rollen, bedrijf_id, studentnummer, opleiding_id, titel, functie } = req.body;
    if (!voornaam || !achternaam || !email || !wachtwoord) {
      return res.status(400).json({ error: 'Vul alle velden in.' });
    }

    const [[bestaand]] = await db.query('SELECT id FROM gebruiker WHERE email = ?', [email]);
    if (bestaand) return res.status(409).json({ error: 'Email bestaat al.' });

    const hash = await bcrypt.hash(wachtwoord, 10);
    const [result] = await db.query(
      'INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES (?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash]
    );
    const gebruikerId = result.insertId;

    if (rollen && Array.isArray(rollen)) {
      for (const rolNaam of rollen) {
        // Rol aanmaken als die nog niet bestaat
        await db.query('INSERT IGNORE INTO rol (naam) VALUES (?)', [rolNaam]);
        await db.query(
          'INSERT INTO gebruiker_rol (gebruiker_id, rol_id) SELECT ?, id FROM rol WHERE naam = ?',
          [gebruikerId, rolNaam]
        );
        if (rolNaam === 'student') {
          const nr = studentnummer || ('STU' + String(gebruikerId).padStart(5, '0'));
          await db.query(
            'INSERT INTO student (gebruiker_id, studentnummer, opleiding_id) VALUES (?, ?, ?)',
            [gebruikerId, nr, opleiding_id || null]
          );
        }
        if (rolNaam === 'docent') {
          await db.query('INSERT INTO docent (gebruiker_id, titel) VALUES (?, ?)', [gebruikerId, titel || null]);
        }
        if (rolNaam === 'mentor') {
          await db.query(
            'INSERT INTO mentor (gebruiker_id, bedrijf_id, functie) VALUES (?, ?, ?)',
            [gebruikerId, bedrijf_id || null, functie || null]
          );
        }
        if (rolNaam === 'bedrijf') {
          await db.query(
            'INSERT IGNORE INTO mentor (gebruiker_id, bedrijf_id) VALUES (?, ?)',
            [gebruikerId, bedrijf_id || null]
          );
        }
      }
    }

    res.status(201).json({ id: gebruikerId, message: 'Gebruiker aangemaakt.' });
  } catch (err) {
    console.error('Admin gebruiker aanmaken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// PUT /api/admin/gebruikers/:id — gebruiker bewerken
router.put('/gebruikers/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { voornaam, achternaam, email, actief, wachtwoord } = req.body;
    if (voornaam && achternaam && email) {
      await db.query(
        'UPDATE gebruiker SET voornaam = ?, achternaam = ?, email = ?, actief = ? WHERE id = ?',
        [voornaam, achternaam, email, actief, req.params.id]
      );
    } else {
      await db.query('UPDATE gebruiker SET actief = ? WHERE id = ?', [actief, req.params.id]);
    }
    if (wachtwoord && wachtwoord.length >= 8) {
      const hash = await bcrypt.hash(wachtwoord, 10);
      await db.query('UPDATE gebruiker SET wachtwoord_hash = ? WHERE id = ?', [hash, req.params.id]);
    }
    res.json({ message: 'Gebruiker bijgewerkt.' });
  } catch (err) {
    console.error('Admin gebruiker bewerken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// DELETE /api/admin/gebruikers/:id — gebruiker deactiveren
router.delete('/gebruikers/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE gebruiker SET actief = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Gebruiker gedeactiveerd.' });
  } catch (err) {
    console.error('Admin gebruiker deactiveren fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/admin/stages — alle stages met details
router.get('/stages', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.titel, s.status, s.startdatum, s.einddatum, s.aangemaakt_op,
              b.naam AS bedrijf_naam,
              sg.voornaam AS student_voornaam, sg.achternaam AS student_achternaam,
              dg.voornaam AS docent_voornaam, dg.achternaam AS docent_achternaam,
              mg.voornaam AS mentor_voornaam, mg.achternaam AS mentor_achternaam
       FROM stage s
       LEFT JOIN bedrijf   b  ON b.id  = s.bedrijf_id
       LEFT JOIN student   st ON st.id = s.student_id
       LEFT JOIN gebruiker sg ON sg.id = st.gebruiker_id
       LEFT JOIN docent    d  ON d.id  = s.docent_id
       LEFT JOIN gebruiker dg ON dg.id = d.gebruiker_id
       LEFT JOIN mentor    m  ON m.id  = s.mentor_id
       LEFT JOIN gebruiker mg ON mg.id = m.gebruiker_id
       ORDER BY s.aangemaakt_op DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin stages fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/admin/bedrijven — alle bedrijven
router.get('/bedrijven', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM stage s WHERE s.bedrijf_id = b.id) AS aantal_stages
       FROM bedrijf b
       ORDER BY b.naam`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin bedrijven fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/admin/bedrijven/:id — één bedrijf
router.get('/bedrijven/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [[bedrijf]] = await db.query('SELECT * FROM bedrijf WHERE id = ?', [req.params.id]);
    if (!bedrijf) return res.status(404).json({ error: 'Bedrijf niet gevonden.' });
    res.json(bedrijf);
  } catch (err) {
    console.error('Admin bedrijf ophalen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// POST /api/admin/bedrijven — nieuw bedrijf
router.post('/bedrijven', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { naam, sector, adres, postcode, stad, website, btw_nummer } = req.body;
    if (!naam) return res.status(400).json({ error: 'Naam is verplicht.' });
    const [result] = await db.query(
      'INSERT INTO bedrijf (naam, sector, adres, postcode, stad, website, btw_nummer) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [naam, sector, adres, postcode, stad, website, btw_nummer]
    );
    res.status(201).json({ id: result.insertId, message: 'Bedrijf aangemaakt.' });
  } catch (err) {
    console.error('Admin bedrijf aanmaken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// PUT /api/admin/bedrijven/:id — bedrijf bewerken
router.put('/bedrijven/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { naam, sector, adres, postcode, stad, website, btw_nummer } = req.body;
    await db.query(
      'UPDATE bedrijf SET naam = ?, sector = ?, adres = ?, postcode = ?, stad = ?, website = ?, btw_nummer = ? WHERE id = ?',
      [naam, sector, adres, postcode, stad, website, btw_nummer, req.params.id]
    );
    res.json({ message: 'Bedrijf bijgewerkt.' });
  } catch (err) {
    console.error('Admin bedrijf bewerken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// DELETE /api/admin/bedrijven/:id — bedrijf verwijderen
router.delete('/bedrijven/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM bedrijf WHERE id = ?', [req.params.id]);
    res.json({ message: 'Bedrijf verwijderd.' });
  } catch (err) {
    console.error('Admin bedrijf verwijderen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/admin/evaluaties — alle evaluaties met details
router.get('/evaluaties', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.type, e.status, e.week_nummer, e.aangemaakt_op,
              sg.voornaam AS student_voornaam, sg.achternaam AS student_achternaam,
              b.naam AS bedrijf_naam,
              dg.voornaam AS docent_voornaam, dg.achternaam AS docent_achternaam
       FROM evaluatie e
       JOIN stage s ON s.id = e.stage_id
       LEFT JOIN student st ON st.id = s.student_id
       LEFT JOIN gebruiker sg ON sg.id = st.gebruiker_id
       LEFT JOIN bedrijf b ON b.id = s.bedrijf_id
       LEFT JOIN docent d ON d.id = s.docent_id
       LEFT JOIN gebruiker dg ON dg.id = d.gebruiker_id
       ORDER BY e.aangemaakt_op DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin evaluaties fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// ============================================================
// COMPETENTIES — per opleiding
// ============================================================

// GET /api/admin/competenties/opleidingen — alle opleidingen met competentie-telling
router.get('/competenties/opleidingen', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.naam,
              COUNT(DISTINCT oc.competentie_id) AS aantal_competenties
       FROM opleiding o
       LEFT JOIN opleiding_competentie oc ON oc.opleiding_id = o.id
       WHERE o.actief = TRUE
       GROUP BY o.id
       ORDER BY o.naam`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin opleidingen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// POST /api/admin/competenties/opleidingen — opleiding toevoegen
router.post('/competenties/opleidingen', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { naam } = req.body;
    if (!naam) return res.status(400).json({ error: 'Naam is verplicht.' });
    const [result] = await db.query('INSERT INTO opleiding (naam) VALUES (?)', [naam]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Admin opleiding toevoegen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// GET /api/admin/competenties/opleiding/:oplId — competenties + subs + niveaus voor een opleiding
router.get('/competenties/opleiding/:oplId', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const [compRows] = await db.query(
      `SELECT c.id, c.naam AS omschrijving, c.beschrijving, c.volgorde,
              oc.id AS oc_id
       FROM competentie c
       JOIN opleiding_competentie oc ON oc.competentie_id = c.id
       WHERE oc.opleiding_id = ?
       ORDER BY c.volgorde ASC`,
      [req.params.oplId]
    );

    if (compRows.length === 0) return res.json([]);

    const compIds = compRows.map(c => c.id);
    const [subRows] = await db.query(
      `SELECT id, competentie_id, code, naam AS omschrijving, volgorde
       FROM subcompetentie WHERE competentie_id IN (?) ORDER BY volgorde ASC`,
      [compIds]
    );

    const subIds = subRows.map(s => s.id);
    let niveauRows = [];
    if (subIds.length > 0) {
      [niveauRows] = await db.query(
        `SELECT subcompetentie_id, niveau, label, beschrijving
         FROM subcompetentie_niveau WHERE subcompetentie_id IN (?) ORDER BY niveau ASC`,
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
      subMap[s.competentie_id].push({
        id: s.id, code: s.code, omschrijving: s.omschrijving,
        rubriek: niveauMap[s.id] || []
      });
    }

    const result = compRows.map(c => ({
      id: c.id, omschrijving: c.omschrijving, volgorde: c.volgorde,
      subcompetenties: subMap[c.id] || []
    }));

    res.json(result);
  } catch (err) {
    console.error('Admin competenties opleiding fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// POST /api/admin/competenties — competentie toevoegen + koppelen aan opleiding
router.post('/competenties', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { opleiding_id, omschrijving, volgorde } = req.body;
    if (!omschrijving) return res.status(400).json({ error: 'Omschrijving is verplicht.' });
    const [result] = await db.query(
      'INSERT INTO competentie (naam, volgorde) VALUES (?, ?)',
      [omschrijving, volgorde || 0]
    );
    if (opleiding_id) {
      await db.query(
        'INSERT INTO opleiding_competentie (opleiding_id, competentie_id) VALUES (?, ?)',
        [opleiding_id, result.insertId]
      );
    }
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Admin competentie toevoegen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// PUT /api/admin/competenties/:id — competentie bewerken
router.put('/competenties/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { omschrijving, volgorde } = req.body;
    await db.query('UPDATE competentie SET naam = ?, volgorde = ? WHERE id = ?',
      [omschrijving, volgorde || 0, req.params.id]);
    res.json({ message: 'Competentie bijgewerkt.' });
  } catch (err) {
    console.error('Admin competentie bewerken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// DELETE /api/admin/competenties/:id — competentie verwijderen
router.delete('/competenties/:id', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM competentie WHERE id = ?', [req.params.id]);
    res.json({ message: 'Competentie verwijderd.' });
  } catch (err) {
    console.error('Admin competentie verwijderen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// POST /api/admin/competenties/:compId/subcompetenties — subcompetentie toevoegen
router.post('/competenties/:compId/subcompetenties', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { code, omschrijving } = req.body;
    const [result] = await db.query(
      'INSERT INTO subcompetentie (competentie_id, code, naam) VALUES (?, ?, ?)',
      [req.params.compId, code, omschrijving]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Admin subcompetentie toevoegen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// PUT /api/admin/competenties/sub/:subId — subcompetentie bewerken
router.put('/competenties/sub/:subId', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { code, omschrijving } = req.body;
    await db.query('UPDATE subcompetentie SET code = ?, naam = ? WHERE id = ?',
      [code, omschrijving, req.params.subId]);
    res.json({ message: 'Subcompetentie bijgewerkt.' });
  } catch (err) {
    console.error('Admin subcompetentie bewerken fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// DELETE /api/admin/competenties/sub/:subId — subcompetentie verwijderen
router.delete('/competenties/sub/:subId', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM subcompetentie WHERE id = ?', [req.params.subId]);
    res.json({ message: 'Subcompetentie verwijderd.' });
  } catch (err) {
    console.error('Admin subcompetentie verwijderen fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

// PUT /api/admin/competenties/sub/:subId/niveau/:niveau — rubriek niveau opslaan
router.put('/competenties/sub/:subId/niveau/:niveau', authMiddleware, hasRole('admin'), async (req, res) => {
  try {
    const { beschrijving, label } = req.body;
    const [[bestaand]] = await db.query(
      'SELECT id FROM subcompetentie_niveau WHERE subcompetentie_id = ? AND niveau = ?',
      [req.params.subId, req.params.niveau]
    );
    if (bestaand) {
      await db.query('UPDATE subcompetentie_niveau SET beschrijving = ?, label = ? WHERE id = ?',
        [beschrijving, label || ('Score ' + req.params.niveau), bestaand.id]);
    } else {
      await db.query(
        'INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, beschrijving) VALUES (?, ?, ?, ?)',
        [req.params.subId, req.params.niveau, label || ('Score ' + req.params.niveau), beschrijving]
      );
    }
    res.json({ message: 'Rubriek opgeslagen.' });
  } catch (err) {
    console.error('Admin rubriek opslaan fout:', err);
    res.status(500).json({ error: 'Serverfout.' });
  }
});

module.exports = router;
