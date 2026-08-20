const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateCsrf } = require('../middlewares/csrf');
const accountPedidoController = require('../controllers/accountPedidoController');
const accountProfileController = require('../controllers/accountProfileController');

const router = express.Router();

router.get('/mis-pedidos', authMiddleware, accountPedidoController.list);
router.get('/mis-pedidos/:id', authMiddleware, accountPedidoController.show);
router.get('/mi-perfil', authMiddleware, accountProfileController.showEdit);
router.post('/mi-perfil', authMiddleware, validateCsrf, accountProfileController.update);

module.exports = router;
