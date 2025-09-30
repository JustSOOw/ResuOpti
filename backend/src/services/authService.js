/**
 * 用户认证服务
 * 提供用户注册、登录、密码加密和JWT token管理功能
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');

// bcrypt加密轮次
const SALT_ROUNDS = 10;

// JWT密钥（从环境变量获取，如未设置使用默认值）
const JWT_SECRET = process.env.JWT_SECRET || 'resuopti-default-secret-key-change-in-production';

// JWT有效期：24小时
const JWT_EXPIRES_IN = '24h';

/**
 * 密码哈希功能
 * 使用bcrypt对明文密码进行加密
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 加密后的密码哈希值
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
 * 密码比对功能
 * 验证明文密码与哈希值是否匹配
 * @param {string} password - 明文密码
 * @param {string} hash - 密码哈希值
 * @returns {Promise<boolean>} 密码是否匹配
 */
async function comparePassword(password, hash) {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new Error('密码比对失败');
  }
}

/**
 * 生成JWT token
 * 创建包含用户信息的JWT token
 * @param {Object} user - 用户对象
 * @returns {string} JWT token字符串
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email
  };

  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
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
 * @throws {Error} token无效或已过期
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

/**
 * 验证密码格式
 * 密码至少8位且包含字母和数字
 * @param {string} password - 待验证的密码
 * @throws {Error} 密码格式不符合要求
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error('密码长度至少为8位');
  }

  // 检查是否包含字母
  const hasLetter = /[a-zA-Z]/.test(password);
  // 检查是否包含数字
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    throw new Error('密码必须同时包含字母和数字');
  }
}

/**
 * 用户注册
 * 创建新用户账户
 * @param {string} email - 邮箱地址
 * @param {string} password - 明文密码
 * @returns {Promise<Object>} 新创建的用户信息（不包含password_hash）
 * @throws {Error} 邮箱格式错误、密码格式错误或邮箱已存在
 */
async function register(email, password) {
  // 验证邮箱格式
  if (!email || !validator.isEmail(email)) {
    throw new Error('邮箱格式不正确');
  }

  // 验证密码格式
  validatePassword(password);

  // 检查邮箱是否已存在
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('该邮箱已被注册');
  }

  // 密码哈希
  const password_hash = await hashPassword(password);

  // 创建新用户
  const newUser = await User.create({
    email,
    password_hash
  });

  // 返回用户信息（不包含password_hash）
  const userResponse = {
    id: newUser.id,
    email: newUser.email,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at
  };

  return userResponse;
}

/**
 * 用户登录
 * 验证用户凭据并返回JWT token
 * @param {string} email - 邮箱地址
 * @param {string} password - 明文密码
 * @returns {Promise<Object>} 包含用户信息和JWT token的对象
 * @throws {Error} 用户不存在或密码错误
 */
async function login(email, password) {
  // 验证输入
  if (!email || !password) {
    throw new Error('邮箱和密码不能为空');
  }

  // 查找用户
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('用户不存在');
  }

  // 验证密码
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('密码错误');
  }

  // 生成JWT token
  const token = generateToken(user);

  // 返回用户信息和token（不包含password_hash）
  const response = {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token
  };

  return response;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  register,
  login
};