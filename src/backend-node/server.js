require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes    = require('./routes/auth');
const stageRoutes   = require('./routes/stages');
const logboekRoutes = require('./routes/logboeken');
const evaluatieRoutes = require('./routes/evaluaties');
const competentieRoutes = require('./routes/competenties');
const gebruikerRoutes = require('./routes/gebruikers');

app.use('/api/auth',         authRoutes);
app.use('/api/stages',       stageRoutes);
app.use('/api/logboeken',    logboekRoutes);
app.use('/api/evaluaties',   evaluatieRoutes);
app.use('/api/competenties', competentieRoutes);
app.use('/api/gebruikers',   gebruikerRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ bericht: 'Stage Monitor API draait!' });
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
