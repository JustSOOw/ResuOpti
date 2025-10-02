/**
 * Sequelize实例初始化
 * 创建数据库连接
 */

const { Sequelize } = require('sequelize');
const config = require('./database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const baseOptions = {
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  pool: dbConfig.pool,
  dialectOptions: dbConfig.dialectOptions || {},
  benchmark: dbConfig.benchmark,
  retry: dbConfig.retry
};

if (dbConfig.host) {
  baseOptions.host = dbConfig.host;
}

if (dbConfig.port) {
  baseOptions.port = dbConfig.port;
}

if (dbConfig.storage) {
  baseOptions.storage = dbConfig.storage;
}

let sequelize;

if (dbConfig.url) {
  sequelize = new Sequelize(dbConfig.url, baseOptions);
} else if (dbConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    ...baseOptions
  });
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, baseOptions);
}

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize
};
