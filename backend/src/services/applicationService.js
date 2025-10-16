/**
 * 投递记录管理服务
 * 提供简历投递记录的CRUD操作、统计和查询功能
 * 性能优化：添加缓存、优化统计查询
 */

const { Op } = require('sequelize');
const { ApplicationRecord, ResumeVersion, TargetPosition } = require('../models');
const { statsCache, LRUCache } = require('../utils/cache');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * 创建投递记录
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @param {Object} data - 投递记录数据
 * @param {string} data.companyName - 公司名称
 * @param {string} [data.positionTitle] - 职位名称
 * @param {string} data.applyDate - 投递日期 (YYYY-MM-DD)
 * @param {string} [data.status='已投递'] - 投递状态
 * @param {string} [data.notes] - 备注
 * @returns {Promise<Object>} 创建的投递记录
 * @throws {Error} 简历不存在、无权限、验证失败等错误
 */
async function createApplication(resumeId, userId, data) {
  const { companyName, positionTitle, applyDate, status = '已投递', notes } = data;

  // 验证公司名称长度
  if (!companyName || companyName.trim().length === 0) {
    throw new Error('公司名称不能为空');
  }
  if (companyName.length > 200) {
    throw new Error('公司名称不能超过200个字符');
  }

  // 验证投递日期不能为未来日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const applyDateObj = new Date(applyDate);
  const diffMs = applyDateObj - today;
  if (diffMs > DAY_IN_MS) {
    throw new Error('投递日期不能为未来日期');
  }

  // 验证状态值是否有效
  const validStatuses = ['已投递', '面试邀请', '已拒绝', '已录用'];
  if (status && !validStatuses.includes(status)) {
    throw new Error('无效的投递状态');
  }

  // 验证简历存在性和所有权
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
    throw new Error('无权操作此简历');
  }

  // 创建投递记录
  const application = await ApplicationRecord.create({
    resume_id: resumeId,
    company_name: companyName,
    position_title: positionTitle || null,
    apply_date: applyDate,
    status: status,
    notes: notes || null
  });

  return application;
}

/**
 * 获取指定简历的所有投递记录
 * @param {string} resumeId - 简历版本ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 投递记录列表
 * @throws {Error} 简历不存在或无权限
 */
async function getApplicationsByResumeId(resumeId, userId) {
  // 验证简历存在性和所有权
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
    throw new Error('无权查看此简历的投递记录');
  }

  // 获取该简历的所有投递记录，按投递日期降序排列
  const applications = await ApplicationRecord.findAll({
    where: { resume_id: resumeId },
    order: [
      ['apply_date', 'DESC'],
      ['created_at', 'DESC']
    ]
  });

  return applications;
}

/**
 * 获取用户的所有投递记录（跨所有简历）
 * @param {string} userId - 用户ID
 * @param {Object} [filters={}] - 筛选条件
 * @param {string} [filters.status] - 按状态筛选
 * @param {string} [filters.dateFrom] - 开始日期 (YYYY-MM-DD)
 * @param {string} [filters.dateTo] - 结束日期 (YYYY-MM-DD)
 * @returns {Promise<Array>} 投递记录列表（包含关联的简历和目标岗位信息）
 */
async function getApplicationsByUserId(userId, filters = {}) {
  const { status, dateFrom, dateTo } = filters;

  // 构建查询条件
  const whereClause = {};

  // 状态筛选
  if (status) {
    whereClause.status = status;
  }

  // 日期范围筛选
  if (dateFrom || dateTo) {
    whereClause.apply_date = {};
    if (dateFrom) {
      whereClause.apply_date[Op.gte] = dateFrom;
    }
    if (dateTo) {
      whereClause.apply_date[Op.lte] = dateTo;
    }
  }

  // 查询用户的所有投递记录
  const applications = await ApplicationRecord.findAll({
    where: whereClause,
    include: [
      {
        model: ResumeVersion,
        as: 'resume',
        attributes: ['id', 'title', 'type', 'target_position_id'],
        required: true,
        include: [
          {
            model: TargetPosition,
            as: 'targetPosition',
            attributes: ['id', 'name', 'user_id'],
            where: { user_id: userId }
          }
        ]
      }
    ],
    order: [
      ['apply_date', 'DESC'],
      ['created_at', 'DESC']
    ]
  });

  return applications;
}

/**
 * 获取单个投递记录详情
 * @param {string} applicationId - 投递记录ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 投递记录详情（包含简历和目标岗位信息）
 * @throws {Error} 投递记录不存在或无权限
 */
async function getApplicationById(applicationId, userId) {
  const application = await ApplicationRecord.findByPk(applicationId, {
    include: [
      {
        model: ResumeVersion,
        as: 'resume',
        attributes: ['id', 'title', 'type', 'target_position_id'],
        include: [
          {
            model: TargetPosition,
            as: 'targetPosition',
            attributes: ['id', 'name', 'description', 'user_id']
          }
        ]
      }
    ]
  });

  if (!application) {
    throw new Error('投递记录不存在');
  }

  if (application.resume.targetPosition.user_id !== userId) {
    throw new Error('无权查看此投递记录');
  }

  return application;
}

