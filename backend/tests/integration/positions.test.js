/**
 * 目标岗位管理集成测试
 * 测试目标岗位CRUD操作的完整集成测试
 *
 * 测试场景:
 * 1. 创建岗位测试（包括验证、边界情况）
 * 2. 查询岗位测试（单个、列表、权限）
 * 3. 更新岗位测试（各种更新场景）
 * 4. 删除岗位测试（包括关联简历检查）
 * 5. 完整CRUD流程测试
 * 6. 多用户隔离测试
 */

const { sequelize, User, TargetPosition, ResumeVersion } = require('../../src/models');
const positionService = require('../../src/services/positionService');
const authService = require('../../src/services/authService');

describe('目标岗位管理集成测试', () => {
  let testUser1, testUser2;

  // 数据库连接和测试环境初始化
  beforeAll(async () => {
    // 确保使用test环境
    process.env.NODE_ENV = 'test';

    // 连接数据库
    await sequelize.authenticate();

    // 同步数据库表结构（测试环境）
    await sequelize.sync({ force: true });
  });

  // 每个测试前创建测试用户并清理数据
  beforeEach(async () => {
    // 清理所有测试数据
    await ResumeVersion.destroy({ where: {}, force: true });
    await TargetPosition.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户1
    testUser1 = await authService.register('user1@test.com', 'Test1234');

    // 创建测试用户2
    testUser2 = await authService.register('user2@test.com', 'Test1234');
  });

  // 关闭数据库连接
  afterAll(async () => {
    await sequelize.close();
  });

  // ==================== 创建岗位测试 ====================

  describe('创建岗位测试', () => {
    test('应该成功创建新岗位（仅提供name）', async () => {
      const positionData = {
        name: '前端开发工程师'
      };

      const result = await positionService.createPosition(testUser1.id, positionData.name);

      // 验证返回数据
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.user_id).toBe(testUser1.id);
      expect(result.name).toBe(positionData.name);
      expect(result.description).toBeNull();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();

      // 验证数据已正确保存到数据库
      const savedPosition = await TargetPosition.findByPk(result.id);
      expect(savedPosition).toBeDefined();
      expect(savedPosition.name).toBe(positionData.name);
    });

    test('应该成功创建新岗位（包含description）', async () => {
      const positionData = {
        name: '后端开发工程师',
        description: '专注于Node.js和PostgreSQL的后端开发职位'
      };

      const result = await positionService.createPosition(
        testUser1.id,
        positionData.name,
        positionData.description
      );

      // 验证返回数据
      expect(result.name).toBe(positionData.name);
      expect(result.description).toBe(positionData.description);

      // 验证数据已正确保存
      const savedPosition = await TargetPosition.findByPk(result.id);
      expect(savedPosition.description).toBe(positionData.description);
    });

    test('应该自动trim处理name前后空格', async () => {
      const result = await positionService.createPosition(testUser1.id, '  前端开发工程师  ');

      expect(result.name).toBe('前端开发工程师');
    });

    test('应该自动trim处理description前后空格', async () => {
      const result = await positionService.createPosition(
        testUser1.id,
        '前端开发',
        '  这是一个前端岗位  '
      );

      expect(result.description).toBe('这是一个前端岗位');
    });

    test('应该接受100字符长度的name', async () => {
      const longName = 'a'.repeat(100);

      const result = await positionService.createPosition(testUser1.id, longName);

      expect(result.name).toBe(longName);
      expect(result.name.length).toBe(100);
    });

    test('应该拒绝空字符串name', async () => {
      await expect(positionService.createPosition(testUser1.id, '')).rejects.toThrow(
        '岗位名称不能为空'
      );
    });

    test('应该拒绝仅包含空格的name', async () => {
      await expect(positionService.createPosition(testUser1.id, '   ')).rejects.toThrow(
        '岗位名称不能为空'
      );
    });

    test('应该拒绝超过100字符的name', async () => {
      const tooLongName = 'a'.repeat(101);

      await expect(positionService.createPosition(testUser1.id, tooLongName)).rejects.toThrow(
        '岗位名称长度不能超过100个字符'
      );
    });

    test('应该拒绝同一用户下重复的name', async () => {
      // 先创建一个岗位
      await positionService.createPosition(testUser1.id, '前端开发工程师');

      // 尝试创建重复name的岗位
      await expect(positionService.createPosition(testUser1.id, '前端开发工程师')).rejects.toThrow(
        '该岗位名称已存在'
      );
    });

    test('应该拒绝同一用户下重复的name（trim后相同）', async () => {
      // 先创建一个岗位
      await positionService.createPosition(testUser1.id, '前端开发工程师');

      // 尝试创建trim后相同的岗位
      await expect(
        positionService.createPosition(testUser1.id, '  前端开发工程师  ')
      ).rejects.toThrow('该岗位名称已存在');
    });

    test('应该允许不同用户创建相同name的岗位', async () => {
      // 用户1创建岗位
      const position1 = await positionService.createPosition(testUser1.id, '前端开发工程师');

      // 用户2创建相同name的岗位
      const position2 = await positionService.createPosition(testUser2.id, '前端开发工程师');

      // 两个岗位应该都成功创建
      expect(position1.id).toBeDefined();
      expect(position2.id).toBeDefined();
      expect(position1.id).not.toBe(position2.id);
      expect(position1.name).toBe(position2.name);
    });

    test('应该接受null作为description', async () => {
      const result = await positionService.createPosition(testUser1.id, '前端开发', null);

      expect(result.description).toBeNull();
    });

    test('应该接受空字符串description并转换为null', async () => {
      const result = await positionService.createPosition(testUser1.id, '前端开发', '');

      // 空字符串trim后为空，应转换为null
      expect(result.description).toBeNull();
    });
  });

  // ==================== 查询岗位测试 ====================

  describe('查询岗位测试', () => {
    test('应该返回用户的所有岗位（空列表）', async () => {
      const positions = await positionService.getPositionsByUserId(testUser1.id);

      expect(Array.isArray(positions)).toBe(true);
      expect(positions.length).toBe(0);
    });

    test('应该返回用户的所有岗位（有数据）', async () => {
      // 创建多个岗位
      await positionService.createPosition(testUser1.id, '前端开发');
      await positionService.createPosition(testUser1.id, '后端开发');
      await positionService.createPosition(testUser1.id, '全栈开发');

      const positions = await positionService.getPositionsByUserId(testUser1.id);

      expect(positions.length).toBe(3);
      expect(positions[0].name).toBe('全栈开发'); // 最新创建的在前（降序）
      expect(positions[1].name).toBe('后端开发');
      expect(positions[2].name).toBe('前端开发');
    });

    test('应该按创建时间降序返回岗位列表', async () => {
      // 依次创建岗位
      const pos1 = await positionService.createPosition(testUser1.id, '岗位1');
      await new Promise((resolve) => setTimeout(resolve, 10)); // 确保时间不同
      const pos2 = await positionService.createPosition(testUser1.id, '岗位2');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const pos3 = await positionService.createPosition(testUser1.id, '岗位3');

      const positions = await positionService.getPositionsByUserId(testUser1.id);

      expect(positions[0].id).toBe(pos3.id); // 最新的在前
      expect(positions[1].id).toBe(pos2.id);
      expect(positions[2].id).toBe(pos1.id);
    });

    test('应该成功获取单个岗位详情', async () => {
      const created = await positionService.createPosition(
        testUser1.id,
        '前端开发',
        '专注于React开发'
      );

      const position = await positionService.getPositionById(created.id, testUser1.id);

      expect(position).toBeDefined();
      expect(position.id).toBe(created.id);
      expect(position.name).toBe('前端开发');
      expect(position.description).toBe('专注于React开发');
      expect(position.resumeCount).toBe(0); // 默认包含简历数量
    });

    test('应该正确统计岗位关联的简历数量', async () => {
      // 创建岗位
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      // 创建简历版本
      await ResumeVersion.create({
        target_position_id: position.id,
        type: 'online',
        title: '简历1',
        content: '简历内容1'
      });
      await ResumeVersion.create({
        target_position_id: position.id,
        type: 'online',
        title: '简历2',
        content: '简历内容2'
      });

      const result = await positionService.getPositionById(position.id, testUser1.id, true);

      expect(result.resumeCount).toBe(2);
    });

    test('应该支持不包含简历数量统计', async () => {
      const created = await positionService.createPosition(testUser1.id, '前端开发');

      const position = await positionService.getPositionById(created.id, testUser1.id, false);

      expect(position.resumeCount).toBeUndefined();
    });

    test('应该拒绝获取不存在的岗位', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(positionService.getPositionById(fakeId, testUser1.id)).rejects.toThrow(
        '目标岗位不存在'
      );
    });

    test('应该拒绝访问其他用户的岗位', async () => {
      // 用户1创建岗位
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      // 用户2尝试访问
      await expect(positionService.getPositionById(position.id, testUser2.id)).rejects.toThrow(
        '无权限访问该目标岗位'
      );
    });

    test('应该正确隔离不同用户的岗位列表', async () => {
      // 用户1创建岗位
      await positionService.createPosition(testUser1.id, '用户1岗位1');
      await positionService.createPosition(testUser1.id, '用户1岗位2');

      // 用户2创建岗位
      await positionService.createPosition(testUser2.id, '用户2岗位1');

      // 验证用户1只能看到自己的岗位
      const user1Positions = await positionService.getPositionsByUserId(testUser1.id);
      expect(user1Positions.length).toBe(2);
      expect(user1Positions.every((p) => p.user_id === testUser1.id)).toBe(true);

      // 验证用户2只能看到自己的岗位
      const user2Positions = await positionService.getPositionsByUserId(testUser2.id);
      expect(user2Positions.length).toBe(1);
      expect(user2Positions[0].user_id).toBe(testUser2.id);
    });
  });

  // ==================== 更新岗位测试 ====================

  describe('更新岗位测试', () => {
    test('应该成功更新岗位name', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        name: '高级前端开发'
      });

      expect(updated.name).toBe('高级前端开发');
      expect(updated.id).toBe(position.id);

      // 验证数据库已更新
      const saved = await TargetPosition.findByPk(position.id);
      expect(saved.name).toBe('高级前端开发');
    });

    test('应该成功更新岗位description', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发', '旧描述');

      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        description: '新描述：专注于Vue开发'
      });

      expect(updated.description).toBe('新描述：专注于Vue开发');

      // 验证数据库已更新
      const saved = await TargetPosition.findByPk(position.id);
      expect(saved.description).toBe('新描述：专注于Vue开发');
    });

    test('应该成功同时更新name和description', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发', '旧描述');

      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        name: '全栈开发',
        description: '前后端都精通'
      });

      expect(updated.name).toBe('全栈开发');
      expect(updated.description).toBe('前后端都精通');
    });

    test('应该自动trim更新的name', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        name: '  高级前端开发  '
      });

      expect(updated.name).toBe('高级前端开发');
    });

    test('应该自动trim更新的description', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        description: '  新描述  '
      });

      expect(updated.description).toBe('新描述');
    });

    test('应该允许将description更新为null', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发', '旧描述');

      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        description: null
      });

      expect(updated.description).toBeNull();
    });

    test('应该允许将description更新为空字符串（转为null）', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发', '旧描述');

      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        description: ''
      });

      expect(updated.description).toBeNull();
    });

    test('应该拒绝更新为空name', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      await expect(
        positionService.updatePosition(position.id, testUser1.id, { name: '' })
      ).rejects.toThrow('岗位名称不能为空');
    });

    test('应该拒绝更新为仅包含空格的name', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      await expect(
        positionService.updatePosition(position.id, testUser1.id, { name: '   ' })
      ).rejects.toThrow('岗位名称不能为空');
    });

    test('应该拒绝更新为超过100字符的name', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      const tooLongName = 'a'.repeat(101);

      await expect(
        positionService.updatePosition(position.id, testUser1.id, { name: tooLongName })
      ).rejects.toThrow('岗位名称长度不能超过100个字符');
    });

    test('应该拒绝更新为与其他岗位重复的name', async () => {
      // 创建两个岗位
      const _position1 = await positionService.createPosition(testUser1.id, '前端开发');
      const position2 = await positionService.createPosition(testUser1.id, '后端开发');

      // 尝试将position2的name更新为与position1相同
      await expect(
        positionService.updatePosition(position2.id, testUser1.id, { name: '前端开发' })
      ).rejects.toThrow('该岗位名称已存在');
    });

    test('应该允许更新为相同的name（不变）', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      // 更新为相同的name应该成功
      const updated = await positionService.updatePosition(position.id, testUser1.id, {
        name: '前端开发'
      });

      expect(updated.name).toBe('前端开发');
    });

    test('应该拒绝更新不存在的岗位', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(
        positionService.updatePosition(fakeId, testUser1.id, { name: '新名称' })
      ).rejects.toThrow('目标岗位不存在');
    });

    test('应该拒绝更新其他用户的岗位', async () => {
      // 用户1创建岗位
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      // 用户2尝试更新
      await expect(
        positionService.updatePosition(position.id, testUser2.id, { name: '新名称' })
      ).rejects.toThrow('无权限修改该目标岗位');
    });

    test('应该允许不同用户更新为相同的name', async () => {
      // 用户1创建岗位
      const _position1 = await positionService.createPosition(testUser1.id, '前端开发');

      // 用户2创建并更新岗位
      const position2 = await positionService.createPosition(testUser2.id, '后端开发');

      // 用户2更新为与用户1相同的name，应该成功
      const updated = await positionService.updatePosition(position2.id, testUser2.id, {
        name: '前端开发'
      });

      expect(updated.name).toBe('前端开发');
    });
  });

  // ==================== 删除岗位测试 ====================

  describe('删除岗位测试', () => {
    test('应该成功删除空岗位', async () => {
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      const result = await positionService.deletePosition(position.id, testUser1.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('目标岗位删除成功');
      expect(result.deletedPositionId).toBe(position.id);

      // 验证岗位已从数据库删除
      const deleted = await TargetPosition.findByPk(position.id);
      expect(deleted).toBeNull();
    });

    test('应该拒绝删除不存在的岗位', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(positionService.deletePosition(fakeId, testUser1.id)).rejects.toThrow(
        '目标岗位不存在'
      );
    });

    test('应该拒绝删除其他用户的岗位', async () => {
      // 用户1创建岗位
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      // 用户2尝试删除
      await expect(positionService.deletePosition(position.id, testUser2.id)).rejects.toThrow(
        '无权限删除该目标岗位'
      );
    });

    test('应该拒绝删除包含简历的岗位', async () => {
      // 创建岗位
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      // 创建关联的简历
      await ResumeVersion.create({
        target_position_id: position.id,
        type: 'online',
        title: '测试简历',
        content: '简历内容'
      });

      // 尝试删除
      await expect(positionService.deletePosition(position.id, testUser1.id)).rejects.toThrow(
        /该岗位下还有.*个简历版本，无法删除/
      );
    });

    test('应该在错误消息中显示正确的简历数量', async () => {
      // 创建岗位
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      // 创建3个简历
      await ResumeVersion.create({
        target_position_id: position.id,
        type: 'online',
        title: '简历1',
        content: '内容1'
      });
      await ResumeVersion.create({
        target_position_id: position.id,
        type: 'online',
        title: '简历2',
        content: '内容2'
      });
      await ResumeVersion.create({
        target_position_id: position.id,
        type: 'online',
        title: '简历3',
        content: '内容3'
      });

      // 尝试删除并验证错误消息
      await expect(positionService.deletePosition(position.id, testUser1.id)).rejects.toThrow(
        '该岗位下还有3个简历版本，无法删除'
      );
    });

    test('删除简历后应该可以删除岗位', async () => {
      // 创建岗位和简历
      const position = await positionService.createPosition(testUser1.id, '前端开发');

      const resume = await ResumeVersion.create({
        target_position_id: position.id,
        type: 'online',
        title: '测试简历',
        content: '简历内容'
      });

      // 先删除简历
      await resume.destroy();

      // 再删除岗位应该成功
      const result = await positionService.deletePosition(position.id, testUser1.id);

      expect(result.success).toBe(true);

      // 验证岗位已删除
      const deleted = await TargetPosition.findByPk(position.id);
      expect(deleted).toBeNull();
    });
  });

  // ==================== 完整CRUD流程测试 ====================

  describe('完整CRUD流程测试', () => {
    test('应该完成创建-查询-更新-删除的完整流程', async () => {
      // 1. 创建岗位
      const created = await positionService.createPosition(
        testUser1.id,
        '前端开发工程师',
        '负责前端开发'
      );

      expect(created.id).toBeDefined();
      expect(created.name).toBe('前端开发工程师');

      // 2. 查询岗位详情
      const fetched = await positionService.getPositionById(created.id, testUser1.id);

      expect(fetched.name).toBe('前端开发工程师');
      expect(fetched.description).toBe('负责前端开发');

      // 3. 更新岗位
      const updated = await positionService.updatePosition(created.id, testUser1.id, {
        name: '高级前端开发工程师',
        description: '负责复杂前端架构设计'
      });

      expect(updated.name).toBe('高级前端开发工程师');
      expect(updated.description).toBe('负责复杂前端架构设计');

      // 4. 再次查询验证更新
      const refetched = await positionService.getPositionById(created.id, testUser1.id);

      expect(refetched.name).toBe('高级前端开发工程师');
      expect(refetched.description).toBe('负责复杂前端架构设计');

      // 5. 删除岗位
      const deleteResult = await positionService.deletePosition(created.id, testUser1.id);

      expect(deleteResult.success).toBe(true);

      // 6. 验证删除后无法查询
      await expect(positionService.getPositionById(created.id, testUser1.id)).rejects.toThrow(
        '目标岗位不存在'
      );
    });

    test('应该正确处理多个岗位的复杂操作流程', async () => {
      // 创建多个岗位
      const _pos1 = await positionService.createPosition(testUser1.id, '前端开发');
      const pos2 = await positionService.createPosition(testUser1.id, '后端开发');
      const pos3 = await positionService.createPosition(testUser1.id, '全栈开发');

      // 获取列表验证
      let positions = await positionService.getPositionsByUserId(testUser1.id);
      expect(positions.length).toBe(3);

      // 更新其中一个
      await positionService.updatePosition(pos2.id, testUser1.id, { name: '高级后端开发' });

      // 删除其中一个
      await positionService.deletePosition(pos3.id, testUser1.id);

      // 再次获取列表
      positions = await positionService.getPositionsByUserId(testUser1.id);
      expect(positions.length).toBe(2);
      expect(positions.some((p) => p.name === '前端开发')).toBe(true);
      expect(positions.some((p) => p.name === '高级后端开发')).toBe(true);
      expect(positions.some((p) => p.name === '全栈开发')).toBe(false);
    });
  });

  // ==================== 多用户隔离测试 ====================

  describe('多用户隔离测试', () => {
    test('应该确保不同用户的岗位完全隔离', async () => {
      // 用户1创建岗位
      const user1Pos1 = await positionService.createPosition(testUser1.id, '前端开发');
      const _user1Pos2 = await positionService.createPosition(testUser1.id, '后端开发');

      // 用户2创建岗位
      const user2Pos1 = await positionService.createPosition(testUser2.id, '产品经理');
      const _user2Pos2 = await positionService.createPosition(testUser2.id, '项目经理');

      // 验证用户1只能看到自己的岗位
      const user1Positions = await positionService.getPositionsByUserId(testUser1.id);
      expect(user1Positions.length).toBe(2);
      expect(user1Positions.every((p) => p.user_id === testUser1.id)).toBe(true);
      expect(user1Positions.some((p) => p.name === '前端开发')).toBe(true);
      expect(user1Positions.some((p) => p.name === '后端开发')).toBe(true);

      // 验证用户2只能看到自己的岗位
      const user2Positions = await positionService.getPositionsByUserId(testUser2.id);
      expect(user2Positions.length).toBe(2);
      expect(user2Positions.every((p) => p.user_id === testUser2.id)).toBe(true);
      expect(user2Positions.some((p) => p.name === '产品经理')).toBe(true);
      expect(user2Positions.some((p) => p.name === '项目经理')).toBe(true);

      // 验证用户1无法访问用户2的岗位
      await expect(positionService.getPositionById(user2Pos1.id, testUser1.id)).rejects.toThrow(
        '无权限访问该目标岗位'
      );

      // 验证用户2无法访问用户1的岗位
      await expect(positionService.getPositionById(user1Pos1.id, testUser2.id)).rejects.toThrow(
        '无权限访问该目标岗位'
      );

      // 验证用户1无法更新用户2的岗位
      await expect(
        positionService.updatePosition(user2Pos1.id, testUser1.id, { name: '新名称' })
      ).rejects.toThrow('无权限修改该目标岗位');

      // 验证用户2无法删除用户1的岗位
      await expect(positionService.deletePosition(user1Pos1.id, testUser2.id)).rejects.toThrow(
        '无权限删除该目标岗位'
      );
    });

    test('应该允许不同用户之间相互独立操作', async () => {
      // 用户1和用户2创建同名岗位
      const user1Pos = await positionService.createPosition(testUser1.id, '开发工程师');
      const user2Pos = await positionService.createPosition(testUser2.id, '开发工程师');

      // 用户1更新自己的岗位
      await positionService.updatePosition(user1Pos.id, testUser1.id, {
        description: '用户1的描述'
      });

      // 用户2更新自己的岗位
      await positionService.updatePosition(user2Pos.id, testUser2.id, {
        description: '用户2的描述'
      });

      // 验证各自的岗位没有互相影响
      const user1Updated = await positionService.getPositionById(user1Pos.id, testUser1.id);
      const user2Updated = await positionService.getPositionById(user2Pos.id, testUser2.id);

      expect(user1Updated.description).toBe('用户1的描述');
      expect(user2Updated.description).toBe('用户2的描述');

      // 用户1删除自己的岗位
      await positionService.deletePosition(user1Pos.id, testUser1.id);

      // 验证用户2的岗位仍然存在
      const user2Still = await positionService.getPositionById(user2Pos.id, testUser2.id);
      expect(user2Still).toBeDefined();
      expect(user2Still.name).toBe('开发工程师');
    });
  });
});
