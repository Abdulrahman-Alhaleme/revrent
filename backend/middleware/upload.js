const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط صور JPG, PNG, WEBP مسموح بها'));
  }
};

const uploadRimImages = multer({ storage: createStorage('rims'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadAvatar = multer({ storage: createStorage('avatars'), fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadShopImages = multer({ storage: createStorage('shops'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { uploadRimImages, uploadAvatar, uploadShopImages };
