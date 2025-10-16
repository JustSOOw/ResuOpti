/**
 * ResumeVersion模型定义
 * 存储具体的简历实例,支持文件上传和在线创建两种类型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const ResumeVersion = sequelize.define(
  'ResumeVersion',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '简历版本唯一标识'
    },
    target_position_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'target_positions',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: '所属目标岗位ID'
    },
    type: {
      type: DataTypes.ENUM('file', 'online'),
      allowNull: false,
      comment: '简历类型:file=上传文件,online=在线创建'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '简历标题,用户可自定义'
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '文件存储路径(type=file时必填)'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '原始文件名'
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小(字节)'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '富文本内容(type=online时必填)'
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
    tableName: 'resume_versions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    comment: '简历版本表',
    validate: {
      // 验证file类型必须有file_path,online类型必须有content
      typeContentValidation() {
        if (this.type === 'file' && !this.file_path) {
          throw new Error('文件类型简历必须有文件路径');
        }
        if (this.type === 'online' && (this.content === null || this.content === undefined)) {
          throw new Error('在线类型简历必须有内容');
        }
      }
    }
  }
);

module.exports = ResumeVersion;
