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
    const { voornaam, achternaam, email, wachtwoord, rollen } = req.body;
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
          const nr = 'STU' + String(gebruikerId).padStart(5, '0');
          await db.query('INSERT INTO student (gebruiker_id, studentnummer) VALUES (?, ?)', [gebruikerId, nr]);
        }
        if (rolNaam === 'docent') {
          await db.query('INSERT INTO docent (gebruiker_id) VALUES (?)', [gebruikerId]);
        }
        if (rolNaam === 'mentor') {
          await db.query('INSERT INTO mentor (gebruiker_id) VALUES (?)', [gebruikerId]);
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

module.exports = router;
