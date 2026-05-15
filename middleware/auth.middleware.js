// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'TayamanaSecretKey2024SuperSecure123!';

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Token manquant.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user      = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token invalide.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Droits insuffisants.',
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };