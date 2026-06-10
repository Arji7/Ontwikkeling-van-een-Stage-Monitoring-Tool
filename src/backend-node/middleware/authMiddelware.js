const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Geen toegang — niet ingelogd' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Ongeldige of verlopen token' });
  }
}

function hasRole(...roles) {
  return (req, res, next) => {
    const userRoles = req.user?.rollen || [];
    if (roles.some(r => userRoles.includes(r))) {
      next();
    } else {
      res.status(403).json({ error: 'Geen toegang — onvoldoende rechten' });
    }
  };
}

module.exports = { authMiddleware, hasRole };