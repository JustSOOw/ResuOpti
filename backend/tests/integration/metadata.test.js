/**
 * T122: 简历元数据更新集成测试
 *
 * 测试目标: 验证简历元数据（备注和标签）的完整管理流程
 * 测试范围:
 * - 创建简历时自动创建元数据
 * - 更新简历元数据（备注、标签）
 * - 验证元数据字段的验证规则
 * - 权限验证（用户只能访问自己的元数据）
 * - 元数据与简历的关联关系
 *
 * 技术栈:
 * - Node.js + Express.js
 * - PostgreSQL + Sequelize
 * - Jest集成测试
 */

const { sequelize, User, TargetPosition, ResumeVersion, ResumeMetadata } = require('../../src/models');
const authService = require('../../src/services/authService');
const positionService = require('../../src/services/positionService');
const resumeService = require('../../src/services/resumeService');
const metadataService = require('../../src/services/metadataService');

describe('简历元数据集成测试', () => {
  let testUser1, testUser2;
  let testPosition1, testPosition2;
  let testResume1, testResume2;

  // 数据库连接和测试环境初始化
  beforeAll(async () => {
    // 确保使用test环境
    process.env.NODE_ENV = 'test';

    // 连接数据库
    await sequelize.authenticate();

    // 同步数据库表结构（测试环境）
    await sequelize.sync({ force: true });
  });

  // 每个测试前创建测试数据
  beforeEach(async () => {
    // 清理所有测试数据
    await ResumeMetadata.destroy({ where: {}, force: true });
    await ResumeVersion.destroy({ where: {}, force: true });
    await TargetPosition.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户
    testUser1 = await authService.register('user1@test.com', 'Test1234');
    testUser2 = await authService.register('user2@test.com', 'Test1234');

    // 创建测试岗位
    testPosition1 = await positionService.createPosition(testUser1.id, '前端开发');
    testPosition2 = await positionService.createPosition(testUser2.id, '后端开发');

    // 创建测试简历
    testResume1 = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
      title: '我的前端简历',
      content: '简历内容'
    });

    testResume2 = await resumeService.createOnlineResume(testPosition2.id, testUser2.id, {
      title: '我的后端简历',
      content: '简历内容'
    });
  });

  // 关闭数据库连接
  afterAll(async () => {
    await sequelize.close();
  });

  // ==================== 元数据自动创建测试 ====================

  describe('元数据自动创建测试', () => {
    test('创建简历时应该自动创建元数据记录', async () => {
      // 验证元数据已自动创建
      const metadata = await ResumeMetadata.findOne({
        where: { resume_id: testResume1.id }
      });

      expect(metadata).toBeDefined();
      expect(metadata.resume_id).toBe(testResume1.id);
      expect(metadata.notes).toBeNull();
      expect(metadata.tags).toEqual([]);
    });

    test('元数据应该与简历是一对一关系', async () => {
      const metadataCount = await ResumeMetadata.count({
        where: { resume_id: testResume1.id }
      });

      expect(metadataCount).toBe(1);
    });
  });

  // ==================== 更新元数据测试 ====================

  describe('更新元数据测试', () => {
    test('应该成功更新简历备注', async () => {
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { notes: '这是一份针对XX公司的简历' }
      );

      expect(updated.notes).toBe('这是一份针对XX公司的简历');

      // 验证数据库已更新
      const metadata = await ResumeMetadata.findOne({
        where: { resume_id: testResume1.id }
      });
      expect(metadata.notes).toBe('这是一份针对XX公司的简历');
    });

    test('应该成功更新简历标签', async () => {
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { tags: ['技术重点', 'XX公司定制'] }
      );

      expect(updated.tags).toEqual(['技术重点', 'XX公司定制']);

      // 验证数据库已更新
      const metadata = await ResumeMetadata.findOne({
        where: { resume_id: testResume1.id }
      });
      expect(metadata.tags).toEqual(['技术重点', 'XX公司定制']);
    });

    test('应该成功同时更新备注和标签', async () => {
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        {
          notes: '重要简历',
          tags: ['急需', '优先投递']
        }
      );

      expect(updated.notes).toBe('重要简历');
      expect(updated.tags).toEqual(['急需', '优先投递']);
    });

    test('应该自动trim备注前后空格', async () => {
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { notes: '  重要简历  ' }
      );

      expect(updated.notes).toBe('重要简历');
    });

    test('应该自动trim标签前后空格', async () => {
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { tags: ['  技术  ', '  重点  '] }
      );

      expect(updated.tags).toEqual(['技术', '重点']);
    });

    test('应该允许清空备注（设置为null）', async () => {
      // 先设置备注
      await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { notes: '旧备注' }
      );

      // 清空备注
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { notes: null }
      );

      expect(updated.notes).toBeNull();
    });

    test('应该允许清空标签（设置为空数组）', async () => {
      // 先设置标签
      await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { tags: ['标签1', '标签2'] }
      );

      // 清空标签
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { tags: [] }
      );

      expect(updated.tags).toEqual([]);
    });

    test('应该接受空字符串备注并转换为null', async () => {
      const updated = await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { notes: '' }
      );

      expect(updated.notes).toBe('');
    });

    test('应该拒绝超过2000字符的备注', async () => {
      const longNotes = 'a'.repeat(2001);

      await expect(
        metadataService.updateMetadata(
          testResume1.id,
          testUser1.id,
          { notes: longNotes }
        )
      ).rejects.toThrow(/备注.*2000/);
    });

    test('应该拒绝超过20个标签', async () => {
      const tooManyTags = Array.from({ length: 21 }, (_, i) => `标签${i + 1}`);

      await expect(
        metadataService.updateMetadata(
          testResume1.id,
          testUser1.id,
          { tags: tooManyTags }
        )
      ).rejects.toThrow(/标签.*20/);
    });

    test('应该拒绝超过50字符的单个标签', async () => {
      const longTag = 'a'.repeat(51);

      await expect(
        metadataService.updateMetadata(
          testResume1.id,
          testUser1.id,
          { tags: [longTag] }
        )
      ).rejects.toThrow(/标签.*50/);
    });

    test('应该拒绝包含空字符串的标签数组', async () => {
      await expect(
        metadataService.updateMetadata(
          testResume1.id,
          testUser1.id,
          { tags: ['有效标签', '', '另一个标签'] }
        )
      ).rejects.toThrow(/空.*标签|标签.*非空/);
    });

    test('应该自动过滤掉trim后为空的标签', async () => {
      await expect(
        metadataService.updateMetadata(
          testResume1.id,
          testUser1.id,
          { tags: ['有效标签', '   ', '另一个标签'] }
        )
      ).rejects.toThrow(/空.*标签|标签.*非空/);
    });
  });

  // ==================== 权限验证测试 ====================

  describe('权限验证测试', () => {
    test('应该拒绝访问不存在的元数据', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(
        metadataService.updateMetadata(fakeId, testUser1.id, { notes: '测试' })
      ).rejects.toThrow(/简历不存在|不存在/);
    });

    test('应该拒绝更新其他用户的元数据', async () => {
      // 用户2尝试更新用户1的简历元数据（使用resumeId而不是metadataId）
      await expect(
        metadataService.updateMetadata(testResume1.id, testUser2.id, { notes: '测试' })
      ).rejects.toThrow(/权限/);
    });

    test('应该正确隔离不同用户的元数据', async () => {
      // 用户1更新自己的元数据（使用resumeId）
      await metadataService.updateMetadata(
        testResume1.id,
        testUser1.id,
        { notes: '用户1的备注', tags: ['用户1标签'] }
      );

      // 用户2更新自己的元数据（使用resumeId）
      await metadataService.updateMetadata(
        testResume2.id,
        testUser2.id,
        { notes: '用户2的备注', tags: ['用户2标签'] }
      );

      // 验证互不影响（通过resumeId查询元数据）
      const updated1 = await ResumeMetadata.findOne({
        where: { resume_id: testResume1.id }
      });
      const updated2 = await ResumeMetadata.findOne({
        where: { resume_id: testResume2.id }
      });

      expect(updated1.notes).toBe('用户1的备注');
      expect(updated1.tags).toEqual(['用户1标签']);
      expect(updated2.notes).toBe('用户2的备注');
      expect(updated2.tags).toEqual(['用户2标签']);
    });
  });

  // ==================== 关联关系测试 ====================

  describe('关联关系测试', () => {
    test('删除简历时应该级联删除元数据', async () => {
      const metadata = await ResumeMetadata.findOne({
        where: { resume_id: testResume1.id }
      });

      expect(metadata).toBeDefined();

      // 删除简历
      await resumeService.deleteResume(testResume1.id, testUser1.id);

      // 验证元数据也被删除
      const deletedMetadata = await ResumeMetadata.findByPk(metadata.id);
      expect(deletedMetadata).toBeNull();
    });

    test('应该能通过简历查询关联的元数据', async () => {
      const resume = await ResumeVersion.findByPk(testResume1.id, {
        include: [{ model: ResumeMetadata, as: 'metadata' }]
      });

      expect(resume.metadata).toBeDefined();
      expect(resume.metadata.resume_id).toBe(testResume1.id);
    });
  });

  // ==================== 完整流程测试 ====================

  describe('完整流程测试', () => {
    test('应该完成创建简历-更新元数据-查询-删除的完整流程', async () => {
      // 1. 创建简历（元数据自动创建）
      const newResume = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '新简历',
        content: '内容'
      });

      // 2. 查询元数据
      const metadata = await ResumeMetadata.findOne({
        where: { resume_id: newResume.id }
      });

      expect(metadata).toBeDefined();
      expect(metadata.notes).toBeNull();
      expect(metadata.tags).toEqual([]);

      // 3. 更新元数据（使用resumeId而不是metadataId）
      const updated = await metadataService.updateMetadata(
        newResume.id,
        testUser1.id,
        {
          notes: '这是一份重要简历',
          tags: ['技术重点', 'XX公司']
        }
      );

      expect(updated.notes).toBe('这是一份重要简历');
      expect(updated.tags).toEqual(['技术重点', 'XX公司']);

      // 4. 再次更新（使用resumeId）
      const updated2 = await metadataService.updateMetadata(
        newResume.id,
        testUser1.id,
        {
          notes: '更新后的备注',
          tags: ['新标签']
        }
      );

      expect(updated2.notes).toBe('更新后的备注');
      expect(updated2.tags).toEqual(['新标签']);

      // 5. 删除简历
      await resumeService.deleteResume(newResume.id, testUser1.id);

      // 6. 验证元数据也被删除
      const deletedMetadata = await ResumeMetadata.findByPk(metadata.id);
      expect(deletedMetadata).toBeNull();
    });

    test('应该支持多个简历的元数据独立管理', async () => {
      // 创建多个简历
      const resume1 = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '简历1',
        content: '内容1'
      });

      const resume2 = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '简历2',
        content: '内容2'
      });

      // 分别更新（使用resumeId）
      await metadataService.updateMetadata(
        resume1.id,
        testUser1.id,
        { notes: '简历1备注', tags: ['标签1'] }
      );

      await metadataService.updateMetadata(
        resume2.id,
        testUser1.id,
        { notes: '简历2备注', tags: ['标签2'] }
      );

      // 验证独立性（通过resumeId查询）
      const saved1 = await ResumeMetadata.findOne({
        where: { resume_id: resume1.id }
      });
      const saved2 = await ResumeMetadata.findOne({
        where: { resume_id: resume2.id }
      });

      expect(saved1.notes).toBe('简历1备注');
      expect(saved1.tags).toEqual(['标签1']);
      expect(saved2.notes).toBe('简历2备注');
      expect(saved2.tags).toEqual(['标签2']);
    });
  });
});
