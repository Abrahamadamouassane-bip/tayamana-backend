// routes/auth.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/validate-code', [
  body('code').trim().notEmpty().isLength({ min: 8, max: 8 }).isAlphanumeric(),
], ctrl.validateCode);

router.post('/create-password', [
  body('userId').notEmpty(),
  body('code').trim().notEmpty(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[a-z]/)
    .matches(/[0-9]/)
    .matches(/[!@#$&*~_\-=+?]/),
  body('enableBiometric').optional().isBoolean(),
], ctrl.createPassword);

router.post('/login', [
  body('phone').trim().notEmpty(),
  body('password').notEmpty(),
], ctrl.login);

router.post('/refresh', ctrl.refreshToken);
router.post('/logout',  authenticate, ctrl.logout);

module.exports = router;