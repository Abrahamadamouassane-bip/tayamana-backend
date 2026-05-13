// controllers/teacher.controller.js
const { pool } = require('../config/database');

exports.getMyClasses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.level, c.section,
             COUNT(s.id) AS student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1
      WHERE c.teacher_id = ? AND c.is_active = 1
      GROUP BY c.id
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getClassStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, first_name, last_name, gender, birth_date
      FROM students
      WHERE class_id = ? AND is_active = 1
      ORDER BY last_name
    `, [req.params.classId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.markAttendance = async (req, res) => {
  const { classId, date, records } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const r of records) {
      await conn.query(`
        INSERT INTO attendance (student_id, class_id, date, status, marked_by)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status    = VALUES(status),
          marked_by = VALUES(marked_by)
      `, [r.studentId, classId, date, r.status, req.user.id]);
    }
    await conn.commit();
    res.json({ success: true, message: 'Présences enregistrées.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
};

exports.getAttendance = async (req, res) => {
  const { classId, date } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.first_name, s.last_name,
             COALESCE(a.status, 'not_marked') AS status
      FROM students s
      LEFT JOIN attendance a
        ON a.student_id = s.id AND a.date = ?
      WHERE s.class_id = ? AND s.is_active = 1
      ORDER BY s.last_name
    `, [date, classId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.addGrade = async (req, res) => {
  const { studentId, subject, value, coefficient, label, classId, schoolYearId } = req.body;
  try {
    const [result] = await pool.query(`
      INSERT INTO grades
        (student_id, subject, value, coefficient, label, class_id, school_year_id, teacher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [studentId, subject, value, coefficient || 1, label, classId, schoolYearId || 1, req.user.id]);
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.updateGrade = async (req, res) => {
  const { value, label } = req.body;
  try {
    await pool.query(`
      UPDATE grades
      SET value = ?, label = ?, updated_at = NOW()
      WHERE id = ? AND teacher_id = ?
    `, [value, label, req.params.id, req.user.id]);
    res.json({ success: true, message: 'Note mise à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.publishHomework = async (req, res) => {
  const { classId, subject, description, dueDate } = req.body;
  try {
    const [result] = await pool.query(`
      INSERT INTO homework (class_id, subject, description, due_date, teacher_id)
      VALUES (?, ?, ?, ?, ?)
    `, [classId, subject, description, dueDate, req.user.id]);
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getHomework = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, subject, description, due_date, created_at
      FROM homework
      WHERE class_id = ?
      ORDER BY due_date DESC
    `, [req.params.classId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};