const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ Stage Monitor API werkt!' });
});

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/gebruikers', require('./routes/gebruikers'));
app.use('/api/stages',      require('./routes/stages'));
app.use('/api/logboeken',   require('./routes/logboeken'));
// app.use('/api/evaluaties',  require('./routes/evaluaties'));
// app.use('/api/competenties',require('./routes/competenties'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server draait op http://localhost:${PORT}`);
});