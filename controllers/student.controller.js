// controllers/student.controller.js
const { pool } = require('../config/database');

const getStudentRecord = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, class_id FROM students
     WHERE student_user_id = ? AND is_active = 1`,
    [userId]
  );
  return rows[0] || null;
};

exports.getGrades = async (req, res) => {
  try {
    const student = await getStudentRecord(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Profil élève introuvable.',
      });
    }

    const [rows] = await pool.query(`
      SELECT
        g.subject,
        g.trimester,
        ROUND(SUM(g.value * g.coefficient) / SUM(g.coefficient), 2) AS average,
        MAX(g.value) AS max_grade,
        MIN(g.value) AS min_grade,
        COUNT(g.id)  AS grade_count
      FROM grades g
      JOIN school_years sy ON g.school_year_id = sy.id AND sy.is_active = 1
      WHERE g.student_id = ?
      GROUP BY g.subject, g.trimester
      ORDER BY g.subject
    `, [student.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getHomework = async (req, res) => {
  try {
    const student = await getStudentRecord(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Profil élève introuvable.',
      });
    }

    const [rows] = await pool.query(`
      SELECT
        h.id, h.subject, h.description, h.due_date, h.created_at,
        u.full_name AS teacher_name
      FROM homework h
      JOIN users u ON h.teacher_id = u.id
      WHERE h.class_id = ? AND h.due_date >= CURDATE()
      ORDER BY h.due_date ASC
    `, [student.class_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const student = await getStudentRecord(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Profil élève introuvable.',
      });
    }

    const [rows] = await pool.query(`
      SELECT
        sc.day_of_week, sc.start_time, sc.end_time,
        sc.subject, sc.room,
        u.full_name AS teacher_name
      FROM schedules sc
      JOIN users        u  ON sc.teacher_id     = u.id
      JOIN school_years sy ON sc.school_year_id = sy.id AND sy.is_active = 1
      WHERE sc.class_id = ?
      ORDER BY
        FIELD(sc.day_of_week,'lundi','mardi','mercredi','jeudi','vendredi','samedi'),
        sc.start_time
    `, [student.class_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};