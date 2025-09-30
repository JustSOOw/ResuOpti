/**
 * 简历版本API控制器
 * 提供简历创建和管理端点
 *
 * 路由:
 * - POST /api/v1/resumes - 创建新简历版本（在线或文件）
 * - GET /api/v1/resumes/:id - 获取简历详情
 * - PUT /api/v1/resumes/:id - 更新在线简历内容
 * - DELETE /api/v1/resumes/:id - 删除简历
 * - GET /api/v1/target-positions/:positionId/resumes - 获取岗位下所有简历
 */

const express = require('express');
const resumeService = require('../../services/resumeService');
const metadataService = require('../../services/metadataService');

const router = express.Router();

/**
 * POST /api/v1/resumes
 * 创建新简历版本
 *
 * 需要认证: 是
 *
 * 请求体 (在线简历):
 * {
 *   targetPositionId: string,  // 必需，目标岗位UUID
 *   type: 'online',            // 必需，简历类型
 *   title: string,             // 必需，简历标题 (1-200字符)
 *   content: string            // 必需，富文本内容
 * }
 *
 * 请求体 (文件简历):
 * {
 *   targetPositionId: string,  // 必需
 *   type: 'file',              // 必需
 *   title: string,             // 必需
 *   filePath: string,          // 必需，文件存储路径
 *   fileName: string,          // 必需，原始文件名
 *   fileSize: number           // 必需，文件大小（字节）
 * }
 *
 * 成功响应 (201):
 * {
 *   success: true,
 *   message: '简历创建成功',
 *   data: ResumeVersion (包含metadata)
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败
 * - 401: 未授权
 * - 403: 目标岗位不属于当前用户
 * - 404: 目标岗位不存在
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

    const { targetPositionId, type, title, content, filePath, fileName, fileSize } = req.body;

    // 验证必需字段
    if (!targetPositionId) {
      return res.status(400).json({
        success: false,
        message: '目标岗位ID是必需字段'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: '简历类型是必需字段'
      });
    }

    if (type !== 'online' && type !== 'file') {
      return res.status(400).json({
        success: false,
        message: '简历类型必须是online或file'
      });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '简历标题是必需字段且不能为空'
      });
    }

    let resume;

    // 根据类型调用不同的服务方法
    if (type === 'online') {
      if (!content) {
        return res.status(400).json({
          success: false,
          message: '在线简历必须提供内容'
        });
      }

      resume = await resumeService.createOnlineResume(targetPositionId, userId, {
        title: title.trim(),
        content
      });

    } else if (type === 'file') {
      if (!filePath || !fileName || !fileSize) {
        return res.status(400).json({
          success: false,
          message: '文件简历必须提供文件路径、文件名和文件大小'
        });
      }

      resume = await resumeService.createFileResume(targetPositionId, userId, {
        title: title.trim(),
        filePath,
        fileName,
        fileSize
      });
    }

    res.status(201).json({
      success: true,
      message: '简历创建成功',
      data: resume
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

    if (error.message.includes('长度') || error.message.includes('字符') ||
        error.message.includes('必须') || error.message.includes('不能为空')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('创建简历错误:', error);
    res.status(500).json({
      success: false,
      message: '创建简历失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/resumes/:id
 * 获取简历详情
 *
 * 需要认证: 是
 *
 * 路径参数:
 * - id: 简历UUID
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   data: ResumeVersion (包含metadata和targetPosition)
 * }
 *
 * 错误响应:
 * - 400: 无效的UUID格式
 * - 401: 未授权
 * - 403: 无权限访问
 * - 404: 简历不存在
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
        message: '无效的简历ID格式'
      });
    }

    const resume = await resumeService.getResumeById(id, userId);

    res.status(200).json({
      success: true,
      data: resume
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

    console.error('获取简历详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取简历详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/v1/resumes/:id
 * 更新在线简历内容
 *
 * 需要认证: 是
 *
 * 路径参数:
 * - id: 简历UUID
 *
 * 请求体:
 * {
 *   title?: string,    // 可选，简历标题
 *   content?: string   // 可选，富文本内容
 * }
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   message: '简历更新成功',
 *   data: ResumeVersion
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败 / 不支持更新文件类型简历
 * - 401: 未授权
 * - 403: 无权限
 * - 404: 简历不存在
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
    const { title, content } = req.body;

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的简历ID格式'
      });
    }

    // 至少提供一个更新字段
    if (title === undefined && content === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    }

    // 构建更新数据
    const updateData = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '简历标题不能为空'
        });
      }
      updateData.title = title.trim();
    }
    if (content !== undefined) {
      updateData.content = content;
    }

    const resume = await resumeService.updateOnlineResume(id, userId, updateData);

    res.status(200).json({
      success: true,
      message: '简历更新成功',
      data: resume
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

    if (error.message.includes('file') || error.message.includes('文件类型') ||
        error.message.includes('online')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('更新简历错误:', error);
    res.status(500).json({
      success: false,
      message: '更新简历失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/v1/resumes/:id
 * 删除简历
 *
 * 需要认证: 是
 *
 * 路径参数:
 * - id: 简历UUID
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   message: '简历删除成功'
 * }
 *
 * 错误响应:
 * - 400: 无效的UUID格式
 * - 401: 未授权
 * - 403: 无权限
 * - 404: 简历不存在
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
        message: '无效的简历ID格式'
      });
    }

    await resumeService.deleteResume(id, userId);

    res.status(200).json({
      success: true,
      message: '简历删除成功'
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

    console.error('删除简历错误:', error);
    res.status(500).json({
      success: false,
      message: '删除简历失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/target-positions/:positionId/resumes
 * 获取指定岗位下的所有简历
 *
 * 需要认证: 是
 *
 * 路径参数:
 * - positionId: 目标岗位UUID
 *
 * 成功响应 (200):
 * {
 *   success: true,
 *   data: ResumeVersion[] (包含metadata)
 * }
 *
 * 错误响应:
 * - 400: 无效的UUID格式
 * - 401: 未授权
 * - 403: 无权限访问该岗位
 * - 404: 岗位不存在
 * - 500: 服务器错误
 */
router.get('/target-positions/:positionId/resumes', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const { positionId } = req.params;

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(positionId)) {
      return res.status(400).json({
        success: false,
        message: '无效的岗位ID格式'
      });
    }

    const resumes = await resumeService.getResumesByPosition(positionId, userId);

    res.status(200).json({
      success: true,
      data: resumes
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

    console.error('获取岗位简历列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取岗位简历列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;