/**
 * 简历元数据管理服务
 * 提供简历备注和标签的增删改查功能
 * 性能优化：添加缓存、优化查询字段
 */

const { ResumeMetadata, ResumeVersion, TargetPosition } = require('../models');
const { Op } = require('sequelize');
const { metadataCache, LRUCache } = require('../utils/cache');

/**
 * 验证简历存在性和所有权
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 简历版本对象
 * @throws {Error} 简历不存在或无权限访问
 */
async function validateResumeOwnership(resumeId, userId) {
  const resume = await ResumeVersion.findByPk(resumeId, {
    include: [
      {
        model: TargetPosition,
        as: 'targetPosition',
        attributes: ['id', 'user_id', 'name']
      }
    ]
  });

  if (!resume) {
    throw new Error('简历不存在');
  }

  if (resume.targetPosition.user_id !== userId) {
    throw new Error('无权限访问该简历');
  }

  return resume;
}

/**
 * 获取简历元数据
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 元数据对象
 */
async function getMetadataByResumeId(resumeId, userId) {
  // 验证简历存在性和所有权
  await validateResumeOwnership(resumeId, userId);

  const cacheKey = LRUCache.generateKey('metadata', resumeId);

  // 使用缓存包装函数
  return metadataCache.wrap(cacheKey, async () => {
    // 查找或创建元数据
    let metadata = await ResumeMetadata.findOne({
      where: { resume_id: resumeId },
      attributes: ['id', 'resume_id', 'notes', 'tags', 'created_at', 'updated_at']
    });

    // 如果元数据不存在，自动创建一个空的元数据记录
    if (!metadata) {
      metadata = await ResumeMetadata.create({
        resume_id: resumeId,
        notes: null,
        tags: []
      });
    }

    return metadata.toJSON();
  });
}

/**
 * 更新简历备注
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @param {string} notes - 备注内容
 * @returns {Promise<Object>} 更新后的元数据对象
 */
async function updateNotes(resumeId, userId, notes) {
  // 验证简历存在性和所有权
  await validateResumeOwnership(resumeId, userId);

  // 验证备注长度
  if (notes && notes.length > 2000) {
    throw new Error('备注长度不能超过2000字符');
  }

  // 查找或创建元数据
  let metadata = await ResumeMetadata.findOne({
    where: { resume_id: resumeId }
  });

  if (!metadata) {
    // 如果不存在，创建新记录
    metadata = await ResumeMetadata.create({
      resume_id: resumeId,
      notes: notes,
      tags: []
    });
  } else {
    // 更新备注
    metadata.notes = notes;
    await metadata.save();
  }

  const result = metadata.toJSON();

  // 更新缓存
  const cacheKey = LRUCache.generateKey('metadata', resumeId);
  metadataCache.set(cacheKey, result);

  return result;
}

/**
 * 添加标签
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @param {string} tag - 标签内容
 * @returns {Promise<Object>} 更新后的元数据对象
 */
async function addTag(resumeId, userId, tag) {
  // 验证简历存在性和所有权
  await validateResumeOwnership(resumeId, userId);

  // 验证标签格式
  if (typeof tag !== 'string' || tag.trim() === '') {
    throw new Error('标签必须是非空字符串');
  }

  // 验证标签长度
  if (tag.length > 50) {
    throw new Error('标签长度不能超过50字符');
  }

  // 查找或创建元数据
  let metadata = await ResumeMetadata.findOne({
    where: { resume_id: resumeId }
  });

  if (!metadata) {
    // 如果不存在，创建新记录
    metadata = await ResumeMetadata.create({
      resume_id: resumeId,
      notes: null,
      tags: [tag]
    });
  } else {
    // 验证标签是否已存在
    if (metadata.tags.includes(tag)) {
      throw new Error('标签已存在');
    }

    // 验证标签数量
    if (metadata.tags.length >= 20) {
      throw new Error('标签数量不能超过20个');
    }

    // 添加新标签
    metadata.tags = [...metadata.tags, tag];
    await metadata.save();
  }

  const result = metadata.toJSON();

  // 更新缓存
  const cacheKey = LRUCache.generateKey('metadata', resumeId);
  metadataCache.set(cacheKey, result);

  return result;
}

