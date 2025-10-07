
const fb = require('node-firebird');
require('dotenv').config();

const config = {
    host: process.env.FB_HOST,
    port: parseInt(process.env.FB_PORT || '3050'),
    database: process.env.FB_DATABASE,
    user: process.env.FB_USER,
    password: process.env.FB_PASSWORD,
};

let pool = fb.pool(5, config);

module.exports = pool;
