const knex = require('../database/connection'); // Importe a instância Knex

exports.criarMapa = async (req: any, res: any) => {
  try {
    const quantidadeCorredores = parseInt(req.body.quantidadeCorredores);
    const nomeMapa = req.body.nomeMapa;

    if (!nomeMapa || nomeMapa.trim() === '') {
      return res.status(400).json({ error: 'Nome do mapa é obrigatório.' });
    }

    const mapaExistente = await knex('mapas').where('nome', nomeMapa).first();
    if (mapaExistente) {
      return res.status(409).json({ error: 'Já existe um mapa com este nome.' });
    }

    if (isNaN(quantidadeCorredores) || quantidadeCorredores <= 0) {
      return res.status(400).json({ error: 'Quantidade de corredores inválida. Deve ser um número inteiro positivo.' });
    }

    await knex.transaction(async (trx: any) => {
      const [mapa_id] = await knex('mapas')
        .insert({ nome: nomeMapa })
        .transacting(trx); 

      const corredores = [];
      for (let i = 0; i < quantidadeCorredores; i++) {
        corredores.push({
          mapa_id: mapa_id,
          nome: `Corredor ${i + 1}`
        });
      }

      await knex('corredores').insert(corredores).transacting(trx);

      await trx.commit();

      const corredoresCriados = await knex('corredores').where('mapa_id', mapa_id);

      const mapa = {
        mapa_id: mapa_id,
        nomeMapa: nomeMapa, 
        quantidadeCorredores: quantidadeCorredores,
        corredores: corredoresCriados
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