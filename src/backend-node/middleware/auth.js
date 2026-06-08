// Middleware om te controleren of de gebruiker is ingelogd
// Wordt later ingevuld met JWT verificatie

const verifieerToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Geen token meegegeven' });
  }

  // TODO: JWT token verifiëren
  next();
};

module.exports = { verifieerToken };
