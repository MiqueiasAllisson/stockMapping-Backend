# Stock Mapping - Back-end

API para mapeamento de estoque que conecta um **sistema legado em Firebird** a um novo sistema com banco de dados próprio, sem alterar o legado.

## Objetivo

Ler os dados do banco Firebird existente e sincronizá-los com uma base nova, que serve de apoio ao novo sistema. As migrations e o controle do banco novo são feitos com Knex.

## Tecnologias

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)
![Knex](https://img.shields.io/badge/Knex.js-D26B38?style=flat-square&logo=knexdotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Firebird](https://img.shields.io/badge/Firebird-F40F02?style=flat-square&logo=firebird&logoColor=white)

## Como rodar

```bash
npm install
npm run knex:migrate:latest
npm run dev
```

As variáveis de ambiente (conexão com o Firebird e porta da API) são lidas de um arquivo `.env` na raiz do projeto.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia a API em modo de desenvolvimento, com reload |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm run knex:migrate:latest` | Aplica as migrations do banco novo |
| `npm run knex:migrate:make` | Cria uma nova migration |

## Autor

**Miqueias Allisson** - [LinkedIn](https://www.linkedin.com/in/miqueias-allisson-a07a43212/) · [GitHub](https://github.com/MiqueiasAllisson)
