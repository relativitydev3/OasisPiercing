const express = require('express');
const catalogController = require('../controllers/catalogController');

const router = express.Router();

router.get('/catalog', catalogController.getCatalog);

module.exports = router;
