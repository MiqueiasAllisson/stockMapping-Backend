const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/mapsController');



router.post('/created', mapsController.criarMapa);
router.get('/listar', mapsController.mapList);
router.get('/pesquisar', mapsController.pesquisarMapa);
router.delete('/deletar/:mapa_id', mapsController.deletarMapa);

module.exports = router;