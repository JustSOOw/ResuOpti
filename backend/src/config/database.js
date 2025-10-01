/**
 * Sequelize数据库配置
 * 支持开发、测试、生产环境
 * 优化了连接池配置以提升性能
 */

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

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'resumopti_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    // 开发环境：使用慢查询日志
    logging: slowQueryLogger,
    // 启用查询性能基准测试
    benchmark: true,
    // 优化后的连接池配置
    pool: {
      max: 10, // 最大连接数：从5增加到10（开发环境支持更多并发请求）
      min: 2, // 最小连接数：保持2个热连接
      acquire: 30000, // 获取连接超时时间：30秒
      idle: 10000, // 连接空闲时间：10秒后释放
      evict: 5000 // 检查和移除空闲连接的频率：5秒
    },
    // 启用查询重试
    retry: {
      max: 3, // 最大重试次数
      match: [
        // 只重试这些错误
        /ETIMEDOUT/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EHOSTUNREACH/
      ]
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME_TEST || 'resumopti_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    // 生产环境：优化连接池配置以支持更高并发
    pool: {
      max: 20, // 最大连接数：根据生产负载增加到20
      min: 5, // 最小连接数：保持5个热连接
      acquire: 30000, // 获取连接超时时间：30秒
      idle: 10000, // 连接空闲时间：10秒后释放
      evict: 5000 // 检查和移除空闲连接的频率：5秒
    },
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false
            }
          : false,
      // 设置语句超时（30秒）
      statement_timeout: 30000,
      // 空闲事务超时（10秒）
      idle_in_transaction_session_timeout: 10000
    },
    // 启用查询重试
    retry: {
      max: 3,
      match: [/ETIMEDOUT/, /ECONNRESET/, /ECONNREFUSED/, /EHOSTUNREACH/]
    }
  }
};
