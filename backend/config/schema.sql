-- ============================================
-- RevRent Database Schema
-- تأجير مصفات السيارات
-- ============================================

CREATE DATABASE IF NOT EXISTS revrent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE revrent_db;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user', 'shop_owner', 'admin') DEFAULT 'user',
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- SHOPS TABLE (محلات التأجير)
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  city VARCHAR(100),
  phone VARCHAR(20),
  logo VARCHAR(255),
  cover_image VARCHAR(255),
  is_approved BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- RIM CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, name_ar, icon) VALUES
  ('Sport', 'رياضي', 'bolt'),
  ('Classic', 'كلاسيك', 'star'),
  ('Off-Road', 'رحلات', 'mountain'),
  ('Luxury', 'فاخر', 'diamond'),
  ('Custom', 'مخصص', 'settings');

-- ============================================
-- RIMS TABLE (المصفات)
-- ============================================
CREATE TABLE IF NOT EXISTS rims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  category_id INT,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  size VARCHAR(20) COMMENT 'e.g. 17", 18", 20"',
  bolt_pattern VARCHAR(30) COMMENT 'e.g. 5x114.3',
  width VARCHAR(20),
  material ENUM('alloy', 'steel', 'forged_aluminum', 'carbon') DEFAULT 'alloy',
  color VARCHAR(50),
  price_per_day DECIMAL(10,2) NOT NULL,
  price_per_week DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  quantity INT DEFAULT 1,
  available_quantity INT DEFAULT 1,
  condition_rating ENUM('new', 'like_new', 'good', 'fair') DEFAULT 'like_new',
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON SET NULL
);

-- ============================================
-- RIM IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS rim_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rim_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rim_id) REFERENCES rims(id) ON DELETE CASCADE
);

-- ============================================
-- BOOKINGS TABLE (الحجوزات)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  rim_id INT NOT NULL,
  shop_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected') DEFAULT 'pending',
  notes TEXT,
  cancellation_reason TEXT,
  pickup_address VARCHAR(255),
  delivery_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (rim_id) REFERENCES rims(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- ============================================
-- PAYMENTS TABLE (المدفوعات)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'JOD',
  payment_method ENUM('credit_card', 'debit_card', 'cash', 'bank_transfer') NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  payment_date TIMESTAMP,
  refund_date TIMESTAMP,
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- REVIEWS TABLE (التقييمات)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  rim_id INT NOT NULL,
  shop_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  comment TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (rim_id) REFERENCES rims(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- ============================================
-- NOTIFICATIONS TABLE (الإشعارات)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('booking_created', 'booking_confirmed', 'booking_rejected', 'booking_completed', 'payment_received', 'review_received', 'system') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rim_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wishlist (user_id, rim_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rim_id) REFERENCES rims(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_rims_shop ON rims(shop_id);
CREATE INDEX idx_rims_available ON rims(is_available);
CREATE INDEX idx_rims_size ON rims(size);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ============================================
-- SEED: Default Admin User
-- Password: admin123 (bcrypt hashed)
-- ============================================
INSERT INTO users (full_name, email, password, role, is_verified) VALUES
('Admin RevRent', 'admin@revrent.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lzvK', 'admin', TRUE);
