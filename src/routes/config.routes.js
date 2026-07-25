const express = require('express');
const configController = require('../controllers/configController');

const router = express.Router();

router.get('/js/oasis-config.js', configController.getClientConfig);

module.exports = router;
