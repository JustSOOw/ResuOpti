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
const applicationService = require('../../services/applicationService');
const metadataService = require('../../services/metadataService');

const router = express.Router();

/**
 * 将简历实体统一转换为API响应格式
 * 确保同时暴露 type 和 resumeType 字段，兼容验收脚本
 * 将数据库字段（下划线命名）转换为前端期望的驼峰命名
 * @param {Object} resume
 * @returns {Object}
 */
const mapResumeToResponse = (resume) => {
  if (!resume) {
    return resume;
  }

  const plain = typeof resume.toJSON === 'function' ? resume.toJSON() : { ...resume };

  // 提取并排除关联对象和下划线字段
  const {
    metadata,
    targetPosition,  // 排除关联对象
    target_position_id,
    file_path,
    file_name,
    file_size,
    created_at,
    updated_at,
    ...rest
  } = plain;

  const notes = metadata?.notes ?? null;
  const tags = Array.isArray(metadata?.tags) ? metadata.tags : [];

  return {
    ...rest,
    targetPositionId: target_position_id,
    resumeType: rest.type,
    filePath: file_path || undefined,
    fileName: file_name || undefined,
    fileSize: file_size || undefined,
    createdAt: created_at,
    updatedAt: updated_at,
    notes,
    tags
    // 注意: metadata和targetPosition已从响应中排除，notes和tags提升到顶层
  };
};

