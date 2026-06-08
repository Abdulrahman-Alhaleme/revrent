const db = require('../config/db');
const crypto = require('crypto');

const generateRef = () => 'RR-' + crypto.randomBytes(4).toString('hex').toUpperCase();

exports.createBooking = async (req, res) => {
  try {
    const { rim_id, start_date, end_date, notes, delivery_required, pickup_address } = req.body;
    if (!rim_id || !start_date || !end_date) return res.status(400).json({ success: false, message: 'المصفة والتاريخ مطلوبان' });

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end <= start) return res.status(400).json({ success: false, message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' });

    const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const [rimRows] = await db.query('SELECT * FROM rims WHERE id = ? AND is_available = 1', [rim_id]);
    const rim = rimRows[0];
    if (!rim) return res.status(404).json({ success: false, message: 'المصفة غير متاحة' });

    // Check conflicts
    const [conflicts] = await db.query(
      `SELECT id FROM bookings WHERE rim_id = ? AND status IN ('confirmed','active')
       AND NOT (end_date < ? OR start_date > ?)`,
      [rim_id, start_date, end_date]
    );
    if (conflicts.length > 0) return res.status(409).json({ success: false, message: 'المصفة محجوزة في هذه الفترة' });

    const subtotal = rim.price_per_day * total_days;
    const service_fee = +(subtotal * 0.05).toFixed(2);
    const total_amount = +(subtotal + service_fee).toFixed(2);

    const [result] = await db.query(
      'INSERT INTO bookings (booking_ref,user_id,rim_id,shop_id,start_date,end_date,total_days,price_per_day,subtotal,service_fee,total_amount,notes,delivery_required,pickup_address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [generateRef(), req.user.id, rim_id, rim.shop_id, start_date, end_date, total_days, rim.price_per_day, subtotal, service_fee, total_amount, notes||null, delivery_required||false, pickup_address||null]
    );

    // Notify shop owner
    const [shopOwner] = await db.query('SELECT owner_id FROM shops WHERE id = ?', [rim.shop_id]);
    if (shopOwner[0]) {
      await db.query(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?,?,?,?,?)',
        [shopOwner[0].owner_id, 'booking_created', 'طلب حجز جديد', `طلب حجز جديد للمصفة: ${rim.name}`, `/shop/bookings/${result.insertId}`]
      );
    }

    res.status(201).json({ success: true, message: 'تم إنشاء طلب الحجز', booking_id: result.insertId, total_amount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let where = 'b.user_id = ?';
    const params = [req.user.id];
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const [bookings] = await db.query(
      `SELECT b.*, r.name as rim_name, r.brand as rim_brand, r.size as rim_size,
       (SELECT image_url FROM rim_images WHERE rim_id = r.id AND is_primary = 1 LIMIT 1) as rim_image,
       s.name as shop_name, s.phone as shop_phone
       FROM bookings b JOIN rims r ON b.rim_id = r.id JOIN shops s ON b.shop_id = s.id
       WHERE ${where} ORDER BY b.created_at DESC`,
      params
    );
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getShopBookings = async (req, res) => {
  try {
    const [shop] = await db.query('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
    if (!shop[0]) return res.status(404).json({ success: false, message: 'لم يتم العثور على محل' });

    const [bookings] = await db.query(
      `SELECT b.*, r.name as rim_name, r.size as rim_size,
       u.full_name as user_name, u.phone as user_phone, u.email as user_email
       FROM bookings b JOIN rims r ON b.rim_id = r.id JOIN users u ON b.user_id = u.id
       WHERE b.shop_id = ? ORDER BY b.created_at DESC`,
      [shop[0].id]
    );
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, cancellation_reason } = req.body;
    const [booking] = await db.query(
      'SELECT b.*, s.owner_id FROM bookings b JOIN shops s ON b.shop_id = s.id WHERE b.id = ?',
      [req.params.id]
    );
    if (!booking[0]) return res.status(404).json({ success: false, message: 'الحجز غير موجود' });

    const b = booking[0];
    const isOwner = b.owner_id === req.user.id;
    const isUser = b.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    const allowed = {
      shop_owner: ['confirmed', 'rejected', 'active', 'completed'],
      user: ['cancelled'],
      admin: ['confirmed', 'rejected', 'active', 'completed', 'cancelled']
    };

    if (!isAdmin && !isOwner && !isUser) return res.status(403).json({ success: false, message: 'غير مصرح' });
    const allowedStatuses = isAdmin ? allowed.admin : isOwner ? allowed.shop_owner : allowed.user;
    if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: 'الحالة غير مسموح بها' });

    await db.query('UPDATE bookings SET status = ?, cancellation_reason = ? WHERE id = ?', [status, cancellation_reason||null, req.params.id]);

    const typeMap = { confirmed: 'booking_confirmed', rejected: 'booking_rejected', completed: 'booking_completed', cancelled: 'booking_completed' };
    const titleMap = { confirmed: 'تم تأكيد حجزك', rejected: 'تم رفض طلب الحجز', completed: 'تم إتمام الحجز', cancelled: 'تم إلغاء الحجز' };
    if (typeMap[status]) {
      await db.query(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?,?,?,?,?)',
        [b.user_id, typeMap[status], titleMap[status], `حجزك رقم ${b.booking_ref} - ${titleMap[status]}`, `/bookings/${b.id}`]
      );
    }
    res.json({ success: true, message: 'تم تحديث حالة الحجز' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