/**
 * 删除标签
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @param {string} tag - 标签内容
 * @returns {Promise<Object>} 更新后的元数据对象
 */
async function removeTag(resumeId, userId, tag) {
  // 验证简历存在性和所有权
  await validateResumeOwnership(resumeId, userId);

  // 查找元数据
  const metadata = await ResumeMetadata.findOne({
    where: { resume_id: resumeId }
  });

  if (!metadata) {
    throw new Error('元数据不存在');
  }

  // 从标签数组中移除指定标签
  metadata.tags = metadata.tags.filter((t) => t !== tag);
  await metadata.save();

  const result = metadata.toJSON();

  // 更新缓存
  const cacheKey = LRUCache.generateKey('metadata', resumeId);
  metadataCache.set(cacheKey, result);

  return result;
}

/**
 * 批量更新标签
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @param {Array<string>} tags - 标签数组
 * @returns {Promise<Object>} 更新后的元数据对象
 */
async function updateTags(resumeId, userId, tags) {
  // 验证简历存在性和所有权
  await validateResumeOwnership(resumeId, userId);

  // 验证标签是数组
  if (!Array.isArray(tags)) {
    throw new Error('标签必须是数组格式');
  }

  // 验证标签数量
  if (tags.length > 20) {
    throw new Error('标签数量不能超过20个');
  }

  // 验证每个标签的长度和格式
  for (const tag of tags) {
    if (typeof tag !== 'string' || tag.trim() === '') {
      throw new Error('每个标签必须是非空字符串');
    }
    if (tag.length > 50) {
      throw new Error('每个标签长度不能超过50字符');
    }
  }

  // 查找或创建元数据
  let metadata = await ResumeMetadata.findOne({
    where: { resume_id: resumeId }
  });

  if (!metadata) {
    // 如果不存在，创建新记录
    metadata = await ResumeMetadata.create({
      resume_id: resumeId,
      notes: null,
      tags: tags
    });
  } else {
    // 替换整个标签数组
    metadata.tags = tags;
    await metadata.save();
  }

  const result = metadata.toJSON();

  // 更新缓存
  const cacheKey = LRUCache.generateKey('metadata', resumeId);
  metadataCache.set(cacheKey, result);

  return result;
}

/**
 * 根据标签搜索简历
 * @param {string} userId - 用户ID
 * @param {string} tag - 标签内容
 * @returns {Promise<Array>} 包含指定标签的简历列表
 */
async function searchByTag(userId, tag) {
  // 查找所有包含指定标签的元数据
  const metadataList = await ResumeMetadata.findAll({
    where: {
      tags: {
        [Op.contains]: [tag] // PostgreSQL的JSON数组包含操作符
      }
    },
    include: [
      {
        model: ResumeVersion,
        as: 'resume',
        attributes: ['id', 'target_position_id', 'type', 'title', 'created_at', 'updated_at'],
        include: [
          {
            model: TargetPosition,
            as: 'targetPosition',
            attributes: ['id', 'user_id', 'name', 'description'],
            where: { user_id: userId } // 只返回该用户的简历
          }
        ]
      }
    ]
  });

  // 格式化返回结果
  return metadataList.map((metadata) => ({
    metadata: {
      id: metadata.id,
      resume_id: metadata.resume_id,
      notes: metadata.notes,
      tags: metadata.tags,
      created_at: metadata.created_at,
      updated_at: metadata.updated_at
    },
    resume: {
      id: metadata.resume.id,
      type: metadata.resume.type,
      title: metadata.resume.title,
      created_at: metadata.resume.created_at,
      updated_at: metadata.resume.updated_at
    },
    targetPosition: {
      id: metadata.resume.targetPosition.id,
      name: metadata.resume.targetPosition.name,
      description: metadata.resume.targetPosition.description
    }
  }));
}

module.exports = {
  getMetadataByResumeId,
  updateNotes,
  addTag,
  removeTag,
  updateTags,
  searchByTag
};
