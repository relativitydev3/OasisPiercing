const express = require('express');
const adminUserController = require('../controllers/adminUserController');
const adminCategoriaController = require('../controllers/adminCategoriaController');
const adminProductoController = require('../controllers/adminProductoController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateCsrf } = require('../middlewares/csrf');
const { uploadProductoImage } = require('../middlewares/uploadProducto');
const adminModules = require('../config/adminModules');

const router = express.Router();

router.use(authMiddleware, adminMiddleware, validateCsrf);
router.use((req, res, next) => {
  res.locals.adminModules = adminModules;
  next();
});

router.get('/', (req, res) => res.redirect('/admin/productos'));

router.get('/usuarios', adminUserController.list);
router.get('/usuarios/nuevo', adminUserController.showCreate);
router.post('/usuarios', adminUserController.create);
router.get('/usuarios/:id/editar', adminUserController.showEdit);
router.post('/usuarios/:id', adminUserController.update);
router.post('/usuarios/:id/estado', adminUserController.toggleActive);
router.post('/usuarios/:id/eliminar', adminUserController.remove);

router.get('/categorias', adminCategoriaController.list);
router.get('/categorias/nuevo', adminCategoriaController.showCreate);
router.post('/categorias', adminCategoriaController.create);
router.get('/categorias/:id/editar', adminCategoriaController.showEdit);
router.post('/categorias/:id', adminCategoriaController.update);
router.post('/categorias/:id/estado', adminCategoriaController.toggleActive);
router.post('/categorias/:id/eliminar', adminCategoriaController.remove);

router.get('/productos', adminProductoController.list);
router.get('/productos/nuevo', adminProductoController.showCreate);
router.post('/productos', uploadProductoImage, adminProductoController.create);
router.get('/productos/:id/editar', adminProductoController.showEdit);
router.post('/productos/:id', uploadProductoImage, adminProductoController.update);
router.post('/productos/:id/estado', adminProductoController.toggleActive);
router.post('/productos/:id/eliminar', adminProductoController.remove);

module.exports = router;
