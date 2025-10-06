// knexfile.ts CORRIGIDO

// Usamos require para garantir a compatibilidade
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// 1. Primeiro, declaramos e inicializamos a constante 'config'
const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './src/database/database.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts'
    },
  },
};

// 2. DEPOIS de declarar, nós a exportamos no final do arquivo.
module.exports = config;