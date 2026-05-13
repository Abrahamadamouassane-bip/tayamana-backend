// routes/student.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('student'));

router.get('/grades',   ctrl.getGrades);
router.get('/homework', ctrl.getHomework);
router.get('/schedule', ctrl.getSchedule);

module.exports = router;