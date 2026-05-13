// controllers/parent.controller.js
const { pool } = require('../config/database');

exports.getMyChildren = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id, s.first_name, s.last_name, s.birth_date, s.gender,
        c.name  AS class_name,
        c.level,
        sy.label AS school_year
      FROM students s
      JOIN classes      c  ON s.class_id      = c.id
      JOIN school_years sy ON c.school_year_id = sy.id
      WHERE s.parent_id = ? AND s.is_active = 1
      ORDER BY s.first_name
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

const checkChildAccess = async (childId, parentId) => {
  const [rows] = await pool.query(
    `SELECT id, class_id FROM students WHERE id = ? AND parent_id = ?`,
    [childId, parentId]
  );
  return rows.length > 0 ? rows[0] : null;
};

exports.getChildGrades = async (req, res) => {
  try {
    const child = await checkChildAccess(req.params.id, req.user.id);
    if (!child) return res.status(403).json({ success: false, message: 'Accès refusé.' });

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
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getChildAbsences = async (req, res) => {
  try {
    const child = await checkChildAccess(req.params.id, req.user.id);
    if (!child) return res.status(403).json({ success: false, message: 'Accès refusé.' });

    const [rows] = await pool.query(`
      SELECT
        a.id, a.date, a.status, a.reason,
        u.full_name AS teacher_name
      FROM attendance a
      JOIN users u ON a.marked_by = u.id
      WHERE a.student_id = ?
        AND a.status IN ('absent', 'late', 'excused')
      ORDER BY a.date DESC
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getChildHomework = async (req, res) => {
  try {
    const child = await checkChildAccess(req.params.id, req.user.id);
    if (!child) return res.status(403).json({ success: false, message: 'Accès refusé.' });

    const [rows] = await pool.query(`
      SELECT
        h.id, h.subject, h.description, h.due_date, h.created_at,
        u.full_name AS teacher_name
      FROM homework h
      JOIN users u ON h.teacher_id = u.id
      WHERE h.class_id = ? AND h.due_date >= CURDATE()
      ORDER BY h.due_date ASC
    `, [child.class_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getChildPayments = async (req, res) => {
  try {
    const child = await checkChildAccess(req.params.id, req.user.id);
    if (!child) return res.status(403).json({ success: false, message: 'Accès refusé.' });

    const [rows] = await pool.query(`
      SELECT
        p.id, p.amount, p.tranche, p.payment_date, p.payment_method,
        sy.label AS school_year
      FROM payments p
      JOIN school_years sy ON p.school_year_id = sy.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getChildSchedule = async (req, res) => {
  try {
    const child = await checkChildAccess(req.params.id, req.user.id);
    if (!child) return res.status(403).json({ success: false, message: 'Accès refusé.' });

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
    `, [child.class_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        n.id, n.title, n.content, n.type, n.created_at,
        u.full_name AS author
      FROM notices n
      JOIN users u ON n.published_by = u.id
      WHERE n.is_active = 1
        AND n.target_role IN ('all', 'parent')
      ORDER BY n.created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};