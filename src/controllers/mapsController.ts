const knex = require('../database/connection'); 

exports.criarMapa = async (req: any, res: any) => {
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
      return res.status(400).json({ error: 'Quantidade de corredores inválida. Deve ser um número inteiro positivo.' });
    }

    await knex.transaction(async (trx: any) => {
      const [mapa_id] = await knex('mapas')
        .insert({ nome: mapName })
        .transacting(trx); 

      const runners = [];
      for (let i = 0; i < numberRunners; i++) {
        runners.push({
          mapa_id: mapa_id,
          nome: `Corredor ${i + 1}`
        });
      }

      await knex('corredores').insert(runners).transacting(trx);

      await trx.commit();

      const runnersCreated = await knex('corredores').where('mapa_id', mapa_id);

      const mapa = {
        mapa_id: mapa_id,
        mapName: mapName, 
        numberRunners: numberRunners,
        runners: runnersCreated
      };

      res.status(201).json({ message: 'Mapa criado com sucesso!', mapa: mapa });
    });

  } catch (error) {
    console.error("Erro ao criar mapa:", error);
    res.status(500).json({ error: 'Erro ao criar mapa' });
  }
};

exports.mapList = async (req: any, res: any) => {
  try {

    const mapas = await knex('mapas').select('mapa_id', 'nome');

    const mapasComDetalhes = await Promise.all(
      mapas.map(async (mapa: any) => {

        const corredores = await knex('corredores')
          .select('corredor_id', 'nome')
          .where('mapa_id', mapa.mapa_id);


        const [{ total_prateleiras_ocupadas }] = await knex('prateleiras')
          .count('prateleira_id as total_prateleiras_ocupadas')
          .innerJoin('corredores', 'prateleiras.corredor_id', 'corredores.corredor_id')
          .where('corredores.mapa_id', mapa.mapa_id);

        return {
          ...mapa,
          total_prateleiras_ocupadas: total_prateleiras_ocupadas || 0, 
        };
      })
    );

    res.status(200).json(mapasComDetalhes);
  } catch (error) {
    console.error("Erro ao listar mapas:", error);
    res.status(500).json({ error: 'Erro ao listar mapas' });
  }
};

exports.pesquisarMapa = async (req: any, res: any) => {
  try {
    const { termo, filtros } = req.body;

    if (!termo || termo.trim() === '') {
      return res.status(400).json({ error: 'Termo de pesquisa é obrigatório.' });
    }

    const termoPesquisa = termo.trim();
    let query = knex('mapas').select('mapa_id', 'nome');

    if (!isNaN(termoPesquisa) && Number.isInteger(Number(termoPesquisa))) {
      query = query.where(function(this: any) {
        this.where('mapa_id', parseInt(termoPesquisa))
            .orWhere('nome', 'like', `%${termoPesquisa}%`);
      });
    } else {
      query = query.where('nome', 'like', `%${termoPesquisa}%`);
    }

    const mapas = await query;

    if (mapas.length === 0) {
      return res.status(404).json({ 
        message: 'Nenhum mapa encontrado para o termo pesquisado.',
        termo: termoPesquisa 
      });
    }
    const mapasComDetalhes = await Promise.all(
      mapas.map(async (mapa: any) => {
        const corredores = await knex('corredores')
          .select('corredor_id', 'nome')
          .where('mapa_id', mapa.mapa_id);

        const [{ total_prateleiras_ocupadas }] = await knex('prateleiras')
          .count('prateleira_id as total_prateleiras_ocupadas')
          .innerJoin('corredores', 'prateleiras.corredor_id', 'corredores.corredor_id')
          .where('corredores.mapa_id', mapa.mapa_id);

        return {
          ...mapa,
          total_corredores: corredores.length,
          total_prateleiras_ocupadas: total_prateleiras_ocupadas || 0,
          corredores: corredores
        };
      })
    );

    res.status(200).json({
      message: `${mapas.length} mapa(s) encontrado(s)`,
      termo: termoPesquisa,
      mapas: mapasComDetalhes
    });

  } catch (error) {
    console.error("Erro ao pesquisar mapa:", error);
    res.status(500).json({ error: 'Erro ao pesquisar mapa' });
  }
};



exports.deletarMapa = async (req: any, res: any) => {
  try {
    const { mapa_id } = req.params;

    if (!mapa_id || isNaN(parseInt(mapa_id))) {
      return res.status(400).json({ error: 'ID do mapa é obrigatório e deve ser um número válido.' });
    }

    const mapaId = parseInt(mapa_id);

    const mapaExistente = await knex('mapas').where('mapa_id', mapaId).first();
    if (!mapaExistente) {
      return res.status(404).json({ error: 'Mapa não encontrado.' });
    }

    await knex.transaction(async (trx: any) => {
  
      await knex('prateleiras')
        .whereIn('corredor_id', function(this: any) {
          this.select('corredor_id').from('corredores').where('mapa_id', mapaId);
        })
        .del()
        .transacting(trx);

      await knex('corredores')
        .where('mapa_id', mapaId)
        .del()
        .transacting(trx);

      await knex('mapas')
        .where('mapa_id', mapaId)
        .del()
        .transacting(trx);

      await trx.commit();
    });

    res.status(200).json({ 
      message: 'Mapa deletado com sucesso!',
      mapa_deletado: {
        mapa_id: mapaId,
        nome: mapaExistente.nome
      }
    });

  } catch (error) {
    console.error("Erro ao deletar mapa:", error);
    res.status(500).json({ error: 'Erro ao deletar mapa' });
  }

};