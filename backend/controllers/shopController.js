const db = require('../config/db');

// ============== SHOP CONTROLLER ==============
exports.getShops = async (req, res) => {
  try {
    const { city, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    let where = ['s.is_approved = 1'];
    let params = [];
    if (city) { where.push('s.city LIKE ?'); params.push(`%${city}%`); }
    if (search) { where.push('(s.name LIKE ? OR s.description LIKE ?)'); const q = `%${search}%`; params.push(q, q); }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM shops s WHERE ${where.join(' AND ')}`, params);
    const [shops] = await db.query(
      `SELECT s.*, u.full_name as owner_name, (SELECT COUNT(*) FROM rims WHERE shop_id = s.id AND is_available=1) as available_rims
       FROM shops s JOIN users u ON s.owner_id = u.id WHERE ${where.join(' AND ')} ORDER BY s.rating DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: shops, pagination: { page: +page, total, pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getShopById = async (req, res) => {
  try {
    const [shops] = await db.query(
      `SELECT s.*, u.full_name as owner_name, u.email as owner_email FROM shops s JOIN users u ON s.owner_id = u.id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!shops[0]) return res.status(404).json({ success: false, message: 'المحل غير موجود' });
    const [rims] = await db.query(
      `SELECT r.*, (SELECT image_url FROM rim_images WHERE rim_id=r.id AND is_primary=1 LIMIT 1) as primary_image FROM rims r WHERE r.shop_id=? AND r.is_available=1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...shops[0], rims } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createShop = async (req, res) => {
  try {
    const { name, description, address, city, phone } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'اسم المحل مطلوب' });
    const [existing] = await db.query('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
    if (existing[0]) return res.status(400).json({ success: false, message: 'لديك محل بالفعل' });

    const logo = req.files?.logo?.[0] ? `/uploads/shops/${req.files.logo[0].filename}` : null;
    const cover = req.files?.cover?.[0] ? `/uploads/shops/${req.files.cover[0].filename}` : null;
    const [result] = await db.query(
      'INSERT INTO shops (owner_id,name,description,address,city,phone,logo,cover_image) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, name, description||null, address||null, city||null, phone||null, logo, cover]
    );
    res.status(201).json({ success: true, message: 'تم إنشاء المحل وينتظر الموافقة', id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateShop = async (req, res) => {
  try {
    const [shop] = await db.query('SELECT id FROM shops WHERE owner_id = ? OR ?=1', [req.user.id, req.user.role === 'admin' ? 1 : 0]);
    if (!shop[0]) return res.status(403).json({ success: false, message: 'غير مصرح' });
    const allowed = ['name','description','address','city','phone'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.files?.logo?.[0]) updates.logo = `/uploads/shops/${req.files.logo[0].filename}`;
    await db.query('UPDATE shops SET ? WHERE owner_id = ?', [updates, req.user.id]);
    res.json({ success: true, message: 'تم تحديث المحل' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMyShop = async (req, res) => {
  try {
    const [shops] = await db.query('SELECT * FROM shops WHERE owner_id = ?', [req.user.id]);
    if (!shops[0]) return res.status(404).json({ success: false, message: 'لم يتم العثور على محل' });
    res.json({ success: true, data: shops[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.approveShop = async (req, res) => {
  try {
    await db.query('UPDATE shops SET is_approved = ? WHERE id = ?', [req.body.approve, req.params.id]);
    res.json({ success: true, message: req.body.approve ? 'تم اعتماد المحل' : 'تم رفض المحل' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ============== REVIEWS CONTROLLER ==============
exports.createReview = async (req, res) => {
  try {
    const { booking_id, rating, title, comment } = req.body;
    const [booking] = await db.query('SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = ?', [booking_id, req.user.id, 'completed']);
    if (!booking[0]) return res.status(400).json({ success: false, message: 'لا يمكن مراجعة هذا الحجز' });
    const [exists] = await db.query('SELECT id FROM reviews WHERE booking_id = ?', [booking_id]);
    if (exists[0]) return res.status(400).json({ success: false, message: 'قدمت مراجعة لهذا الحجز مسبقاً' });

    await db.query(
      'INSERT INTO reviews (booking_id,reviewer_id,rim_id,shop_id,rating,title,comment) VALUES (?,?,?,?,?,?,?)',
      [booking_id, req.user.id, booking[0].rim_id, booking[0].shop_id, rating, title||null, comment||null]
    );
    // Update shop rating
    const [[avg]] = await db.query('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE shop_id = ? AND is_approved = 1', [booking[0].shop_id]);
    await db.query('UPDATE shops SET rating = ?, total_reviews = ? WHERE id = ?', [avg.avg?.toFixed(2)||0, avg.cnt, booking[0].shop_id]);

    res.status(201).json({ success: true, message: 'تم إضافة تقييمك بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getRimReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT rv.*, u.full_name as reviewer_name, u.avatar as reviewer_avatar
       FROM reviews rv JOIN users u ON rv.reviewer_id = u.id
       WHERE rv.rim_id = ? AND rv.is_approved = 1 ORDER BY rv.created_at DESC`,
      [req.params.rim_id]
    );
    res.json({ success: true, data: reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ============== NOTIFICATIONS CONTROLLER ==============
exports.getNotifications = async (req, res) => {
  try {
    const [notifs] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    const [[{ unread }]] = await db.query('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ success: true, data: notifs, unread });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'تم تعليم الكل كمقروء' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ============== WISHLIST ==============
exports.toggleWishlist = async (req, res) => {
  try {
    const { rim_id } = req.body;
    const [exists] = await db.query('SELECT id FROM wishlist WHERE user_id = ? AND rim_id = ?', [req.user.id, rim_id]);
    if (exists[0]) {
      await db.query('DELETE FROM wishlist WHERE user_id = ? AND rim_id = ?', [req.user.id, rim_id]);
      return res.json({ success: true, saved: false, message: 'تم الإزالة من المفضلة' });
    }
    await db.query('INSERT INTO wishlist (user_id, rim_id) VALUES (?,?)', [req.user.id, rim_id]);
    res.json({ success: true, saved: true, message: 'تم الإضافة للمفضلة' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getWishlist = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT r.*, s.name as shop_name, s.city, (SELECT image_url FROM rim_images WHERE rim_id=r.id AND is_primary=1 LIMIT 1) as primary_image
       FROM wishlist w JOIN rims r ON w.rim_id = r.id JOIN shops s ON r.shop_id = s.id WHERE w.user_id = ?`,
      [req.user.id]
    );
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ============== ADMIN: ALL SHOPS ============
exports.getAllShopsAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    let where = '';
    if (status === 'pending') where = 'WHERE s.is_approved = 0';
    else if (status === 'approved') where = 'WHERE s.is_approved = 1';
    const [shops] = await db.query(
      `SELECT s.*, u.full_name as owner_name, u.email as owner_email FROM shops s JOIN users u ON s.owner_id = u.id ${where} ORDER BY s.created_at DESC`
    );
    res.json({ success: true, data: shops });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ============== ADMIN STATS ==============
exports.getAdminStats = async (req, res) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) as total FROM users');
    const [[shops]] = await db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_approved = 0 THEN 1 END) as pending FROM shops');
    const [[rims]] = await db.query('SELECT COUNT(*) as total FROM rims');
    const [[bookings]] = await db.query('SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM bookings WHERE status="completed"');
    res.json({ success: true, data: { users: users.total, shops: shops.total, pending_shops: shops.pending, rims: rims.total, completed_bookings: bookings.total, revenue: bookings.revenue || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
