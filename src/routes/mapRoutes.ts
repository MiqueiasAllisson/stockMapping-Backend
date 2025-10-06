const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/mapsController');



router.post('/created', mapsController.criarMapa);


router.get('/listar', mapsController.listarMapas);


module.exports = router;