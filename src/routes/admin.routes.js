const express = require('express');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminUserController = require('../controllers/adminUserController');
const adminCategoriaController = require('../controllers/adminCategoriaController');
const adminProductoController = require('../controllers/adminProductoController');
const adminPedidoController = require('../controllers/adminPedidoController');
const adminVentaController = require('../controllers/adminVentaController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateCsrf } = require('../middlewares/csrf');
const { uploadProductoImage } = require('../middlewares/uploadProducto');
const { uploadProductoInpaint } = require('../middlewares/uploadProductoInpaint');
const { uploadProductoBulk } = require('../middlewares/uploadProductoBulk');
const adminModules = require('../config/adminModules');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.use((req, res, next) => {
  res.locals.adminModules = adminModules;
  next();
});

router.get('/', (req, res) => res.redirect('/admin/dashboard'));

router.get('/dashboard', adminDashboardController.index);
router.get('/dashboard/data', adminDashboardController.data);
router.get('/dashboard/ventas', adminDashboardController.ventas);
router.get('/dashboard/detail/:type', adminDashboardController.detail);

router.get('/usuarios', adminUserController.list);
router.get('/usuarios/nuevo', adminUserController.showCreate);
router.post('/usuarios', validateCsrf, adminUserController.create);
router.get('/usuarios/:id/editar', adminUserController.showEdit);
router.get('/usuarios/:id', adminUserController.show);
router.post('/usuarios/:id', validateCsrf, adminUserController.update);
router.post('/usuarios/:id/estado', validateCsrf, adminUserController.toggleActive);
router.post('/usuarios/:id/eliminar', validateCsrf, adminUserController.remove);

router.get('/categorias', adminCategoriaController.list);
router.get('/categorias/nuevo', adminCategoriaController.showCreate);
router.post('/categorias', validateCsrf, adminCategoriaController.create);
router.get('/categorias/:id/editar', adminCategoriaController.showEdit);
router.get('/categorias/:id', adminCategoriaController.show);
router.post('/categorias/:id', validateCsrf, adminCategoriaController.update);
router.post('/categorias/:id/estado', validateCsrf, adminCategoriaController.toggleActive);
router.post('/categorias/:id/eliminar', validateCsrf, adminCategoriaController.remove);

router.get('/productos', adminProductoController.list);
router.get('/productos/nuevo', adminProductoController.showCreate);
router.get('/productos/carga-masiva', adminProductoController.showBulkImport);
router.post('/productos/carga-masiva', uploadProductoBulk, validateCsrf, adminProductoController.bulkImport);
router.post('/productos/borrar-fondo', uploadProductoImage, validateCsrf, adminProductoController.removeBackground);
router.post('/productos/quitar-objeto', uploadProductoInpaint, validateCsrf, adminProductoController.removeObject);
router.post('/productos/mejorar-ia', uploadProductoImage, validateCsrf, adminProductoController.enhanceWithAi);
router.post('/productos', uploadProductoImage, validateCsrf, adminProductoController.create);
router.get('/productos/:id/imagen-editor', adminProductoController.serveEditorImage);
router.get('/productos/:id/editar', adminProductoController.showEdit);
router.get('/productos/:id', adminProductoController.show);
router.post('/productos/:id/duplicar', validateCsrf, adminProductoController.duplicate);
router.post('/productos/:id', uploadProductoImage, validateCsrf, adminProductoController.update);
router.post('/productos/:id/estado', validateCsrf, adminProductoController.toggleActive);
router.post('/productos/:id/eliminar', validateCsrf, adminProductoController.remove);

router.get('/pedidos', adminPedidoController.list);
router.get('/pedidos/nuevo', adminPedidoController.showCreate);
router.post('/pedidos', validateCsrf, adminPedidoController.create);
router.get('/pedidos/:id/editar', adminPedidoController.showEdit);
router.get('/pedidos/:id/pdf', adminPedidoController.downloadPdf);
router.get('/pedidos/:id', adminPedidoController.show);
router.post('/pedidos/:id/estado', validateCsrf, adminPedidoController.changeEstado);
router.post('/pedidos/:id', validateCsrf, adminPedidoController.update);
router.post('/pedidos/:id/eliminar', validateCsrf, adminPedidoController.remove);

router.get('/ventas', adminVentaController.list);
router.get('/ventas/:id', adminVentaController.show);

module.exports = router;
