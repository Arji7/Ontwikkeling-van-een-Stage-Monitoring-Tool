const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Frontend statische bestanden serveren
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Geüploade bestanden serveren (zoals logboek bijlagen)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ Stage Monitor API werkt!' });
});

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/gebruikers', require('./routes/gebruikers'));
app.use('/api/stages',      require('./routes/stages'));
app.use('/api/logboeken',   require('./routes/logboeken'));
app.use('/api/evaluaties',  require('./routes/evaluaties'));
app.use('/api/competenties',require('./routes/competenties'));
app.use('/api/documenten',  require('./routes/documenten'));
app.use('/api/admin',       require('./routes/admin'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server draait op http://localhost:${PORT}`);
});