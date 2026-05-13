// routes/admin.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('admin'));

router.get   ('/students',             ctrl.getStudents);
router.post  ('/students',             ctrl.createStudent);
router.put   ('/students/:id',         ctrl.updateStudent);
router.delete('/students/:id',         ctrl.deleteStudent);

router.get   ('/teachers',             ctrl.getTeachers);
router.post  ('/teachers',             ctrl.createTeacher);
router.delete('/teachers/:id',         ctrl.deleteTeacher);

router.get   ('/classes',              ctrl.getClasses);
router.post  ('/classes',              ctrl.createClass);

router.get   ('/payments',             ctrl.getPayments);
router.post  ('/payments',             ctrl.recordPayment);

router.post  ('/generate-code',        ctrl.generateParentCode);

router.get   ('/school-years',         ctrl.getSchoolYears);
router.post  ('/school-years',         ctrl.createSchoolYear);
router.post  ('/school-years/promote', ctrl.promoteStudents);

module.exports = router;