const knex = require('../database/connection'); // Importe a instância Knex

exports.criarMapa = async (req, res) => {
  try {
    // 1. Obter a quantidade de corredores e o nome do mapa do corpo da requisição
    const quantidadeCorredores = parseInt(req.body.quantidadeCorredores);
    const nomeMapa = req.body.nomeMapa; // Obter o nome do mapa do corpo da requisição

    if (!nomeMapa || nomeMapa.trim() === '') {
      return res.status(400).json({ error: 'Nome do mapa é obrigatório.' });
    }

    if (isNaN(quantidadeCorredores) || quantidadeCorredores <= 0) {
      return res.status(400).json({ error: 'Quantidade de corredores inválida. Deve ser um número inteiro positivo.' });
    }

    // Iniciar uma transação para garantir a consistência dos dados
    await knex.transaction(async (trx) => {
      // 2. Criar o mapa no banco de dados
      const [mapa_id] = await knex('mapas')
        .insert({ nome: nomeMapa }) // Usar o nome do mapa do corpo da requisição
        .transacting(trx); // Garante que a inserção seja parte da transação

      // 3. Gerar e criar os corredores no banco de dados
      const corredores = [];
      for (let i = 0; i < quantidadeCorredores; i++) {
        corredores.push({
          mapa_id: mapa_id,
          nome: `Corredor ${i + 1}`
        });
      }

      // Insere múltiplos corredores de uma vez
      await knex('corredores').insert(corredores).transacting(trx);

      // Commit da transação
      await trx.commit();

      // Busca os corredores criados para retornar na resposta
      const corredoresCriados = await knex('corredores').where('mapa_id', mapa_id);

      // 4. Retornar os dados do mapa criado
      const mapa = {
        mapa_id: mapa_id,
        nomeMapa: nomeMapa, // Incluir o nome do mapa na resposta
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

exports.listarMapas = async (req, res) => {
  try {
    // 1. Buscar todos os mapas
    const mapas = await knex('mapas').select('mapa_id', 'nome');

    // 2. Para cada mapa, buscar os corredores e a quantidade de prateleiras ocupadas
    const mapasComDetalhes = await Promise.all(
      mapas.map(async (mapa) => {
        // Buscar os corredores do mapa
        const corredores = await knex('corredores')
          .select('corredor_id', 'nome')
          .where('mapa_id', mapa.mapa_id);

        // Buscar a quantidade total de prateleiras ocupadas no mapa
        const [{ total_prateleiras_ocupadas }] = await knex('prateleiras')
          .count('prateleira_id as total_prateleiras_ocupadas')
          .innerJoin('corredores', 'prateleiras.corredor_id', 'corredores.corredor_id')
          .where('corredores.mapa_id', mapa.mapa_id);

        return {
          ...mapa,
          total_prateleiras_ocupadas: total_prateleiras_ocupadas || 0, // Garante que seja 0 se não houver prateleiras
        };
      })
    );

    // 3. Retornar a lista de mapas com os detalhes
    res.status(200).json(mapasComDetalhes);
  } catch (error) {
    console.error("Erro ao listar mapas:", error);
    res.status(500).json({ error: 'Erro ao listar mapas' });
  }
};