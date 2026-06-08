const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const rim = require('../controllers/rimController');
const booking = require('../controllers/bookingController');
const shop = require('../controllers/shopController');
const { protect, authorize } = require('../middleware/auth');
const { uploadRimImages, uploadAvatar, uploadShopImages } = require('../middleware/upload');

// AUTH
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.getMe);
router.put('/auth/profile', protect, uploadAvatar.single('avatar'), auth.updateProfile);
router.put('/auth/password', protect, auth.changePassword);

// RIMS
router.get('/rims', rim.getRims);
router.get('/rims/categories', rim.getCategories);
router.get('/rims/my-shop', protect, authorize('shop_owner'), rim.getMyShopRims);
router.get('/rims/:id', rim.getRimById);
router.post('/rims', protect, authorize('shop_owner'), uploadRimImages.array('images', 6), rim.createRim);
router.put('/rims/:id', protect, authorize('shop_owner', 'admin'), rim.updateRim);
router.delete('/rims/:id', protect, authorize('shop_owner', 'admin'), rim.deleteRim);

// SHOPS
router.get('/shops', shop.getShops);
router.get('/shops/my', protect, authorize('shop_owner'), shop.getMyShop);
router.get('/shops/:id', shop.getShopById);
router.post('/shops', protect, authorize('shop_owner'), uploadShopImages.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), shop.createShop);
router.put('/shops', protect, authorize('shop_owner'), uploadShopImages.fields([{ name: 'logo', maxCount: 1 }]), shop.updateShop);
router.put('/shops/:id/approve', protect, authorize('admin'), shop.approveShop);

// BOOKINGS
router.post('/bookings', protect, authorize('user', 'shop_owner', 'admin'), booking.createBooking);
router.get('/bookings/my', protect, booking.getMyBookings);
router.get('/bookings/shop', protect, authorize('shop_owner'), booking.getShopBookings);
router.put('/bookings/:id/status', protect, booking.updateBookingStatus);

// REVIEWS
router.post('/reviews', protect, authorize('user'), shop.createReview);
router.get('/reviews/rim/:rim_id', shop.getRimReviews);

// NOTIFICATIONS
router.get('/notifications', protect, shop.getNotifications);
router.put('/notifications/read-all', protect, shop.markRead);

// WISHLIST
router.post('/wishlist', protect, authorize('user'), shop.toggleWishlist);
router.get('/wishlist', protect, authorize('user'), shop.getWishlist);

// ADMIN
router.get('/admin/stats', protect, authorize('admin'), shop.getAdminStats);
router.get('/admin/shops', protect, authorize('admin'), shop.getAllShopsAdmin);

module.exports = router;
