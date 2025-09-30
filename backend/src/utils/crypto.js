/**
 * 加密工具模块
 * 提供密码哈希、JWT token管理、随机字符串生成等加密相关功能
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 加密配置常量
const SALT_ROUNDS = 10; // bcrypt加密轮次
const JWT_SECRET = process.env.JWT_SECRET || 'resuopti-default-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ==================== 密码相关功能 ====================

/**
 * 密码哈希
 * 使用bcrypt对明文密码进行加密
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 加密后的密码哈希值
 * @throws {Error} 密码加密失败
 */
async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error('密码加密失败');
  }
}

/**
 * 密码比对
 * 验证明文密码与哈希值是否匹配
 * @param {string} password - 明文密码
 * @param {string} hash - 密码哈希值
 * @returns {Promise<boolean>} 密码是否匹配
 * @throws {Error} 密码比对失败
 */
async function comparePassword(password, hash) {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new Error('密码比对失败');
  }
}

// ==================== JWT Token相关功能 ====================

/**
 * 生成JWT token
 * 创建包含自定义payload的JWT token
 * @param {Object} payload - token载荷数据（如用户ID、邮箱等）
 * @param {string|number} expiresIn - token有效期（可选），默认使用环境变量配置
 *                                    可以是字符串（如'24h'、'7d'）或秒数
 * @returns {string} JWT token字符串
 * @throws {Error} Token生成失败
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: expiresIn
    });
    return token;
  } catch (error) {
    throw new Error('Token生成失败');
  }
}

/**
 * 验证JWT token
 * 检查token的有效性并解码payload
 * @param {string} token - JWT token字符串
 * @returns {Object} 解码后的token payload
 * @throws {Error} token无效、已过期或验证失败
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token无效');
    } else {
      throw new Error('Token验证失败');
    }
  }
}

// ==================== 随机字符串生成功能 ====================

/**
 * 生成随机字符串
 * 使用crypto模块生成指定长度的随机十六进制字符串
 * @param {number} length - 所需字符串长度（默认32）
 * @returns {string} 随机十六进制字符串
 * @throws {Error} 生成失败
 */
function generateRandomString(length = 32) {
  try {
    // 生成指定字节数的随机数据，转换为十六进制字符串
    // 每个字节转换为2个十六进制字符，所以字节数为length/2
    const bytes = Math.ceil(length / 2);
    const randomString = crypto.randomBytes(bytes).toString('hex').slice(0, length);
    return randomString;
  } catch (error) {
    throw new Error('随机字符串生成失败');
  }
}

/**
 * 生成UUID (v4)
 * 使用crypto模块生成标准的UUID v4字符串
 * @returns {string} UUID字符串（格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx）
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * 生成随机数字字符串
 * 用于生成验证码等场景
 * @param {number} length - 所需字符串长度（默认6位）
 * @returns {string} 随机数字字符串
 */
function generateRandomDigits(length = 6) {
  try {
    let digits = '';
    for (let i = 0; i < length; i++) {
      // 生成0-9的随机数字
      digits += Math.floor(Math.random() * 10);
    }
    return digits;
  } catch (error) {
    throw new Error('随机数字生成失败');
  }
}

// ==================== 数据加密/解密功能（可选） ====================

/**
 * AES-256-GCM 加密
 * 对敏感数据进行对称加密
 * @param {string} data - 待加密的数据
 * @param {string} key - 加密密钥（可选），默认使用JWT_SECRET
 * @returns {string} 加密后的数据（格式：iv:authTag:encryptedData，均为hex编码）
 * @throws {Error} 加密失败
 */
function encrypt(data, key = JWT_SECRET) {
  try {
    // 确保密钥长度为32字节（256位）
    const keyBuffer = crypto.createHash('sha256').update(key).digest();

    // 生成随机初始化向量（IV）
    const iv = crypto.randomBytes(16);

    // 创建加密器
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

    // 加密数据
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 获取认证标签
    const authTag = cipher.getAuthTag().toString('hex');

    // 返回格式：iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    throw new Error('数据加密失败');
  }
}

/**
 * AES-256-GCM 解密
 * 解密由encrypt函数加密的数据
 * @param {string} encryptedData - 加密后的数据（格式：iv:authTag:encryptedData）
 * @param {string} key - 解密密钥（可选），默认使用JWT_SECRET
 * @returns {string} 解密后的原始数据
 * @throws {Error} 解密失败
 */
function decrypt(encryptedData, key = JWT_SECRET) {
  try {
    // 解析加密数据
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('加密数据格式错误');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // 确保密钥长度为32字节（256位）
    const keyBuffer = crypto.createHash('sha256').update(key).digest();

    // 转换hex字符串为Buffer
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // 创建解密器
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);

    // 解密数据
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('数据解密失败');
  }
}

// ==================== 工具函数 ====================

/**
 * 生成哈希值
 * 使用指定算法对数据生成哈希值
 * @param {string} data - 待哈希的数据
 * @param {string} algorithm - 哈希算法（默认'sha256'）
 * @returns {string} 哈希值（hex编码）
 */
function hash(data, algorithm = 'sha256') {
  try {
    return crypto.createHash(algorithm).update(data).digest('hex');
  } catch (error) {
    throw new Error('哈希生成失败');
  }
}

// ==================== 导出模块 ====================

module.exports = {
  // 密码相关
  hashPassword,
  comparePassword,

  // JWT Token相关
  generateToken,
  verifyToken,

  // 随机字符串生成
  generateRandomString,
  generateUUID,
  generateRandomDigits,

  // 数据加密/解密（可选）
  encrypt,
  decrypt,

  // 工具函数
  hash,

  // 导出配置常量（供外部使用）
  SALT_ROUNDS,
  JWT_SECRET,
  JWT_EXPIRES_IN
};