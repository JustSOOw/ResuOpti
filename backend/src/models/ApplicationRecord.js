/**
 * ApplicationRecord模型定义
 * 记录简历的投递历史和状态跟踪
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const ApplicationRecord = sequelize.define(
  'ApplicationRecord',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '投递记录唯一标识'
    },
    resume_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'resume_versions',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: '关联的简历版本ID'
    },
    company_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '目标公司名称'
    },
    position_title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '具体职位名称'
    },
    apply_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '投递日期'
    },
    status: {
      type: DataTypes.ENUM('已投递', '面试邀请', '已拒绝', '已录用'),
      allowNull: false,
      defaultValue: '已投递',
      comment: '当前状态'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '投递备注,面试反馈等'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '记录创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '最后更新时间'
    }
  },
  {
    tableName: 'application_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    comment: '投递记录表',
    validate: {
      // 验证投递日期不能为未来日期
      applyDateValidation() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const applyDate = new Date(this.apply_date);
        if (applyDate > today) {
          throw new Error('投递日期不能为未来日期');
        }
      }
    },
    indexes: [
      {
        fields: ['resume_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['apply_date']
      }
    ]
  }
);

module.exports = ApplicationRecord;
