const express = require('express');
const authController = require('../controllers/authController');
const guestMiddleware = require('../middlewares/guestMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateCsrf } = require('../middlewares/csrf');
const { authLimiter, registerLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.get('/login', guestMiddleware, authController.showLogin);
router.post('/login', guestMiddleware, authLimiter, validateCsrf, authController.login);
router.get('/registro', guestMiddleware, authController.showRegister);
router.post('/registro', guestMiddleware, registerLimiter, validateCsrf, authController.register);
router.post('/logout', authMiddleware, validateCsrf, authController.logout);

module.exports = router;
