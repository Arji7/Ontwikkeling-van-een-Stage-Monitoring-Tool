const express = require('express');
const router  = express.Router();
const db      = require('../db');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authMiddleware, hasRole } = require('../middleware/authMiddelware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'documenten');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniq = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, uniq + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/documenten/stage/:stageId — alle documenten + overeenkomst
router.get('/stage/:stageId', authMiddleware, async (req, res) => {
  try {
    const [docs] = await db.query(
      `SELECT d.*, g.voornaam, g.achternaam
       FROM document d
       LEFT JOIN gebruiker g ON g.id = d.geupload_door
       WHERE d.stage_id = ?
       ORDER BY d.geupload_op DESC`,
      [req.params.stageId]
    );

    const [overeenkomst] = await db.query(
      `SELECT so.*,
        (SELECT COUNT(*) FROM overeenkomst_handtekening oh WHERE oh.overeenkomst_id = so.id) AS aantal_handtekeningen
       FROM stageovereenkomst so
       WHERE so.stage_id = ?`,
      [req.params.stageId]
    );

    const [handtekeningen] = overeenkomst.length > 0
      ? await db.query(
          `SELECT oh.*, g.voornaam, g.achternaam
           FROM overeenkomst_handtekening oh
           JOIN gebruiker g ON g.id = oh.gebruiker_id
           WHERE oh.overeenkomst_id = ?
           ORDER BY oh.ondertekend_op ASC`,
          [overeenkomst[0].id]
        )
      : [[]];

    res.json({
      documenten: docs,
      overeenkomst: overeenkomst.length > 0 ? { ...overeenkomst[0], handtekeningen } : null
    });
  } catch (err) {
    console.error('Documenten ophalen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// POST /api/documenten — document uploaden
router.post('/', authMiddleware, upload.single('bestand'), async (req, res) => {
  const { stage_id, type } = req.body;
  if (!stage_id || !type || !req.file) {
    return res.status(400).json({ error: 'stage_id, type en bestand zijn verplicht.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO document (stage_id, type, bestandsnaam, bestandspad, bestandsgrootte, geupload_door)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [stage_id, type, req.file.originalname, '/uploads/documenten/' + req.file.filename, req.file.size, req.user.id]
    );
    res.status(201).json({ message: 'Document geüpload', id: result.insertId });
  } catch (err) {
    console.error('Document uploaden fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// PUT /api/documenten/:id/status — document goedkeuren/afkeuren (docent)
router.put('/:id/status', authMiddleware, hasRole('docent', 'admin'), async (req, res) => {
  const { status } = req.body;
  if (!['goedgekeurd', 'afgekeurd'].includes(status)) {
    return res.status(400).json({ error: 'Status moet "goedgekeurd" of "afgekeurd" zijn.' });
  }
  try {
    await db.query('UPDATE document SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Document status bijgewerkt' });
  } catch (err) {
    console.error('Document status fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// POST /api/documenten/:id/feedback — feedback op document
router.post('/:id/feedback', authMiddleware, async (req, res) => {
  const { feedback } = req.body;
  if (!feedback) return res.status(400).json({ error: 'Feedback is verplicht.' });
  try {
    await db.query(
      'INSERT INTO document_feedback (document_id, gebruiker_id, feedback) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, feedback]
    );
    res.status(201).json({ message: 'Feedback geplaatst' });
  } catch (err) {
    console.error('Document feedback fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

// DELETE /api/documenten/:id — document verwijderen
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [docs] = await db.query('SELECT * FROM document WHERE id = ?', [req.params.id]);
    if (docs.length === 0) return res.status(404).json({ error: 'Document niet gevonden.' });

    if (docs[0].bestandspad) {
      const fullPath = path.join(__dirname, '..', docs[0].bestandspad.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await db.query('DELETE FROM document WHERE id = ?', [req.params.id]);
    res.json({ message: 'Document verwijderd' });
  } catch (err) {
    console.error('Document verwijderen fout:', err);
    res.status(500).json({ error: 'Interne serverfout' });
  }
});

module.exports = router;
