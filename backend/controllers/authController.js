const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'الاسم والإيميل وكلمة المرور مطلوبة' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0]) return res.status(400).json({ success: false, message: 'الإيميل مستخدم بالفعل' });

    const hashedPwd = await bcrypt.hash(password, 10);
    const allowedRoles = ['user', 'shop_owner'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, phone, role) VALUES (?,?,?,?,?)',
      [full_name, email, hashedPwd, phone || null, userRole]
    );
    const token = signToken(result.insertId);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: { id: result.insertId, full_name, email, role: userRole }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'الإيميل وكلمة المرور مطلوبان' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }
    if (!user.is_active) return res.status(403).json({ success: false, message: 'الحساب محظور' });

    const token = signToken(user.id);
    const { password: _, ...userData } = user;
    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', token, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;

    await db.query('UPDATE users SET ? WHERE id = ?', [updates, req.user.id]);
    const [rows] = await db.query('SELECT id, full_name, email, phone, role, avatar FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!(await bcrypt.compare(current_password, rows[0].password))) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
