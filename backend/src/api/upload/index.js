/**
 * 文件上传API控制器
 * 提供简历文件上传端点
 *
 * 路由:
 * - POST /api/v1/resumes/upload - 上传简历文件
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fileService = require('../../services/fileService');
const resumeService = require('../../services/resumeService');

const router = express.Router();

const mapResumeToResponse = (resume) => {
  if (!resume) {
    return resume;
  }

  const plain = typeof resume.toJSON === 'function' ? resume.toJSON() : { ...resume };
  const { metadata, ...rest } = plain;
  const notes = metadata?.notes ?? null;
  const tags = Array.isArray(metadata?.tags) ? metadata.tags : [];

  return {
    ...rest,
    resumeType: rest.type,
    notes,
    tags,
    metadata: metadata || null
  };
};

/**
 * POST /api/v1/resumes/upload
 * 上传简历文件
 *
 * 需要认证: 是
 *
 * Content-Type: multipart/form-data
 *
 * Form Fields:
 * - file: File              // 必需，简历文件 (PDF/DOC/DOCX, ≤10MB)
 * - targetPositionId: string // 必需，目标岗位UUID
 * - title: string           // 必需，简历标题 (1-200字符)
 *
 * 成功响应 (201):
 * {
 *   success: true,
 *   message: '文件上传成功',
 *   data: {
 *     resume: ResumeVersion,
 *     file: {
 *       originalName: string,
 *       fileName: string,
 *       filePath: string,
 *       size: number,
 *       mimetype: string
 *     }
 *   }
 * }
 *
 * 错误响应:
 * - 400: 参数验证失败 / 文件类型不支持 / 文件大小超限
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

    // 配置并应用multer中间件
    const upload = fileService.getMulterConfig(userId);

    // 使用multer处理文件上传
    upload.single('file')(req, res, async (err) => {
      // 处理multer错误
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `文件大小超过限制（最大${fileService.MAX_FILE_SIZE / 1024 / 1024}MB）`
          });
        }

        if (err.code === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            message: `不支持的文件类型，仅支持${fileService.ALLOWED_EXTENSIONS.join(', ')}格式`
          });
        }

        console.error('文件上传错误:', err);
        return res.status(500).json({
          success: false,
          message: '文件上传失败',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      // 获取表单字段（此时multer已解析完成）
      const { targetPositionId, title } = req.body;

      // 验证必需字段
      if (!targetPositionId) {
        return res.status(400).json({
          success: false,
          message: '目标岗位ID是必需字段'
        });
      }

      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '简历标题是必需字段且不能为空'
        });
      }

      const normalizedTargetPositionId = targetPositionId.trim();

      // 验证UUID格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(normalizedTargetPositionId)) {
        return res.status(400).json({
          success: false,
          message: '无效的岗位ID格式'
        });
      }

      // 检查是否有文件上传
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的文件'
        });
      }

      try {
        const tempFilePath = path.resolve(req.file.path);

        // 验证文件类型和大小
        if (!fileService.validateFileType(req.file)) {
          // 删除已上传的文件
          await fileService.deleteFile(tempFilePath);
          return res.status(400).json({
            success: false,
            message: `不支持的文件类型，仅支持${fileService.ALLOWED_EXTENSIONS.join(', ')}格式`
          });
        }

        if (!fileService.validateFileSize(req.file)) {
          // 删除已上传的文件
          await fileService.deleteFile(tempFilePath);
          return res.status(400).json({
            success: false,
            message: `文件大小超过限制（最大${fileService.MAX_FILE_SIZE / 1024 / 1024}MB）`
          });
        }

        // 将文件移动到目标岗位目录
        const finalFilePath = await fileService.generateFilePath(
          userId,
          normalizedTargetPositionId,
          req.file.filename
        );

        if (finalFilePath !== tempFilePath) {
          await fs.rename(tempFilePath, finalFilePath);
          req.file.path = finalFilePath;
        } else {
          req.file.path = tempFilePath;
        }

        // 创建文件类型简历记录
        const resume = await resumeService.createFileResume(normalizedTargetPositionId, userId, {
          title: title.trim(),
          filePath: finalFilePath,
          fileName: req.file.originalname,
          fileSize: req.file.size
        });

        const resumeResponse = mapResumeToResponse(resume);

        // 返回成功响应
        res.status(201).json({
          success: true,
          message: '文件上传成功',
          data: {
            ...resumeResponse,
            file: {
              originalName: req.file.originalname,
              fileName: req.file.filename,
              filePath: finalFilePath,
              size: req.file.size,
              mimetype: req.file.mimetype
            }
          }
        });
      } catch (error) {
        // 如果创建简历记录失败，删除已上传的文件
        if (req.file && req.file.path) {
          try {
            await fileService.deleteFile(req.file.path);
          } catch (deleteError) {
            console.error('清理文件失败:', deleteError);
          }
        }

        // 处理业务逻辑错误
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

        console.error('创建文件简历错误:', error);
        res.status(500).json({
          success: false,
          message: '上传失败，请稍后重试',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });
  } catch (error) {
    console.error('文件上传处理错误:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
