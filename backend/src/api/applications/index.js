/**
 * 投递记录API控制器
 * 提供投递记录的查询和管理端点
 *
 * 路由:
 * - GET /api/v1/applications - 获取用户所有投递记录
 * - PUT /api/v1/applications/:id - 更新投递记录
 * - DELETE /api/v1/applications/:id - 删除投递记录
 */

const express = require('express');
const applicationService = require('../../services/applicationService');

const router = express.Router();

/**
 * 将投递记录实体转换为API响应格式
 */
const mapApplicationToResponse = (application) => {
  if (!application) {
    return application;
  }

  const plain = typeof application.toJSON === 'function' ? application.toJSON() : { ...application };
  const { resume, ...rest } = plain;

  const response = {
    id: rest.id,
    resume_id: rest.resume_id,
    company_name: rest.company_name,
    position_title: rest.position_title,
    apply_date: rest.apply_date,
    status: rest.status,
    notes: rest.notes ?? null,
    created_at: rest.created_at,
    updated_at: rest.updated_at
  };

  return response;
};

/**
 * GET /api/v1/applications
 * 获取当前用户所有投递记录
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const applications = await applicationService.getApplicationsByUserId(userId);

    res.status(200).json({
      success: true,
      data: applications.map(mapApplicationToResponse)
    });
  } catch (error) {
    console.error('获取投递记录列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取投递记录列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/v1/applications/:id
 * 更新投递记录
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的投递记录ID格式'
      });
    }

    const { companyName, positionTitle, applicationDate, status, notes } = req.body;

    if (
      companyName === undefined &&
      positionTitle === undefined &&
      applicationDate === undefined &&
      status === undefined &&
      notes === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    }

    const updates = {};
    if (companyName !== undefined) {
      updates.companyName = companyName;
    }
    if (positionTitle !== undefined) {
      updates.positionTitle = positionTitle;
    }
    if (applicationDate !== undefined) {
      updates.applyDate = new Date(applicationDate).toISOString().slice(0, 10);
    }
    if (status !== undefined) {
      updates.status = status;
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }

    const updated = await applicationService.updateApplication(id, userId, updates);

    res.status(200).json({
      success: true,
      message: '投递记录更新成功',
      data: mapApplicationToResponse(updated)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    if (
      error.message.includes('不能为空') ||
      error.message.includes('不能超过') ||
      error.message.includes('无效') ||
      error.message.includes('不能为未来')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('更新投递记录错误:', error);
    res.status(500).json({
      success: false,
      message: '更新投递记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/v1/applications/:id
 * 删除投递记录
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的投递记录ID格式'
      });
    }

    await applicationService.deleteApplication(id, userId);

    res.status(200).json({
      success: true,
      message: '投递记录删除成功'
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    console.error('删除投递记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除投递记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
