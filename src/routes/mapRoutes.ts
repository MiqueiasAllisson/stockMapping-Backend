const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/mapsController');



router.post('/created', mapsController.criarMapa);
router.get('/listar', mapsController.mapList);
// Rota para pesquisar mapas (pesquisa inteligente)
router.post('/pesquisar', mapsController.pesquisarMapa);

module.exports = router;