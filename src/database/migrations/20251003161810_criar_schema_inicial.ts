import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {

  await knex.schema.createTable('mapas', (t) => { t.increments('mapa_id').primary(); t.string('nome', 100).notNullable(); });
  await knex.schema.createTable('corredores', (t) => { t.increments('corredor_id').primary(); t.integer('mapa_id').unsigned().notNullable().references('mapa_id').inTable('mapas').onDelete('CASCADE'); t.string('nome', 50).notNullable(); });
  await knex.schema.createTable('prateleiras', (t) => { t.increments('prateleira_id').primary(); t.integer('corredor_id').unsigned().notNullable().references('corredor_id').inTable('corredores').onDelete('CASCADE'); t.string('codigo', 50).notNullable(); t.integer('capacidade'); });
  await knex.schema.createTable('localizacoes', (t) => { t.increments('localizacao_id').primary(); t.integer('prateleira_id').unsigned().notNullable().references('prateleira_id').inTable('prateleiras').onDelete('CASCADE'); t.string('codigo_local', 50).notNullable().unique(); t.integer('etiqueta_id').nullable(); t.string('status', 20).defaultTo('VAZIO'); });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('localizacoes'); await knex.schema.dropTableIfExists('prateleiras'); await knex.schema.dropTableIfExists('corredores'); await knex.schema.dropTableIfExists('mapas');
}