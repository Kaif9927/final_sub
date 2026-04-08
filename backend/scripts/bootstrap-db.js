/**
 * Creates DB_NAME if missing and runs database/init_mysql.sql.
 * Usage:  cd backend && node scripts/bootstrap-db.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require(path.join(__dirname, '../config/loadEnv')).loadEnv();

function sslFromEnv() {
  const caPath = (process.env.MYSQL_SSL_CA || '').trim();
  if (caPath && fs.existsSync(caPath)) {
    return {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== '0'
    };
  }
  if (process.env.MYSQL_SSL === '1' || process.env.DB_SSL === '1') {
    return { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== '0' };
  }
  const host = (process.env.DB_HOST || '').toLowerCase();
  if (host.includes('skysql.com')) {
    return { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== '0' };
  }
  return undefined;
}

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE;

  if (!user || !password || !dbName) {
    console.error('Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in backend/.env');
    process.exit(1);
  }

  const ssl = sslFromEnv();
  const base = { host, port, user, password, multipleStatements: true };
  if (ssl) {
    base.ssl = ssl;
  }

  console.log('Connecting to', host + ':' + port, '...');
  const conn = await mysql.createConnection(base);

  const safeName = dbName.replace(/`/g, '');
  await conn.query(
    'CREATE DATABASE IF NOT EXISTS `' +
      safeName +
      '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  );
  await conn.query('USE `' + safeName + '`');

  const sqlPath = path.join(__dirname, '..', '..', 'database', 'init_mysql.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await conn.query(sql);
  await conn.end();
  console.log('OK: database `' + safeName + '` is ready (schema + seed applied).');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
