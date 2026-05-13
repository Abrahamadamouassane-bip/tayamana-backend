// controllers/admin.controller.js
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// ── Générateur de code unique ─────────────────────────────
const generateCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ── ÉLÈVES ────────────────────────────────────────────────
exports.getStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id, s.first_name, s.last_name, s.birth_date, s.gender,
        c.name  AS class_name,
        c.level,
        sy.label AS school_year,
        u.full_name AS parent_name,
        u.phone     AS parent_phone
      FROM students s
      JOIN classes      c  ON s.class_id      = c.id
      JOIN school_years sy ON c.school_year_id = sy.id
      LEFT JOIN users   u  ON s.parent_id      = u.id
      WHERE s.is_active = 1
      ORDER BY c.name, s.last_name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getStudents:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.createStudent = async (req, res) => {
  const { firstName, lastName, birthDate, gender, classId, parentId } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO students
         (first_name, last_name, birth_date, gender, class_id, parent_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, birthDate || null, gender || null, classId, parentId || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    console.error('createStudent:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.updateStudent = async (req, res) => {
  const { firstName, lastName, birthDate, gender, classId } = req.body;
  try {
    await pool.query(
      `UPDATE students
       SET first_name = ?, last_name = ?, birth_date = ?,
           gender = ?, class_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [firstName, lastName, birthDate || null, gender || null, classId, req.params.id]
    );
    res.json({ success: true, message: 'Élève mis à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await pool.query(
      `UPDATE students SET is_active = 0 WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true, message: 'Élève archivé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── CLASSES ───────────────────────────────────────────────
exports.getClasses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id, c.name, c.level, c.section,
        sy.label AS school_year,
        u.full_name AS teacher_name,
        COUNT(s.id) AS student_count
      FROM classes c
      JOIN school_years sy ON c.school_year_id = sy.id
      LEFT JOIN users    u ON c.teacher_id      = u.id
      LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.level, c.name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.createClass = async (req, res) => {
  const { name, level, section, schoolYearId, teacherId } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO classes (name, level, section, school_year_id, teacher_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, level, section || null, schoolYearId, teacherId || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── ENSEIGNANTS ───────────────────────────────────────────
exports.getTeachers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, full_name, phone, email, subject, is_active
      FROM users
      WHERE role = 'teacher'
      ORDER BY full_name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.createTeacher = async (req, res) => {
  const { fullName, phone, email, subject, password } = req.body;
  try {
    const hashedPw = await bcrypt.hash(
      password || 'Tayamana123!',
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    const [result] = await pool.query(
      `INSERT INTO users
         (full_name, phone, email, subject, password_hash, role, is_first_login)
       VALUES (?, ?, ?, ?, ?, 'teacher', 0)`,
      [fullName, phone, email || null, subject, hashedPw]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ce numéro de téléphone existe déjà.',
      });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    await pool.query(
      `UPDATE users SET is_active = 0 WHERE id = ? AND role = 'teacher'`,
      [req.params.id]
    );
    res.json({ success: true, message: 'Enseignant désactivé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── PAIEMENTS ─────────────────────────────────────────────
exports.getPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id, p.amount, p.tranche, p.payment_date, p.payment_method,
        s.first_name, s.last_name,
        u.full_name AS parent_name
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN users    u ON s.parent_id  = u.id
      ORDER BY p.payment_date DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.recordPayment = async (req, res) => {
  const { studentId, amount, tranche, paymentMethod, notes } = req.body;
  try {
    const [sy] = await pool.query(
      `SELECT id FROM school_years WHERE is_active = 1 LIMIT 1`
    );
    const schoolYearId = sy.length > 0 ? sy[0].id : 1;

    const [result] = await pool.query(
      `INSERT INTO payments
         (student_id, school_year_id, amount, tranche, payment_method, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [studentId, schoolYearId, amount, tranche || 1,
       paymentMethod || 'cash', notes || null, req.user.id]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── CODES UNIQUES ─────────────────────────────────────────
exports.generateParentCode = async (req, res) => {
  const { fullName, phone, studentId } = req.body;
  try {
    // Génère un code unique sans doublon
    let code;
    let exists = true;
    while (exists) {
      code = generateCode(8);
      const [check] = await pool.query(
        `SELECT id FROM users WHERE unique_code = ?`,
        [code]
      );
      exists = check.length > 0;
    }

    const [result] = await pool.query(
      `INSERT INTO users (full_name, phone, unique_code, role, is_first_login)
       VALUES (?, ?, ?, 'parent', 1)`,
      [fullName, phone, code]
    );

    if (studentId) {
      await pool.query(
        `UPDATE students SET parent_id = ? WHERE id = ?`,
        [result.insertId, studentId]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Code généré avec succès.',
      data: { parentId: result.insertId, code },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ce numéro de téléphone existe déjà.',
      });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── ANNÉES SCOLAIRES ──────────────────────────────────────
exports.getSchoolYears = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, label, start_date, end_date, is_active
       FROM school_years
       ORDER BY start_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.createSchoolYear = async (req, res) => {
  const { label, startDate, endDate } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`UPDATE school_years SET is_active = 0`);
    const [result] = await conn.query(
      `INSERT INTO school_years (label, start_date, end_date, is_active)
       VALUES (?, ?, ?, 1)`,
      [label, startDate, endDate]
    );
    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
};

exports.promoteStudents = async (req, res) => {
  const { schoolYearId, promotions } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const p of promotions) {
      await conn.query(
        `INSERT INTO student_history
           (student_id, class_id, school_year_id, status)
         SELECT id, class_id, ?, ?
         FROM students WHERE id = ?`,
        [schoolYearId, p.status || 'promoted', p.studentId]
      );
      await conn.query(
        `UPDATE students SET class_id = ?, updated_at = NOW() WHERE id = ?`,
        [p.newClassId, p.studentId]
      );
    }
    await conn.commit();
    res.json({
      success: true,
      message: `${promotions.length} élève(s) traité(s).`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
};