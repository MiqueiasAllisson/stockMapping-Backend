const knex = require('../database/connection'); 

exports.createMap = async (req: any, res: any) => {
  try {
    const numberRunners = parseInt(req.body.numberRunners);
    const mapName = req.body.mapName;

    if (!mapName || mapName.trim() === '') {
      return res.status(400).json({ error: 'Nome do mapa é obrigatório.' });
    }

    const existingMap = await knex('mapas').where('nome', mapName).first();
    if (existingMap) {
      return res.status(400).json({ error: 'Já existe um mapa com este nome.' });
    }

    if (isNaN(numberRunners) || numberRunners <= 0) {
      return res.status(400).json({ error: 'Número de corredores inválido. Deve ser um número inteiro positivo.' });
    }

    await knex.transaction(async (trx: any) => {
      const [mapId] = await knex('mapas')
        .insert({ nome: mapName })
        .transacting(trx); 

      const runners = [];
      for (let i = 0; i < numberRunners; i++) {
        runners.push({
          mapa_id: mapId,
          nome: `Corredor ${i + 1}`
        });
      }

      await knex('corredores').insert(runners).transacting(trx);

      await trx.commit();

      const runnersCreated = await knex('corredores').where('mapa_id', mapId);

      const map = {
        mapId: mapId,
        mapName: mapName, 
        numberRunners: numberRunners,
        runners: runnersCreated
      };

      res.status(201).json({ message: 'Mapa criado com sucesso!', map: map });
    });

  } catch (error) {
    console.error("Erro ao criar mapa:", error);
    res.status(500).json({ error: 'Erro ao criar mapa' });
  }
};

exports.mapList = async (req: any, res: any) => {
  try {
    const maps = await knex('mapas').select('mapa_id', 'nome');

    const mapsWithDetails = await Promise.all(
      maps.map(async (map: any) => {
        const runners = await knex('corredores')
          .select('corredor_id', 'nome')
          .where('mapa_id', map.mapa_id);

        const [{ totalOccupiedShelves }] = await knex('prateleiras')
          .count('prateleira_id as totalOccupiedShelves')
          .innerJoin('corredores', 'prateleiras.corredor_id', 'corredores.corredor_id')
          .where('corredores.mapa_id', map.mapa_id);

        return {
          ...map,
          totalOccupiedShelves: totalOccupiedShelves || 0, 
        };
      })
    );

    res.status(200).json(mapsWithDetails);
  } catch (error) {
    console.error("Erro ao listar mapas:", error);
    res.status(500).json({ error: 'Erro ao listar mapas' });
  }
};

exports.searchMap = async (req: any, res: any) => {
  try {
    const { term, filters } = req.body;

    if (!term || term.trim() === '') {
      return res.status(400).json({ error: 'Termo de pesquisa é obrigatório.' });
    }

    const searchTerm = term.trim();
    let query = knex('mapas').select('mapa_id', 'nome');

    if (!isNaN(searchTerm) && Number.isInteger(Number(searchTerm))) {
      query = query.where(function(this: any) {
        this.where('mapa_id', parseInt(searchTerm))
            .orWhere('nome', 'like', `%${searchTerm}%`);
      });
    } else {
      query = query.where('nome', 'like', `%${searchTerm}%`);
    }

    const maps = await query;

    if (maps.length === 0) {
      return res.status(404).json({ 
        message: 'Nenhum mapa encontrado para o termo pesquisado.',
        term: searchTerm
      });
    }

    const mapsWithDetails = await Promise.all(
      maps.map(async (map: any) => {
        const runners = await knex('corredores')
          .select('corredor_id', 'nome')
          .where('mapa_id', map.mapa_id);

        const [{ totalOccupiedShelves }] = await knex('prateleiras')
          .count('prateleira_id as totalOccupiedShelves')
          .innerJoin('corredores', 'prateleiras.corredor_id', 'corredores.corredor_id')
          .where('corredores.mapa_id', map.mapa_id);

        return {
          ...map,
          totalRunners: runners.length,
          totalOccupiedShelves: totalOccupiedShelves || 0,
          runners: runners
        };
      })
    );

    res.status(200).json({
      message: `${maps.length} mapa(s) encontrado(s)`,
      term: searchTerm,
      maps: mapsWithDetails
    });

  } catch (error) {
    console.error("Erro ao pesquisar mapa:", error);
    res.status(500).json({ error: 'Erro ao pesquisar mapa' });
  }
};

exports.deleteMap = async (req: any, res: any) => {
  try {
    const { mapId } = req.params;

    if (!mapId || isNaN(parseInt(mapId))) {
      return res.status(400).json({ error: 'ID do mapa é obrigatório e deve ser um número válido.' });
    }

    const mapIdNumber = parseInt(mapId);

    const existingMap = await knex('mapas').where('mapa_id', mapIdNumber).first();
    if (!existingMap) {
      return res.status(404).json({ error: 'Mapa não encontrado.' });
    }

    await knex.transaction(async (trx: any) => {
      await knex('prateleiras')
        .whereIn('corredor_id', function(this: any) {
          this.select('corredor_id').from('corredores').where('mapa_id', mapIdNumber);
        })
        .del()
        .transacting(trx);

      await knex('corredores')
        .where('mapa_id', mapIdNumber)
        .del()
        .transacting(trx);

      await knex('mapas')
        .where('mapa_id', mapIdNumber)
        .del()
        .transacting(trx);

      await trx.commit();
    });

    res.status(200).json({ 
      message: 'Mapa deletado com sucesso!',
      deletedMap: {
        mapId: mapIdNumber,
        name: existingMap.nome
      }
    });

  } catch (error) {
    console.error("Erro ao deletar mapa:", error);
    res.status(500).json({ error: 'Erro ao deletar mapa' });
  }
};