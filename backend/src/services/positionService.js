/**
 * 目标岗位管理服务
 * 提供岗位的CRUD操作和业务逻辑
 */

const { TargetPosition, ResumeVersion } = require('../models');
const { Op } = require('sequelize');

/**
 * 创建目标岗位
 * @param {string} userId - 用户ID
 * @param {string} name - 岗位名称
 * @param {string} description - 岗位描述（可选）
 * @returns {Promise<Object>} 创建的岗位信息
 * @throws {Error} 验证失败或创建失败时抛出错误
 */
async function createPosition(userId, name, description = null) {
  // 验证name长度
  if (!name || name.trim().length === 0) {
    throw new Error('岗位名称不能为空');
  }

  if (name.length > 100) {
    throw new Error('岗位名称长度不能超过100个字符');
  }

  // 检查同一用户下name是否重复
  const existingPosition = await TargetPosition.findOne({
    where: {
      user_id: userId,
      name: name.trim()
    }
  });

  if (existingPosition) {
    throw new Error('该岗位名称已存在');
  }

  // 创建岗位
  const position = await TargetPosition.create({
    user_id: userId,
    name: name.trim(),
    description: description ? description.trim() : null
  });

  return position.toJSON();
}

/**
 * 获取用户的所有目标岗位
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 岗位列表，按创建时间降序排列
 */
async function getPositionsByUserId(userId) {
  const positions = await TargetPosition.findAll({
    where: {
      user_id: userId
    },
    order: [['created_at', 'DESC']],
    attributes: ['id', 'user_id', 'name', 'description', 'created_at', 'updated_at']
  });

  return positions.map(position => position.toJSON());
}

/**
 * 获取单个目标岗位详情
 * @param {string} positionId - 岗位ID
 * @param {string} userId - 用户ID
 * @param {boolean} includeResumeCount - 是否包含关联的简历数量统计（默认true）
 * @returns {Promise<Object>} 岗位详情
 * @throws {Error} 岗位不存在或无权限访问时抛出错误
 */
async function getPositionById(positionId, userId, includeResumeCount = true) {
  // 查找岗位
  const position = await TargetPosition.findOne({
    where: {
      id: positionId
    },
    attributes: ['id', 'user_id', 'name', 'description', 'created_at', 'updated_at']
  });

  // 验证岗位存在性
  if (!position) {
    throw new Error('目标岗位不存在');
  }

  // 验证岗位所有权
  if (position.user_id !== userId) {
    throw new Error('无权限访问该目标岗位');
  }

  const positionData = position.toJSON();

  // 如果需要包含简历数量统计
  if (includeResumeCount) {
    const resumeCount = await ResumeVersion.count({
      where: {
        target_position_id: positionId
      }
    });
    positionData.resumeCount = resumeCount;
  }

  return positionData;
}

/**
 * 更新目标岗位
 * @param {string} positionId - 岗位ID
 * @param {string} userId - 用户ID
 * @param {Object} updateData - 更新数据（包含name和/或description）
 * @returns {Promise<Object>} 更新后的岗位信息
 * @throws {Error} 岗位不存在、无权限或验证失败时抛出错误
 */
async function updatePosition(positionId, userId, updateData) {
  // 查找岗位
  const position = await TargetPosition.findOne({
    where: {
      id: positionId
    }
  });

  // 验证岗位存在性
  if (!position) {
    throw new Error('目标岗位不存在');
  }

  // 验证岗位所有权
  if (position.user_id !== userId) {
    throw new Error('无权限修改该目标岗位');
  }

  // 如果要更新name，验证长度和唯一性
  if (updateData.name !== undefined) {
    const trimmedName = updateData.name.trim();

    if (trimmedName.length === 0) {
      throw new Error('岗位名称不能为空');
    }

    if (trimmedName.length > 100) {
      throw new Error('岗位名称长度不能超过100个字符');
    }

    // 检查更新后的name是否与该用户其他岗位重复
    if (trimmedName !== position.name) {
      const existingPosition = await TargetPosition.findOne({
        where: {
          user_id: userId,
          name: trimmedName,
          id: {
            [Op.ne]: positionId
          }
        }
      });

      if (existingPosition) {
        throw new Error('该岗位名称已存在');
      }
    }

    updateData.name = trimmedName;
  }

  // 如果要更新description，进行trim处理
  if (updateData.description !== undefined) {
    updateData.description = updateData.description ? updateData.description.trim() : null;
  }

  // 执行更新
  await position.update(updateData);

  return position.toJSON();
}

/**
 * 删除目标岗位
 * @param {string} positionId - 岗位ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 删除成功信息
 * @throws {Error} 岗位不存在、无权限或包含简历时抛出错误
 */
async function deletePosition(positionId, userId) {
  // 查找岗位
  const position = await TargetPosition.findOne({
    where: {
      id: positionId
    }
  });

  // 验证岗位存在性
  if (!position) {
    throw new Error('目标岗位不存在');
  }

  // 验证岗位所有权
  if (position.user_id !== userId) {
    throw new Error('无权限删除该目标岗位');
  }

  // 检查该岗位下是否有简历版本
  const resumeCount = await ResumeVersion.count({
    where: {
      target_position_id: positionId
    }
  });

  if (resumeCount > 0) {
    throw new Error(`该岗位下还有${resumeCount}个简历版本，无法删除。请先删除或转移简历版本。`);
  }

  // 执行删除
  await position.destroy();

  return {
    success: true,
    message: '目标岗位删除成功',
    deletedPositionId: positionId
  };
}

module.exports = {
  createPosition,
  getPositionsByUserId,
  getPositionById,
  updatePosition,
  deletePosition
};