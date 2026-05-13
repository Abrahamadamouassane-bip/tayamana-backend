// routes/teacher.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('teacher', 'admin'));

router.get ('/my-classes',                ctrl.getMyClasses);
router.get ('/classes/:classId/students', ctrl.getClassStudents);
router.post('/attendance',                ctrl.markAttendance);
router.get ('/attendance/:classId/:date', ctrl.getAttendance);
router.post('/grades',                    ctrl.addGrade);
router.put ('/grades/:id',                ctrl.updateGrade);
router.post('/homework',                  ctrl.publishHomework);
router.get ('/homework/:classId',         ctrl.getHomework);

module.exports = router;