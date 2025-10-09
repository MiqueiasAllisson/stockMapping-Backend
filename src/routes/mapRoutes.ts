const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/mapsController');

router.post('/create', mapsController.createMap);
router.get('/list', mapsController.mapList);
router.post('/search', mapsController.searchMap);
router.delete('/:mapId', mapsController.deleteMap);

module.exports = router;