// routes/parent.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/parent.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('parent'));

router.get('/my-children',                ctrl.getMyChildren);
router.get('/children/:id/grades',        ctrl.getChildGrades);
router.get('/children/:id/absences',      ctrl.getChildAbsences);
router.get('/children/:id/homework',      ctrl.getChildHomework);
router.get('/children/:id/payments',      ctrl.getChildPayments);
router.get('/children/:id/schedule',      ctrl.getChildSchedule);
router.get('/notices',                    ctrl.getNotices);

module.exports = router;