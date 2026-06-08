const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'غير مصرح لك، يرجى تسجيل الدخول' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query('SELECT id, full_name, email, role, avatar, is_active FROM users WHERE id = ?', [decoded.id]);
    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'الحساب غير موجود أو محظور' });
    }
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذا المورد' });
  }
  next();
};

module.exports = { protect, authorize };
