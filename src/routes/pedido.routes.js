const express = require('express');
const storefrontPedidoController = require('../controllers/storefrontPedidoController');
const { validateCsrf } = require('../middlewares/csrf');
const { orderLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.post('/pedidos', orderLimiter, validateCsrf, storefrontPedidoController.create);

module.exports = router;
