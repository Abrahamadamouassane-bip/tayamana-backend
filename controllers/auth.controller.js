// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

const JWT_SECRET          = 'TayamanaSecretKey2024SuperSecure123!';
const JWT_EXPIRES_IN      = '7d';
const JWT_REFRESH_EXPIRES = '30d';
const BCRYPT_ROUNDS       = 12;

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const generateRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES }
  );

const sendErrors = (res, errors) =>
  res.status(422).json({ success: false, errors: errors.array() });

exports.validateCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendErrors(res, errors);

  const code = req.body.code.toUpperCase();

  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, role
       FROM users
       WHERE unique_code = ?
         AND is_first_login = 1
         AND is_active = 1`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Code invalide ou déjà utilisé. Contactez l\'administration.',
      });
    }

    const user = rows[0];
    return res.json({
      success: true,
      message: 'Code valide.',
      data: {
        userId:   user.id,
        userName: user.full_name,
        role:     user.role,
      },
    });
  } catch (err) {
    console.error('validateCode:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.createPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendErrors(res, errors);

  const { userId, code, password, enableBiometric } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, role, phone
       FROM users
       WHERE id = ?
         AND unique_code = ?
         AND is_first_login = 1
         AND is_active = 1`,
      [userId, code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Requête invalide.',
      });
    }

    const user         = rows[0];
    const hashedPw     = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const token        = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    await pool.query(
      `UPDATE users
       SET password_hash     = ?,
           biometric_enabled = ?,
           is_first_login    = 0,
           unique_code       = NULL,
           refresh_token     = ?,
           updated_at        = NOW()
       WHERE id = ?`,
      [hashedPw, enableBiometric ? 1 : 0, refreshToken, user.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Mot de passe créé avec succès.',
      data: {
        token,
        refreshToken,
        user: {
          id:   user.id,
          name: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('createPassword:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendErrors(res, errors);

  const { phone, password } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, role, password_hash, is_active, is_first_login
       FROM users
       WHERE phone = ?`,
      [phone.trim()]
    );

    const invalid = {
      success: false,
      message: 'Numéro de téléphone ou mot de passe incorrect.',
    };

    if (rows.length === 0) return res.status(401).json(invalid);

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administration.',
      });
    }

    if (user.is_first_login) {
      return res.status(403).json({
        success: false,
        message: 'Première connexion requise. Utilisez votre code unique.',
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json(invalid);

    const token        = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    await pool.query(
      `UPDATE users
       SET refresh_token = ?,
           last_login    = NOW()
       WHERE id = ?`,
      [refreshToken, user.id]
    );

    return res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id:   user.id,
          name: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('login:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token manquant.',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const [rows]  = await pool.query(
      `SELECT id, full_name, role
       FROM users
       WHERE id = ? AND refresh_token = ?`,
      [decoded.id, refreshToken]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token invalide.',
      });
    }

    const newToken = generateToken(rows[0]);
    return res.json({ success: true, data: { token: newToken } });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Refresh token expiré ou invalide.',
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await pool.query(
      `UPDATE users SET refresh_token = NULL WHERE id = ?`,
      [req.user.id]
    );
    return res.json({ success: true, message: 'Déconnexion réussie.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};