const mapApplicationToResponse = (application) => {
  if (!application) {
    return application;
  }

  const plain = typeof application.toJSON === 'function' ? application.toJSON() : { ...application };
  const { resume, ...rest } = plain;

  const response = {
    id: rest.id,
    resumeId: rest.resume_id,
    companyName: rest.company_name,
    positionTitle: rest.position_title,
    applicationDate: rest.apply_date,
    status: rest.status,
    notes: rest.notes ?? null,
    createdAt: rest.created_at,
    updatedAt: rest.updated_at
  };

  if (resume) {
    response.resume = mapResumeToResponse(resume);
  }

  return response;
};

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

    const {
      targetPositionId,
      type,
      resumeType,
      title,
      content,
      filePath,
      fileName,
      fileSize
    } = req.body;

    // 验证必需字段
    if (!targetPositionId) {
      return res.status(400).json({
        success: false,
        message: '目标岗位ID是必需字段'
      });
    }

    const rawType = typeof type === 'string' && type.trim() !== '' ? type : resumeType;

    if (!rawType) {
      return res.status(400).json({
        success: false,
        message: '简历类型是必需字段'
      });
    }

    const normalizedType = rawType.trim().toLowerCase();

    if (normalizedType !== 'online' && normalizedType !== 'file') {
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
    if (normalizedType === 'online') {
      // 验证content字段存在（允许空字符串，用户可以在编辑器中填充）
      if (content === undefined || content === null) {
        return res.status(400).json({
          success: false,
          message: '在线简历必须提供content字段'
        });
      }

      resume = await resumeService.createOnlineResume(targetPositionId, userId, {
        title: title.trim(),
        content
      });
    } else if (normalizedType === 'file') {
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
      data: mapResumeToResponse(resume)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    if (
      error.message.includes('长度') ||
      error.message.includes('字符') ||
      error.message.includes('必须') ||
      error.message.includes('不能为空')
    ) {
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
 * GET /api/v1/resumes?positionId=xxx
 * 通过查询参数获取指定岗位下的所有简历
 *
 * 需要认证: 是
 *
 * 查询参数:
 * - positionId: 目标岗位UUID (可选)
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
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const { positionId } = req.query;

    // 如果提供了positionId，获取该岗位下的简历
    if (positionId) {
      // 验证UUID格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(positionId)) {
        return res.status(400).json({
          success: false,
          message: '无效的岗位ID格式'
        });
      }

      const resumes = await resumeService.getResumesByPosition(positionId, userId);

      return res.status(200).json({
        success: true,
        data: resumes.map(mapResumeToResponse)
      });
    }

    // 如果没有提供positionId，返回错误（或者可以返回用户所有简历）
    return res.status(400).json({
      success: false,
      message: '缺少必需的查询参数: positionId'
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    console.error('获取简历列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取简历列表失败',
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
      data: mapResumeToResponse(resume)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
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
    const { title, content, notes, tags } = req.body;

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的简历ID格式'
      });
    }

    // 至少提供一个更新字段
    if (title === undefined && content === undefined && notes === undefined && tags === undefined) {
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

    let resume = null;

    if (title !== undefined || content !== undefined) {
      resume = await resumeService.updateOnlineResume(id, userId, updateData);
    }

    if (notes !== undefined || tags !== undefined) {
      await resumeService.updateResumeMetadata(id, userId, { notes, tags });
      resume = await resumeService.getResumeById(id, userId);
    }

    if (!resume) {
      resume = await resumeService.getResumeById(id, userId);
    }

    res.status(200).json({
      success: true,
      message: '[DEBUG-VERSION] 简历更新成功',
      data: mapResumeToResponse(resume)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    if (
      error.message.includes('file') ||
      error.message.includes('文件类型') ||
      error.message.includes('online')
    ) {
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

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
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
router.get('/:positionId/resumes', async (req, res) => {
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
      data: resumes.map(mapResumeToResponse)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        error: error.message
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

/**
 * POST /api/v1/resumes/:id/applications
 * 为指定简历创建投递记录
 */
router.post('/:id/applications', async (req, res) => {
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
        message: '无效的简历ID格式'
      });
    }

    const { companyName, positionTitle, applicationDate, status, notes } = req.body;

    if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '公司名称不能为空'
      });
    }

    const applyDate = applicationDate
      ? new Date(applicationDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const application = await applicationService.createApplication(id, userId, {
      companyName: companyName.trim(),
      positionTitle,
      applyDate,
      status,
      notes
    });

    const detailed = await applicationService.getApplicationById(application.id, userId);

    res.status(201).json({
      success: true,
      message: '投递记录创建成功',
      data: mapApplicationToResponse(detailed)
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

    console.error('创建投递记录错误:', error);
    res.status(500).json({
      success: false,
      message: '创建投递记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/v1/resumes/:id/applications/:applicationId
 * 更新指定投递记录
 */
router.put('/:id/applications/:applicationId', async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    const { id, applicationId } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id) || !uuidRegex.test(applicationId)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID格式'
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

    const updated = await applicationService.updateApplication(applicationId, userId, updates);

    if (updated.resume && updated.resume.id !== id) {
      return res.status(404).json({
        success: false,
        message: '投递记录不属于指定简历'
      });
    }

    res.status(200).json({
      success: true,
      message: '投递记录更新成功',
      data: mapApplicationToResponse(updated)
    });
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('无权')) {
      return res.status(403).json({
        success: false,
        message: error.message
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
 * GET /api/v1/resumes/:id/metadata
 * 获取简历元数据
 */
router.get('/:id/metadata', async (req, res) => {
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
        message: '无效的简历ID格式'
      });
    }

    const metadata = await metadataService.getMetadataByResumeId(id, userId);

    res.status(200).json({
      success: true,
      data: {
        resumeId: metadata.resume_id,
        notes: metadata.notes,
        tags: metadata.tags || []
      }
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

    console.error('获取元数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取元数据失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/v1/resumes/:id/metadata
 * 更新简历元数据
 */
router.put('/:id/metadata', async (req, res) => {
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
        message: '无效的简历ID格式'
      });
    }

    const { notes, tags } = req.body;

    if (notes === undefined && tags === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    }

    const metadata = await metadataService.updateMetadata(id, userId, { notes, tags });

    res.status(200).json({
      success: true,
      message: '元数据更新成功',
      data: {
        resumeId: metadata.resume_id,
        notes: metadata.notes,
        tags: metadata.tags || []
      }
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

    console.error('更新元数据错误:', error);
    res.status(500).json({
      success: false,
      message: '更新元数据失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/resumes/:id/metadata/tags
 * 为简历添加标签
 */
router.post('/:id/metadata/tags', async (req, res) => {
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
        message: '无效的简历ID格式'
      });
    }

    const { tag } = req.body;

    if (!tag || typeof tag !== 'string' || tag.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '标签不能为空'
      });
    }

    const metadata = await metadataService.addTag(id, userId, tag.trim());

    res.status(200).json({
      success: true,
      message: '标签添加成功',
      data: {
        resumeId: metadata.resume_id,
        notes: metadata.notes,
        tags: metadata.tags || []
      }
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

    console.error('添加标签错误:', error);
    res.status(500).json({
      success: false,
      message: '添加标签失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/resumes/:id/applications
 * 获取简历的所有投递记录
 */
router.get('/:id/applications', async (req, res) => {
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
        message: '无效的简历ID格式'
      });
    }

    const applications = await applicationService.getApplicationsByResumeId(id, userId);

    res.status(200).json({
      success: true,
      data: applications.map(mapApplicationToResponse)
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

    console.error('获取投递记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取投递记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
