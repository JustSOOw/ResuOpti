/**
 * ResumeService - 简历版本管理服务
 * 提供简历的CRUD操作，支持文件类型和在线类型两种简历
 * 性能优化：优化查询字段、使用findByPk
 */

const { sequelize, ResumeVersion, ResumeMetadata, TargetPosition } = require('../models');
const fs = require('fs').promises;
const path = require('path');

/**
 * 验证目标岗位存在性和所有权
 * @param {string} targetPositionId - 目标岗位ID
 * @param {string} userId - 用户ID
 * @returns {Promise<TargetPosition>} 目标岗位实例
 * @throws {Error} 岗位不存在或无权限
 */
async function validateTargetPosition(targetPositionId, userId) {
  // 优化：只查询需要验证的字段
  const targetPosition = await TargetPosition.findOne({
    where: { id: targetPositionId, user_id: userId },
    attributes: ['id', 'user_id', 'name']
  });

  if (!targetPosition) {
    throw new Error('目标岗位不存在或您无权访问');
  }

  return targetPosition;
}

/**
 * 验证简历标题
 * @param {string} title - 简历标题
 * @throws {Error} 标题验证失败
 */
function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    throw new Error('简历标题不能为空');
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0 || trimmedTitle.length > 200) {
    throw new Error('简历标题长度必须在1-200字符之间');
  }
}

/**
 * 创建文件类型简历
 * @param {string} targetPositionId - 目标岗位ID
 * @param {string} userId - 用户ID
 * @param {Object} resumeData - 简历数据
 * @param {string} resumeData.title - 简历标题
 * @param {string} resumeData.filePath - 文件存储路径
 * @param {string} resumeData.fileName - 原始文件名
 * @param {number} resumeData.fileSize - 文件大小（字节）
 * @returns {Promise<Object>} 创建的简历信息（包含metadata）
 * @throws {Error} 验证失败或创建失败
 */
