const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const accountPedidoController = require('../controllers/accountPedidoController');

const router = express.Router();

router.get('/mis-pedidos', authMiddleware, accountPedidoController.list);
router.get('/mis-pedidos/:id', authMiddleware, accountPedidoController.show);

module.exports = router;
