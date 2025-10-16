/**
 * 用户认证API控制器
 * 提供用户注册和登录端点
 *
 * 路由:
 * - POST /api/v1/auth/register - 用户注册
 * - POST /api/v1/auth/login - 用户登录
 */

const express = require('express');
const authService = require('../../services/authService');

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * 用户注册端点
 *
 * 请求体:
 * {
 *   email: string,      // 必需，邮箱格式
 *   password: string    // 必需，最少8位，包含字母和数字
 * }
 *
 * 成功响应 (201):
 * {
 *   success: true,
 *   message: string,
 *   data: {
 *     userId: string,   // UUID
 *     email: string
 *   }
 * }
 *
 * 错误响应:
 * - 400: 请求参数验证失败
 * - 409: 邮箱已存在
 * - 500: 服务器内部错误
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必需字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码是必需字段'
      });
    }

    // 验证email和password是非空字符串
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '邮箱不能为空'
      });
    }

    if (typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '密码不能为空'
      });
    }

    // 调用认证服务进行注册
    const user = await authService.register(email.trim(), password);

    // 注册成功后自动生成token，实现自动登录
    const token = authService.generateToken(user.id);

    // 返回成功响应，包含token
    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        }
      },
      // 为了向后兼容，也在顶层返回token
      token: token
    });
  } catch (error) {
    // 处理业务逻辑错误
    if (error.message.includes('邮箱格式')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('密码')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('已被注册')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    // 未知错误，返回500
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/auth/login
 * 用户登录端点
 *
 * 请求体:
 * {
 *   email: string,      // 必需，邮箱格式
 *   password: string    // 必需
 * }
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   message: string,
 *   data: {
 *     token: string,    // JWT token
 *     user: {
 *       id: string,     // UUID
 *       email: string,
 *       createdAt: string  // ISO 8601日期时间
 *     }
 *   }
 * }
 *
 * 错误响应:
 * - 400: 请求参数验证失败
 * - 401: 用户不存在或密码错误
 * - 500: 服务器内部错误
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必需字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码是必需字段'
      });
    }

    // 验证email和password是非空字符串
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '邮箱不能为空'
      });
    }

    if (typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '密码不能为空'
      });
    }

    // 调用认证服务进行登录
    const result = await authService.login(email.trim(), password);

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          createdAt: result.user.created_at
        }
      },
      // 为了向后兼容，也在顶层返回token
      token: result.token
    });
  } catch (error) {
    // 处理业务逻辑错误
    if (error.message.includes('邮箱格式')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('用户不存在') || error.message.includes('密码错误')) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误' // 不透露具体是哪个错误，提高安全性
      });
    }

    // 未知错误，返回500
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