async function createFileResume(targetPositionId, userId, resumeData) {
  const { title, filePath, fileName, fileSize } = resumeData;

  // 验证标题
  validateTitle(title);

  // 验证文件信息
  if (!filePath || !fileName) {
    throw new Error('文件路径和文件名不能为空');
  }

  if (fileSize && (fileSize < 0 || fileSize > 10 * 1024 * 1024)) {
    throw new Error('文件大小必须在0到10MB之间');
  }

  // 验证目标岗位
  await validateTargetPosition(targetPositionId, userId);

  // 使用事务创建简历和元数据
  const transaction = await sequelize.transaction();

  try {
    // 创建简历版本
    const resume = await ResumeVersion.create(
      {
        target_position_id: targetPositionId,
        type: 'file',
        title: title.trim(),
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize
      },
      { transaction }
    );

    // 创建对应的元数据记录（初始化为空）
    const metadata = await ResumeMetadata.create(
      {
        resume_id: resume.id,
        notes: null,
        tags: []
      },
      { transaction }
    );

    await transaction.commit();

    // 返回完整的简历信息（包含metadata）
    return {
      ...resume.toJSON(),
      metadata: metadata.toJSON()
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * 创建在线类型简历
 * @param {string} targetPositionId - 目标岗位ID
 * @param {string} userId - 用户ID
 * @param {Object} resumeData - 简历数据
 * @param {string} resumeData.title - 简历标题
 * @param {string} resumeData.content - 富文本内容
 * @returns {Promise<Object>} 创建的简历信息（包含metadata）
 * @throws {Error} 验证失败或创建失败
 */
async function createOnlineResume(targetPositionId, userId, resumeData) {
  const { title, content } = resumeData;

  // 验证标题
  validateTitle(title);

  // 验证内容字段存在（允许空字符串，用户创建后会在编辑器中填充内容）
  if (content === undefined || content === null || typeof content !== 'string') {
    throw new Error('在线简历必须提供content字段');
  }

  // 验证目标岗位
  await validateTargetPosition(targetPositionId, userId);

  // 使用事务创建简历和元数据
  const transaction = await sequelize.transaction();

  try {
    // 创建简历版本
    const resume = await ResumeVersion.create(
      {
        target_position_id: targetPositionId,
        type: 'online',
        title: title.trim(),
        content: content
      },
      { transaction }
    );

    // 创建对应的元数据记录
    const metadata = await ResumeMetadata.create(
      {
        resume_id: resume.id,
        notes: null,
        tags: []
      },
      { transaction }
    );

    await transaction.commit();

    // 返回完整的简历信息
    return {
      ...resume.toJSON(),
      metadata: metadata.toJSON()
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * 获取岗位下所有简历
 * @param {string} targetPositionId - 目标岗位ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 简历列表（包含metadata）
 * @throws {Error} 岗位不存在或无权限
 */
async function getResumesByPosition(targetPositionId, userId) {
  // 验证目标岗位
  await validateTargetPosition(targetPositionId, userId);

  // 查询该岗位下的所有简历，并关联metadata
  // 优化：只查询需要的字段，减少数据传输
  const resumes = await ResumeVersion.findAll({
    where: { target_position_id: targetPositionId },
    attributes: [
      'id',
      'target_position_id',
      'type',
      'title',
      'file_path',
      'file_name',
      'file_size',
      'content',
      'created_at',
      'updated_at'
    ],
    include: [
      {
        model: ResumeMetadata,
        as: 'metadata',
        required: false, // 左连接，即使没有metadata也返回简历
        attributes: ['id', 'resume_id', 'notes', 'tags', 'created_at', 'updated_at']
      }
    ],
    order: [['created_at', 'DESC']] // 按创建时间降序排列
  });

  return resumes.map((resume) => resume.toJSON());
}

/**
 * 获取单个简历详情
 * @param {string} resumeId - 简历ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 简历详情（包含metadata和targetPosition信息）
 * @throws {Error} 简历不存在或无权限
 */
async function getResumeById(resumeId, userId) {
  // 优化：直接通过关联查询验证所有权，减少一次查询
  // 使用findByPk代替findOne提升性能
  const resume = await ResumeVersion.findByPk(resumeId, {
    attributes: [
      'id',
      'target_position_id',
      'type',
      'title',
      'file_path',
      'file_name',
      'file_size',
      'content',
      'created_at',
      'updated_at'
    ],
    include: [
      {
        model: ResumeMetadata,
        as: 'metadata',
        required: false,
        attributes: ['id', 'resume_id', 'notes', 'tags', 'created_at', 'updated_at']
      },
      {
        model: TargetPosition,
        as: 'targetPosition',
        required: true,
        attributes: ['id', 'user_id', 'name', 'description'],
        where: { user_id: userId } // 通过targetPosition验证所有权
      }
    ]
  });

  if (!resume) {
    throw new Error('简历不存在或您无权访问');
  }

  return resume.toJSON();
}

/**
 * 更新在线简历内容
 * @param {string} resumeId - 简历ID
 * @param {string} userId - 用户ID
 * @param {Object} updateData - 更新数据
 * @param {string} [updateData.title] - 简历标题
 * @param {string} [updateData.content] - 富文本内容
 * @returns {Promise<Object>} 更新后的简历信息
 * @throws {Error} 简历不存在、无权限或类型不匹配
 */
async function updateOnlineResume(resumeId, userId, updateData) {
  const { title, content } = updateData;

  // 先获取简历并验证所有权和类型
  // 优化：使用findByPk，只查询必要字段
  const resume = await ResumeVersion.findByPk(resumeId, {
    attributes: ['id', 'type', 'title', 'content', 'target_position_id'],
    include: [
      {
        model: TargetPosition,
        as: 'targetPosition',
        required: true,
        attributes: ['user_id'],
        where: { user_id: userId }
      }
    ]
  });

  if (!resume) {
    throw new Error('简历不存在或您无权访问');
  }

  // 验证类型
  if (resume.type !== 'online') {
    throw new Error('只能更新在线类型简历的内容，文件类型简历不支持此操作');
  }

  // 构建更新对象
  const updates = {};

  if (title !== undefined) {
    validateTitle(title);
    updates.title = title.trim();
  }

  if (content !== undefined) {
    // 允许空字符串内容，但必须是字符串类型
    if (typeof content !== 'string') {
      throw new Error('在线简历内容必须是字符串');
    }
    updates.content = content;
  }

  // 如果没有任何更新数据
  if (Object.keys(updates).length === 0) {
    throw new Error('没有提供需要更新的数据');
  }

  // 更新简历
  await resume.update(updates);

  // 重新加载以获取最新数据（包含metadata）
  await resume.reload({
    include: [
      {
        model: ResumeMetadata,
        as: 'metadata',
        required: false,
        attributes: ['id', 'resume_id', 'notes', 'tags', 'created_at', 'updated_at']
      }
    ]
  });

  return resume.toJSON();
}

/**
 * 更新简历的元数据（备注、标签）
 * @param {string} resumeId - 简历ID
 * @param {string} userId - 用户ID
 * @param {Object} metadataUpdates - 元数据更新内容
 * @param {string|null} [metadataUpdates.notes] - 备注
 * @param {Array<string>} [metadataUpdates.tags] - 标签数组
 * @returns {Promise<Object>} 更新后的元数据
 */
async function updateResumeMetadata(resumeId, userId, metadataUpdates) {
  const { notes, tags } = metadataUpdates;

  if (notes === undefined && tags === undefined) {
    return null;
  }

  const resume = await ResumeVersion.findByPk(resumeId, {
    attributes: ['id'],
    include: [
      {
        model: TargetPosition,
        as: 'targetPosition',
        required: true,
        attributes: ['user_id'],
        where: { user_id: userId }
      },
      {
        model: ResumeMetadata,
        as: 'metadata',
        required: false,
        attributes: ['id', 'resume_id', 'notes', 'tags', 'created_at', 'updated_at']
      }
    ]
  });

  if (!resume) {
    throw new Error('简历不存在或您无权访问');
  }

  let metadata = resume.metadata;
  if (!metadata) {
    metadata = await ResumeMetadata.create({
      resume_id: resume.id,
      notes: null,
      tags: []
    });
  }

  const updates = {};

  if (notes !== undefined) {
    if (notes !== null && typeof notes !== 'string') {
      throw new Error('备注必须是字符串');
    }

    updates.notes = notes === null ? null : notes.trim();

    if (updates.notes && updates.notes.length > 2000) {
      throw new Error('备注长度不能超过2000字符');
    }
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      throw new Error('标签必须是数组');
    }

    const cleanedTags = tags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter((tag) => tag.length > 0);

    if (cleanedTags.length > 20) {
      throw new Error('标签数量不能超过20个');
    }

    for (const tag of cleanedTags) {
      if (tag.length > 50) {
        throw new Error('每个标签长度不能超过50字符');
      }
    }

    updates.tags = cleanedTags;
  }

  if (Object.keys(updates).length === 0) {
    return metadata.toJSON();
  }

  await metadata.update(updates);

  return metadata.toJSON();
}

/**
 * 删除简历
 * @param {string} resumeId - 简历ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 删除成功信息
 * @throws {Error} 简历不存在或无权限
 */
async function deleteResume(resumeId, userId) {
  // 先获取简历并验证所有权
  // 优化：使用findByPk，只查询必要字段
  const resume = await ResumeVersion.findByPk(resumeId, {
    attributes: ['id', 'type', 'file_path'],
    include: [
      {
        model: TargetPosition,
        as: 'targetPosition',
        required: true,
        attributes: ['user_id'],
        where: { user_id: userId }
      }
    ]
  });

  if (!resume) {
    throw new Error('简历不存在或您无权访问');
  }

  const resumeType = resume.type;
  const filePath = resume.file_path;

  // 使用事务删除
  const transaction = await sequelize.transaction();

  try {
    // 删除简历（会级联删除metadata和application_records）
    await resume.destroy({ transaction });

    await transaction.commit();

    // 如果是文件类型，删除实际文件
    if (resumeType === 'file' && filePath) {
      try {
        const fullPath = path.resolve(filePath);
        await fs.unlink(fullPath);
      } catch (fileError) {
        // 文件删除失败不影响数据库删除结果
        console.warn(`文件删除失败: ${filePath}`, fileError.message);
      }
    }

    return {
      success: true,
      message: '简历删除成功',
      resumeId: resumeId,
      type: resumeType
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  createFileResume,
  createOnlineResume,
  getResumesByPosition,
  getResumeById,
  updateOnlineResume,
  updateResumeMetadata,
  deleteResume
};
