/**
 * 模型关系配置和导出
 * 配置所有模型之间的关联关系
 */

const { sequelize } = require('../config');
const User = require('./User');
const TargetPosition = require('./TargetPosition');
const ResumeVersion = require('./ResumeVersion');
const ResumeMetadata = require('./ResumeMetadata');
const ApplicationRecord = require('./ApplicationRecord');

// 配置模型关系

// User -> TargetPosition (一对多)
User.hasMany(TargetPosition, {
  foreignKey: 'user_id',
  as: 'targetPositions',
  onDelete: 'CASCADE'
});
TargetPosition.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// TargetPosition -> ResumeVersion (一对多)
TargetPosition.hasMany(ResumeVersion, {
  foreignKey: 'target_position_id',
  as: 'resumes',
  onDelete: 'CASCADE'
});
ResumeVersion.belongsTo(TargetPosition, {
  foreignKey: 'target_position_id',
  as: 'targetPosition'
});

// ResumeVersion -> ResumeMetadata (一对一)
ResumeVersion.hasOne(ResumeMetadata, {
  foreignKey: 'resume_id',
  as: 'metadata',
  onDelete: 'CASCADE'
});
ResumeMetadata.belongsTo(ResumeVersion, {
  foreignKey: 'resume_id',
  as: 'resume'
});

// ResumeVersion -> ApplicationRecord (一对多)
ResumeVersion.hasMany(ApplicationRecord, {
  foreignKey: 'resume_id',
  as: 'applications',
  onDelete: 'CASCADE'
});
ApplicationRecord.belongsTo(ResumeVersion, {
  foreignKey: 'resume_id',
  as: 'resume'
});

// 导出所有模型
module.exports = {
  sequelize,
  User,
  TargetPosition,
  ResumeVersion,
  ResumeMetadata,
  ApplicationRecord
};
