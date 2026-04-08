const fs = require('fs');
const mysql = require('mysql2/promise');

require('./loadEnv').loadEnv();

function parseMysqlUrl(url) {
  const u = (url || '').trim();
  if (!u.startsWith('mysql://')) return null;
  try {
    const parsed = new URL(u);
    const database = parsed.pathname.replace(/^\//, '').split('?')[0];
    const decode = (s) => (s ? decodeURIComponent(s) : '');
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decode(parsed.username),
      password: decode(parsed.password),
      database
    };
  } catch {
    return null;
  }
}

function buildSslOption() {
  const pem = (process.env.MYSQL_SSL_CA_PEM || '').trim();
  if (pem.includes('BEGIN CERTIFICATE')) {
    return {
      ca: pem,
      rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== '0'
    };
  }
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
  const host = (
    process.env.DB_HOST ||
    process.env.MYSQL_HOST ||
    ''
  ).toLowerCase();
  if (host.includes('skysql.com')) {
    return { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== '0' };
  }
  return undefined;
}

function getMysqlConnectionOptions() {
  const fromUrl =
    parseMysqlUrl(process.env.DATABASE_URL) ||
    parseMysqlUrl(process.env.DB_URL) ||
    parseMysqlUrl(process.env.MYSQL_URL);

  const base = fromUrl || {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10),
    user: process.env.DB_USER || process.env.MYSQL_USER,
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE
  };

  const ssl = buildSslOption();
  if (ssl) {
    base.ssl = ssl;
  }

  return base;
}

function hasDatabaseConfig() {
  const o = getMysqlConnectionOptions();
  return Boolean(o.user && o.database && o.host);
}

function wrapMysqlStyleResult(rows) {
  if (rows && typeof rows === 'object' && !Array.isArray(rows) && 'affectedRows' in rows) {
    return [{ insertId: rows.insertId, affectedRows: rows.affectedRows }];
  }
  return [rows];
}

const connOpts = getMysqlConnectionOptions();
const pool = mysql.createPool({
  ...connOpts,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function query(text, params = []) {
  const [rows] = await pool.query(text, params || []);
  return wrapMysqlStyleResult(rows);
}

async function getConnection() {
  const conn = await pool.getConnection();
  return {
    async beginTransaction() {
      await conn.beginTransaction();
    },
    async commit() {
      await conn.commit();
    },
    async rollback() {
      await conn.rollback();
    },
    release() {
      conn.release();
    },
    async query(text, params = []) {
      const [rows] = await conn.query(text, params || []);
      return wrapMysqlStyleResult(rows);
    }
  };
}

module.exports = {
  query,
  getConnection,
  pool,
  hasDatabaseConfig,
  getMysqlConnectionOptions
};
