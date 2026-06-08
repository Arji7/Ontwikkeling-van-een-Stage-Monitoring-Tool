const express = require('express');
const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.json({ bericht: 'login route — nog te implementeren' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ bericht: 'logout route — nog te implementeren' });
});

module.exports = router;
