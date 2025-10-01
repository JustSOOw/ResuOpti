/**
 * positionService 单元测试
 * 测试目标岗位管理服务的各项功能
 */

const positionService = require('../../../src/services/positionService');
const { TargetPosition, ResumeVersion } = require('../../../src/models');

// Mock 依赖
jest.mock('../../../src/models');
jest.mock('../../../src/utils/cache', () => ({
  positionCache: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    wrap: jest.fn((key, fn) => fn())
  },
  LRUCache: {
    generateKey: jest.fn((...args) => args.join(':'))
  }
}));

describe('positionService - 目标岗位管理服务', () => {
  // 每个测试前清除所有 mock
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPosition - 创建目标岗位', () => {
    test('应该成功创建新岗位', async () => {
      // 准备测试数据
      const userId = 'user-123';
      const name = '前端工程师';
      const description = '负责前端开发';
      const createdPosition = {
        id: 'position-123',
        user_id: userId,
        name: name,
        description: description,
        created_at: new Date(),
        updated_at: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 'position-123',
          user_id: userId,
          name: name,
          description: description
        })
      };

      // Mock 依赖
      TargetPosition.findOne.mockResolvedValue(null); // 名称不存在
      TargetPosition.create.mockResolvedValue(createdPosition);

      // 执行测试
      const result = await positionService.createPosition(userId, name, description);

      // 验证结果
      expect(TargetPosition.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, name: name }
      });
      expect(TargetPosition.create).toHaveBeenCalledWith({
        user_id: userId,
        name: name,
        description: description
      });
      expect(result).toEqual({
        id: 'position-123',
        user_id: userId,
        name: name,
        description: description
      });
    });

    test('当岗位名称为空时应该抛出错误', async () => {
      // 执行测试并验证错误
      await expect(positionService.createPosition('user-123', '', 'desc')).rejects.toThrow(
        '岗位名称不能为空'
      );
      await expect(positionService.createPosition('user-123', '   ', 'desc')).rejects.toThrow(
        '岗位名称不能为空'
      );
    });

    test('当岗位名称超过100字符时应该抛出错误', async () => {
      const longName = 'a'.repeat(101);
      await expect(positionService.createPosition('user-123', longName)).rejects.toThrow(
        '岗位名称长度不能超过100个字符'
      );
    });

    test('当岗位名称已存在时应该抛出错误', async () => {
      // Mock 名称已存在
      TargetPosition.findOne.mockResolvedValue({
        id: 'existing-position',
        name: '前端工程师'
      });

      // 执行测试并验证错误
      await expect(positionService.createPosition('user-123', '前端工程师')).rejects.toThrow(
        '该岗位名称已存在'
      );
    });

    test('应该自动 trim 岗位名称和描述', async () => {
      const createdPosition = {
        toJSON: jest.fn().mockReturnValue({ id: 'position-123' })
      };
      TargetPosition.findOne.mockResolvedValue(null);
      TargetPosition.create.mockResolvedValue(createdPosition);

      await positionService.createPosition('user-123', '  前端工程师  ', '  描述  ');

      expect(TargetPosition.create).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: '前端工程师',
        description: '描述'
      });
    });
  });

  describe('getPositionsByUserId - 获取用户的所有岗位', () => {
    test('应该返回用户的所有岗位列表', async () => {
      // 准备测试数据
      const userId = 'user-123';
      const positions = [
        {
          id: 'position-1',
          user_id: userId,
          name: '前端工程师',
          toJSON: jest.fn().mockReturnValue({ id: 'position-1', name: '前端工程师' })
        },
        {
          id: 'position-2',
          user_id: userId,
          name: '后端工程师',
          toJSON: jest.fn().mockReturnValue({ id: 'position-2', name: '后端工程师' })
        }
      ];

      // Mock 依赖
      TargetPosition.findAll.mockResolvedValue(positions);

      // 执行测试
      const result = await positionService.getPositionsByUserId(userId);

      // 验证结果
      expect(TargetPosition.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        attributes: ['id', 'user_id', 'name', 'description', 'created_at', 'updated_at']
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'position-1', name: '前端工程师' });
    });

    test('当用户没有岗位时应该返回空数组', async () => {
      TargetPosition.findAll.mockResolvedValue([]);

      const result = await positionService.getPositionsByUserId('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getPositionById - 获取单个岗位详情', () => {
    test('应该返回岗位详情（包含简历数量）', async () => {
      // 准备测试数据
      const positionId = 'position-123';
      const userId = 'user-123';
      const position = {
        id: positionId,
        user_id: userId,
        name: '前端工程师',
        description: '负责前端开发',
        toJSON: jest.fn().mockReturnValue({
          id: positionId,
          user_id: userId,
          name: '前端工程师',
          description: '负责前端开发'
        })
      };

      // Mock 依赖
      TargetPosition.findOne.mockResolvedValue(position);
      ResumeVersion.count.mockResolvedValue(5); // 5个简历

      // 执行测试
      const result = await positionService.getPositionById(positionId, userId);

      // 验证结果
      expect(TargetPosition.findOne).toHaveBeenCalledWith({
        where: { id: positionId },
        attributes: ['id', 'user_id', 'name', 'description', 'created_at', 'updated_at']
      });
      expect(ResumeVersion.count).toHaveBeenCalledWith({
        where: { target_position_id: positionId }
      });
      expect(result.resumeCount).toBe(5);
    });

    test('应该能够不包含简历数量统计', async () => {
      const position = {
        id: 'position-123',
        user_id: 'user-123',
        toJSON: jest.fn().mockReturnValue({ id: 'position-123' })
      };
      TargetPosition.findOne.mockResolvedValue(position);

      const result = await positionService.getPositionById('position-123', 'user-123', false);

      expect(ResumeVersion.count).not.toHaveBeenCalled();
      expect(result.resumeCount).toBeUndefined();
    });

    test('当岗位不存在时应该抛出错误', async () => {
      TargetPosition.findOne.mockResolvedValue(null);

      await expect(positionService.getPositionById('nonexistent', 'user-123')).rejects.toThrow(
        '目标岗位不存在'
      );
    });

    test('当用户无权限访问岗位时应该抛出错误', async () => {
      const position = {
        id: 'position-123',
        user_id: 'other-user'
      };
      TargetPosition.findOne.mockResolvedValue(position);

      await expect(positionService.getPositionById('position-123', 'user-123')).rejects.toThrow(
        '无权限访问该目标岗位'
      );
    });
  });

  describe('updatePosition - 更新岗位', () => {
    test('应该成功更新岗位名称和描述', async () => {
      // 准备测试数据
      const positionId = 'position-123';
      const userId = 'user-123';
      const position = {
        id: positionId,
        user_id: userId,
        name: '前端工程师',
        description: '旧描述',
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: positionId,
          name: '高级前端工程师',
          description: '新描述'
        })
      };

      // Mock 依赖
      TargetPosition.findByPk.mockResolvedValue(position);

      // 执行测试
      const updateData = { name: '高级前端工程师', description: '新描述' };
      const result = await positionService.updatePosition(positionId, userId, updateData);

      // 验证结果
      expect(position.update).toHaveBeenCalledWith({
        name: '高级前端工程师',
        description: '新描述'
      });
      expect(result.name).toBe('高级前端工程师');
    });

    test('当岗位不存在时应该抛出错误', async () => {
      TargetPosition.findByPk.mockResolvedValue(null);

      await expect(
        positionService.updatePosition('nonexistent', 'user-123', { name: '新名称' })
      ).rejects.toThrow('目标岗位不存在');
    });

    test('当用户无权限修改岗位时应该抛出错误', async () => {
      const position = {
        id: 'position-123',
        user_id: 'other-user'
      };
      TargetPosition.findByPk.mockResolvedValue(position);

      await expect(
        positionService.updatePosition('position-123', 'user-123', { name: '新名称' })
      ).rejects.toThrow('无权限修改该目标岗位');
    });

    test('当新名称为空时应该抛出错误', async () => {
      const position = {
        id: 'position-123',
        user_id: 'user-123'
      };
      TargetPosition.findByPk.mockResolvedValue(position);

      await expect(
        positionService.updatePosition('position-123', 'user-123', { name: '  ' })
      ).rejects.toThrow('岗位名称不能为空');
    });

    test('当新名称超过100字符时应该抛出错误', async () => {
      const position = {
        id: 'position-123',
        user_id: 'user-123'
      };
      TargetPosition.findByPk.mockResolvedValue(position);
      const longName = 'a'.repeat(101);

      await expect(
        positionService.updatePosition('position-123', 'user-123', { name: longName })
      ).rejects.toThrow('岗位名称长度不能超过100个字符');
    });

    test('当新名称与其他岗位重复时应该抛出错误', async () => {
      const position = {
        id: 'position-123',
        user_id: 'user-123',
        name: '前端工程师'
      };
      TargetPosition.findByPk.mockResolvedValue(position);
      TargetPosition.findOne.mockResolvedValue({ id: 'other-position' }); // 发现重复

      await expect(
        positionService.updatePosition('position-123', 'user-123', { name: '后端工程师' })
      ).rejects.toThrow('该岗位名称已存在');
    });
  });

  describe('deletePosition - 删除岗位', () => {
    test('应该成功删除岗位', async () => {
      // 准备测试数据
      const positionId = 'position-123';
      const userId = 'user-123';
      const position = {
        id: positionId,
        user_id: userId,
        destroy: jest.fn().mockResolvedValue(true)
      };

      // Mock 依赖
      TargetPosition.findByPk.mockResolvedValue(position);
      ResumeVersion.count.mockResolvedValue(0); // 没有简历

      // 执行测试
      const result = await positionService.deletePosition(positionId, userId);

      // 验证结果
      expect(ResumeVersion.count).toHaveBeenCalledWith({
        where: { target_position_id: positionId }
      });
      expect(position.destroy).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: '目标岗位删除成功',
        deletedPositionId: positionId
      });
    });

    test('当岗位不存在时应该抛出错误', async () => {
      TargetPosition.findByPk.mockResolvedValue(null);

      await expect(positionService.deletePosition('nonexistent', 'user-123')).rejects.toThrow(
        '目标岗位不存在'
      );
    });

    test('当用户无权限删除岗位时应该抛出错误', async () => {
      const position = {
        id: 'position-123',
        user_id: 'other-user'
      };
      TargetPosition.findByPk.mockResolvedValue(position);

      await expect(positionService.deletePosition('position-123', 'user-123')).rejects.toThrow(
        '无权限删除该目标岗位'
      );
    });

    test('当岗位下有简历时应该抛出错误', async () => {
      const position = {
        id: 'position-123',
        user_id: 'user-123'
      };
      TargetPosition.findByPk.mockResolvedValue(position);
      ResumeVersion.count.mockResolvedValue(3); // 有3个简历

      await expect(positionService.deletePosition('position-123', 'user-123')).rejects.toThrow(
        '该岗位下还有3个简历版本，无法删除'
      );
    });
  });
});