/**
 * 更新投递记录
 * @param {string} applicationId - 投递记录ID
 * @param {string} userId - 用户ID
 * @param {Object} updateData - 要更新的数据
 * @param {string} [updateData.companyName] - 公司名称
 * @param {string} [updateData.positionTitle] - 职位名称
 * @param {string} [updateData.applyDate] - 投递日期
 * @param {string} [updateData.status] - 投递状态
 * @param {string} [updateData.notes] - 备注
 * @returns {Promise<Object>} 更新后的投递记录
 * @throws {Error} 投递记录不存在、无权限或验证失败
 */
async function updateApplication(applicationId, userId, updateData) {
  // 验证投递记录存在性和所有权
  const application = await ApplicationRecord.findByPk(applicationId, {
    include: [
      {
        model: ResumeVersion,
        as: 'resume',
        include: [
          {
            model: TargetPosition,
            as: 'targetPosition',
            attributes: ['user_id']
          }
        ]
      }
    ]
  });

  if (!application) {
    throw new Error('投递记录不存在');
  }

  if (application.resume.targetPosition.user_id !== userId) {
    throw new Error('无权修改此投递记录');
  }

  // 准备更新数据
  const updates = {};

  // 验证并更新公司名称
  if (updateData.companyName !== undefined) {
    if (!updateData.companyName || updateData.companyName.trim().length === 0) {
      throw new Error('公司名称不能为空');
    }
    if (updateData.companyName.length > 200) {
      throw new Error('公司名称不能超过200个字符');
    }
    updates.company_name = updateData.companyName;
  }

  // 更新职位名称
  if (updateData.positionTitle !== undefined) {
    updates.position_title = updateData.positionTitle || null;
  }

  // 验证并更新投递日期
  if (updateData.applyDate !== undefined) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const applyDateObj = new Date(updateData.applyDate);
    const diffMs = applyDateObj - today;
    if (diffMs > DAY_IN_MS) {
      throw new Error('投递日期不能为未来日期');
    }
    updates.apply_date = updateData.applyDate;
  }

  // 验证并更新状态
  if (updateData.status !== undefined) {
    const validStatuses = ['已投递', '面试邀请', '已拒绝', '已录用'];
    if (!validStatuses.includes(updateData.status)) {
      throw new Error('无效的投递状态');
    }
    updates.status = updateData.status;
  }

  // 更新备注
  if (updateData.notes !== undefined) {
    updates.notes = updateData.notes || null;
  }

  // 执行更新
  await application.update(updates);

  // 重新获取更新后的记录（包含关联数据）
  const updatedApplication = await getApplicationById(applicationId, userId);

  return updatedApplication;
}

/**
 * 删除投递记录
 * @param {string} applicationId - 投递记录ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 删除成功信息
 * @throws {Error} 投递记录不存在或无权限
 */
async function deleteApplication(applicationId, userId) {
  // 验证投递记录存在性和所有权
  const application = await ApplicationRecord.findByPk(applicationId, {
    include: [
      {
        model: ResumeVersion,
        as: 'resume',
        include: [
          {
            model: TargetPosition,
            as: 'targetPosition',
            attributes: ['user_id']
          }
        ]
      }
    ]
  });

  if (!application) {
    throw new Error('投递记录不存在');
  }

  if (application.resume.targetPosition.user_id !== userId) {
    throw new Error('无权删除此投递记录');
  }

  // 删除投递记录
  await application.destroy();

  return {
    message: '投递记录删除成功',
    deletedId: applicationId
  };
}

/**
 * 获取用户的投递统计信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 统计信息对象
 * @returns {number} total - 总投递数
 * @returns {Object} byStatus - 各状态的数量统计
 * @returns {string|null} latestApplyDate - 最近投递日期
 * @returns {string|null} firstApplyDate - 首次投递日期
 */
async function getApplicationStats(userId) {
  const cacheKey = LRUCache.generateKey('stats', 'applications', userId);

  // 使用缓存包装函数（统计数据缓存30秒）
  return statsCache.wrap(cacheKey, async () => {
    // 优化：只查询需要的字段，减少数据传输
    const applications = await ApplicationRecord.findAll({
      attributes: ['status', 'apply_date'], // 只查询统计需要的字段
      include: [
        {
          model: ResumeVersion,
          as: 'resume',
          attributes: [], // 不需要简历的任何字段
          required: true,
          include: [
            {
              model: TargetPosition,
              as: 'targetPosition',
              attributes: [], // 不需要岗位的任何字段
              where: { user_id: userId }
            }
          ]
        }
      ],
      order: [['apply_date', 'DESC']],
      raw: true // 使用raw模式提高性能
    });

    // 计算总数
    const total = applications.length;

    // 按状态统计
    const byStatus = {
      已投递: 0,
      面试邀请: 0,
      已拒绝: 0,
      已录用: 0
    };

    applications.forEach((app) => {
      if (byStatus[app.status] !== undefined) {
        byStatus[app.status]++;
      }
    });

    // 获取最近和首次投递日期
    const latestApplyDate = applications.length > 0 ? applications[0].apply_date : null;

    const firstApplyDate =
      applications.length > 0 ? applications[applications.length - 1].apply_date : null;

    return {
      total,
      byStatus,
      latestApplyDate,
      firstApplyDate
    };
  });
}

/**
 * 清除用户的统计缓存
 * @param {string} userId - 用户ID
 */
function clearStatsCache(userId) {
  const cacheKey = LRUCache.generateKey('stats', 'applications', userId);
  statsCache.delete(cacheKey);
}

module.exports = {
  createApplication,
  getApplicationsByResumeId,
  getApplicationsByUserId,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getApplicationStats,
  clearStatsCache
};
