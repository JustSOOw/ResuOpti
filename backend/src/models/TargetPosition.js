/**
 * TargetPosition模型定义
 * 用户创建的简历分类,按求职方向组织简历版本
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const TargetPosition = sequelize.define(
  'TargetPosition',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '岗位分类唯一标识'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: '所属用户ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '岗位名称,如"前端开发"、"产品经理"'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '岗位描述或备注'
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
    tableName: 'target_positions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    comment: '目标岗位表',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'name'],
        name: 'unique_user_position_name'
      }
    ]
  }
);

module.exports = TargetPosition;
