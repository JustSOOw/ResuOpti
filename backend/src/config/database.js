/**
 * Sequelize数据库配置
 * 支持开发、测试、生产环境
 * 优化了连接池配置以提升性能
 */

const path = require('path');
require('dotenv').config();

/**
 * 自定义慢查询日志函数
 * 开发环境下记录执行时间超过阈值的SQL查询
 */
function slowQueryLogger(sql, timing) {
  const threshold = 100; // 慢查询阈值：100ms
  if (timing && timing >= threshold) {
    console.warn(`[慢查询 ${timing}ms]`, sql);
  } else if (process.env.LOG_ALL_QUERIES === 'true') {
    console.log(`[查询 ${timing || '?'}ms]`, sql);
  }
}

const DIALECT = (process.env.DB_DIALECT || 'postgres').toLowerCase();
const isSqlite = DIALECT === 'sqlite';

/**
 * 获取SQLite存储路径
 * 测试环境默认使用独立文件，防止数据污染
 */
const resolveSqliteStorage = env => {
  if (process.env.DB_STORAGE) {
    return process.env.DB_STORAGE;
  }

  const filename = env === 'test' ? 'resumopti.test.sqlite' : 'resumopti.sqlite';
  return path.join(__dirname, '../../', filename);
};

/**
 * 构建PostgreSQL配置
 */
const buildPostgresConfig = env => {
  const base = {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: env === 'test' ? process.env.DB_NAME_TEST || 'resumopti_test' : process.env.DB_NAME || 'resumopti_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres'
  };

  if (env === 'development') {
    return {
      ...base,
      logging: slowQueryLogger,
      benchmark: true,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 5000
      },
      retry: {
        max: 3,
        match: [/ETIMEDOUT/, /ECONNRESET/, /ECONNREFUSED/, /EHOSTUNREACH/]
      }
    };
  }

  if (env === 'production') {
    return {
      ...base,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      logging: false,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
        evict: 5000
      },
      dialectOptions: {
        ssl:
          process.env.DB_SSL === 'true'
            ? {
                require: true,
                rejectUnauthorized: false
              }
            : false,
        statement_timeout: 30000,
        idle_in_transaction_session_timeout: 10000
      },
      retry: {
        max: 3,
        match: [/ETIMEDOUT/, /ECONNRESET/, /ECONNREFUSED/, /EHOSTUNREACH/]
      }
    };
  }

  return {
    ...base,
    logging: false
  };
};

/**
 * 构建SQLite配置
 */
const buildSqliteConfig = env => ({
  dialect: 'sqlite',
  storage: resolveSqliteStorage(env),
  logging: env === 'development' && process.env.LOG_ALL_QUERIES !== 'false' ? slowQueryLogger : false,
  benchmark: env === 'development'
});

module.exports = {
  development: isSqlite ? buildSqliteConfig('development') : buildPostgresConfig('development'),
  test: isSqlite ? buildSqliteConfig('test') : buildPostgresConfig('test'),
  production: isSqlite ? buildSqliteConfig('production') : buildPostgresConfig('production')
};
