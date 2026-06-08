const db = require('../config/db');

exports.getRims = async (req, res) => {
  try {
    const { search, size, category_id, min_price, max_price, city, sort = 'newest', page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    let where = ['r.is_available = 1', 's.is_approved = 1'];
    let params = [];

    if (search) { where.push('(r.name LIKE ? OR r.brand LIKE ? OR r.description LIKE ?)'); const s = `%${search}%`; params.push(s, s, s); }
    if (size) { where.push('r.size = ?'); params.push(size); }
    if (category_id) { where.push('r.category_id = ?'); params.push(category_id); }
    if (min_price) { where.push('r.price_per_day >= ?'); params.push(min_price); }
    if (max_price) { where.push('r.price_per_day <= ?'); params.push(max_price); }
    if (city) { where.push('s.city LIKE ?'); params.push(`%${city}%`); }

    const sortMap = { newest: 'r.created_at DESC', price_asc: 'r.price_per_day ASC', price_desc: 'r.price_per_day DESC', popular: 'r.views DESC' };
    const orderBy = sortMap[sort] || 'r.created_at DESC';

    const baseQuery = `FROM rims r JOIN shops s ON r.shop_id = s.id LEFT JOIN categories c ON r.category_id = c.id WHERE ${where.join(' AND ')}`;
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const [rims] = await db.query(
      `SELECT r.*, s.name as shop_name, s.city, s.logo as shop_logo, s.rating as shop_rating,
       c.name as category_name, c.name_ar as category_name_ar,
       (SELECT image_url FROM rim_images WHERE rim_id = r.id AND is_primary = 1 LIMIT 1) as primary_image
       ${baseQuery} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: rims, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRimById = async (req, res) => {
  try {
    const [rims] = await db.query(
      `SELECT r.*, s.name as shop_name, s.city, s.phone as shop_phone, s.logo as shop_logo,
       s.rating as shop_rating, s.total_reviews as shop_total_reviews, s.id as shop_id,
       c.name as category_name, c.name_ar as category_name_ar
       FROM rims r JOIN shops s ON r.shop_id = s.id LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!rims[0]) return res.status(404).json({ success: false, message: 'المصفة غير موجودة' });

    const [images] = await db.query('SELECT * FROM rim_images WHERE rim_id = ? ORDER BY is_primary DESC, display_order', [req.params.id]);
    const [reviews] = await db.query(
      `SELECT rv.*, u.full_name as reviewer_name, u.avatar as reviewer_avatar
       FROM reviews rv JOIN users u ON rv.reviewer_id = u.id
       WHERE rv.rim_id = ? AND rv.is_approved = 1 ORDER BY rv.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    await db.query('UPDATE rims SET views = views + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { ...rims[0], images, reviews } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createRim = async (req, res) => {
  try {
    const { shop_id, category_id, name, description, brand, size, bolt_pattern, width, material, color, price_per_day, price_per_week, price_per_month, quantity, condition_rating, has_cameras, has_security, has_delivery, has_insurance } = req.body;
    if (!shop_id || !name || !price_per_day) return res.status(400).json({ success: false, message: 'shop_id والاسم والسعر مطلوبة' });

    const [shopCheck] = await db.query('SELECT owner_id FROM shops WHERE id = ?', [shop_id]);
    if (!shopCheck[0] || shopCheck[0].owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية على هذا المحل' });
    }

    const [result] = await db.query(
      'INSERT INTO rims (shop_id,category_id,name,description,brand,size,bolt_pattern,width,material,color,price_per_day,price_per_week,price_per_month,quantity,available_quantity,condition_rating,has_cameras,has_security,has_delivery,has_insurance) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [shop_id, category_id||null, name, description||null, brand||null, size||null, bolt_pattern||null, width||null, material||'alloy', color||null, price_per_day, price_per_week||null, price_per_month||null, quantity||1, quantity||1, condition_rating||'like_new', has_cameras?1:0, has_security?1:0, has_delivery?1:0, has_insurance?1:0]
    );

    if (req.files?.length > 0) {
      const imageValues = req.files.map((f, i) => [result.insertId, `/uploads/rims/${f.filename}`, i === 0]);
      await db.query('INSERT INTO rim_images (rim_id, image_url, is_primary) VALUES ?', [imageValues]);
    }

    res.status(201).json({ success: true, message: 'تم إضافة المصفة بنجاح', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRim = async (req, res) => {
  try {
    const [rim] = await db.query('SELECT r.id FROM rims r JOIN shops s ON r.shop_id = s.id WHERE r.id = ? AND s.owner_id = ?', [req.params.id, req.user.id]);
    if (!rim[0] && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'غير مصرح' });

    const allowed = ['name','description','brand','size','bolt_pattern','width','material','color','price_per_day','price_per_week','price_per_month','quantity','condition_rating','is_available','has_cameras','has_security','has_delivery','has_insurance'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await db.query('UPDATE rims SET ? WHERE id = ?', [updates, req.params.id]);
    res.json({ success: true, message: 'تم تحديث المصفة' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteRim = async (req, res) => {
  try {
    const [rim] = await db.query('SELECT r.id FROM rims r JOIN shops s ON r.shop_id = s.id WHERE r.id = ? AND s.owner_id = ?', [req.params.id, req.user.id]);
    if (!rim[0] && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'غير مصرح' });
    await db.query('DELETE FROM rims WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف المصفة' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyShopRims = async (req, res) => {
  try {
    const [shop] = await db.query('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
    if (!shop[0]) return res.status(404).json({ success: false, message: 'لم يتم العثور على محل' });

    const [rims] = await db.query(
      `SELECT r.*, (SELECT image_url FROM rim_images WHERE rim_id = r.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM rims r WHERE r.shop_id = ? ORDER BY r.created_at DESC`,
      [shop[0].id]
    );
    res.json({ success: true, data: rims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const [cats] = await db.query('SELECT * FROM categories');
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
