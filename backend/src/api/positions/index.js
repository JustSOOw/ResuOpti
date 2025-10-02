/**
 * 目标岗位API控制器
 * 提供完整的CRUD端点
 *
 * 路由:
 * - GET /api/v1/target-positions - 获取用户所有岗位
 * - POST /api/v1/target-positions - 创建新岗位
 * - GET /api/v1/target-positions/:id - 获取岗位详情
 * - PUT /api/v1/target-positions/:id - 更新岗位
 * - DELETE /api/v1/target-positions/:id - 删除岗位
 */

const express = require('express');
const positionService = require('../../services/positionService');

const router = express.Router();

// 注意: 所有路由都需要JWT认证中间件，需要在主app.js中配置

/**
 * 将数据库实体转换为API响应格式
 * 兼容历史字段 name，并新增 title 以满足验收脚本
 * @param {Object} position - 原始岗位对象
 * @returns {Object}
 */
const mapPositionToResponse = (position) => {
  if (!position) {
    return position;
  }

  return {
    ...position,
    title: position.name
  };
};

/**
 * GET /api/v1/target-positions
 * 获取当前用户所有目标岗位
 *
 * 需要认证: 是
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   data: TargetPosition[]  // 按创建时间降序排列
 * }
 */
router.get('/', async (req, res) => {
  try {
    // 从认证中间件获取userId (req.user.id)
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const positions = await positionService.getPositionsByUserId(userId);

    res.status(200).json({
      success: true,
      data: positions.map(mapPositionToResponse)
    });
  } catch (error) {
    console.error('获取岗位列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取岗位列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/target-positions
 * 创建新的目标岗位
 *
 * 需要认证: 是
 *
 * 请求体:
 * {
 *   name: string,        // 必需，1-100字符，同一用户下不可重复
 *   description?: string // 可选，岗位描述
 * }
 *
 * 成功响应 (201):
 * {
 *   success: true,
 *   message: '目标岗位创建成功',
 *   data: TargetPosition
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败
 * - 401: 未授权
 * - 409: 岗位名称重复
 * - 500: 服务器错误
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const { name, title, description } = req.body;

    const finalName = typeof name === 'string' && name.trim() !== '' ? name : title;

    // 验证必需字段
    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: '岗位名称是必需字段'
      });
    }

    // 验证name是非空字符串
    if (typeof finalName !== 'string' || finalName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '岗位名称不能为空'
      });
    }

    // 调用服务层创建岗位
    const position = await positionService.createPosition(userId, finalName.trim(), description);

    res.status(201).json({
      success: true,
      message: '目标岗位创建成功',
      data: mapPositionToResponse(position)
    });
  } catch (error) {
    // 处理业务逻辑错误
    if (error.message.includes('长度') || error.message.includes('字符')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('已存在')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    console.error('创建岗位错误:', error);
    res.status(500).json({
      success: false,
      message: '创建岗位失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/target-positions/:id
 * 获取目标岗位详情
 *
 * 需要认证: 是
 *
 * 路径参数:
 * - id: 岗位UUID
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   data: TargetPosition (包含resumeCount字段)
 * }
 *
 * 错误响应:
 * - 400: 无效的UUID格式
 * - 401: 未授权
 * - 403: 无权限访问
 * - 404: 岗位不存在
 * - 500: 服务器错误
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const { id } = req.params;

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的岗位ID格式'
      });
    }

    const position = await positionService.getPositionById(id, userId, true);

    res.status(200).json({
      success: true,
      data: mapPositionToResponse(position)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权限')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    console.error('获取岗位详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取岗位详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/v1/target-positions/:id
 * 更新目标岗位
 *
 * 需要认证: 是
 *
 * 路径参数:
 * - id: 岗位UUID
 *
 * 请求体:
 * {
 *   name?: string,        // 可选，1-100字符
 *   description?: string  // 可选
 * }
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   message: '岗位更新成功',
 *   data: TargetPosition
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败
 * - 401: 未授权
 * - 403: 无权限
 * - 404: 岗位不存在
 * - 409: 名称重复
 * - 500: 服务器错误
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const { id } = req.params;
    const { name, title, description } = req.body;

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的岗位ID格式'
      });
    }

    // 至少提供一个更新字段
    const hasNameOrTitle = name !== undefined || title !== undefined;

    if (!hasNameOrTitle && description === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    }

    // 构建更新数据对象
    const updateData = {};
    const finalName = name !== undefined ? name : title;

    if (finalName !== undefined) {
      if (typeof finalName !== 'string' || finalName.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '岗位名称不能为空'
        });
      }
      updateData.name = finalName.trim();
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const position = await positionService.updatePosition(id, userId, updateData);

    res.status(200).json({
      success: true,
      message: '岗位更新成功',
      data: mapPositionToResponse(position)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权限')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('已存在')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('长度') || error.message.includes('字符')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('更新岗位错误:', error);
    res.status(500).json({
      success: false,
      message: '更新岗位失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/v1/target-positions/:id
 * 删除目标岗位
 *
 * 需要认证: 是
 *
 * 路径参数:
 * - id: 岗位UUID
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   message: '岗位删除成功',
 *   data: { deletedId: string }
 * }
 *
 * 错误响应:
 * - 400: 无效的UUID / 岗位下有简历无法删除
 * - 401: 未授权
 * - 403: 无权限
 * - 404: 岗位不存在
 * - 500: 服务器错误
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const { id } = req.params;

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的岗位ID格式'
      });
    }

    const result = await positionService.deletePosition(id, userId);

    res.status(200).json({
      success: true,
      message: '岗位删除成功',
      data: { deletedId: result.deletedId }
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权限')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('简历') || error.message.includes('无法删除')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('删除岗位错误:', error);
    res.status(500).json({
      success: false,
      message: '删除岗位失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
