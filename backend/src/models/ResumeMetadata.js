/**
 * ResumeMetadata模型定义
 * 存储简历版本的附加信息,包括备注和自定义标签
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const ResumeMetadata = sequelize.define(
  'ResumeMetadata',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '元数据唯一标识'
    },
    resume_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'resume_versions',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: '所属简历版本ID'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户备注,支持富文本'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: '自定义标签数组,如["技术重点", "XX公司定制"]'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '最后更新时间'
    }
  },
  {
    tableName: 'resume_metadata',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    comment: '简历元数据表',
    validate: {
      // 验证备注长度
      notesTooLong() {
        if (this.notes && this.notes.length > 2000) {
          throw new Error('备注长度不能超过2000字符');
        }
      },
      // 验证标签数量和格式
      tagsValidation() {
        if (!Array.isArray(this.tags)) {
          throw new Error('标签必须是数组格式');
        }
        if (this.tags.length > 20) {
          throw new Error('标签数量不能超过20个');
        }
        for (const tag of this.tags) {
          if (typeof tag !== 'string' || tag.length > 50) {
            throw new Error('每个标签长度不能超过50字符');
          }
        }
      }
    }
  }
);

module.exports = ResumeMetadata;
