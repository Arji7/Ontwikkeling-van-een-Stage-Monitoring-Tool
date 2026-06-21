const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers — Helmet zet X-Frame-Options, X-Content-Type-Options, etc.
// crossOriginResourcePolicy uitgeschakeld zodat de frontend op een ander domein
// nog statische bestanden uit /uploads kan ophalen.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — alleen toegelaten origins (komma-gescheiden in env), credentials toelaten.
// 'null' staat in defaults zodat file:// pagina's lokaal blijven werken; in productie
// vervang je CORS_ORIGINS door enkel je echte frontend-domein(en).
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,null')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, cb) {
    // Geen origin (Postman/curl) of toegelaten origin → ok
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Niet toegelaten door CORS-beleid: ' + origin));
  },
  credentials: true,
}));

// Rate limiter op login — max 10 pogingen per IP per 15 minuten
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Te veel inlogpogingen. Probeer over 15 minuten opnieuw.' },
});
app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
app.use('/api/bedrijven',   require('./routes/bedrijven'));
app.use('/api/admin',       require('./routes/admin'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server draait op http://localhost:${PORT}`);
});
