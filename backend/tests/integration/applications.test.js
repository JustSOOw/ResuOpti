/**
 * T123: 投递记录管理集成测试
 *
 * 测试目标: 验证简历投递记录管理的完整流程
 * 测试范围:
 * - 创建投递记录
 * - 查询投递记录（按简历、按用户、按ID）
 * - 更新投递记录（状态、公司、日期、备注）
 * - 删除投递记录
 * - 权限验证（用户只能操作自己的投递记录）
 * - 数据验证（公司名称、日期、状态）
 * - 统计功能（总数、按状态统计、日期范围）
 * - 筛选功能（按状态、日期范围筛选）
 *
 * 技术栈:
 * - Node.js + Express.js
 * - PostgreSQL + Sequelize
 * - Jest集成测试
 */

const {
  sequelize,
  User,
  TargetPosition,
  ResumeVersion,
  ApplicationRecord
} = require('../../src/models');
const authService = require('../../src/services/authService');
const positionService = require('../../src/services/positionService');
const resumeService = require('../../src/services/resumeService');
const applicationService = require('../../src/services/applicationService');

describe('投递记录管理集成测试', () => {
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
    await ApplicationRecord.destroy({ where: {}, force: true });
    await ResumeVersion.destroy({ where: {}, force: true });
    await TargetPosition.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户
    testUser1 = await authService.register('user1@test.com', 'Test1234');
    testUser2 = await authService.register('user2@test.com', 'Test1234');

    // 创建测试岗位
    testPosition1 = await positionService.createPosition(testUser1.id, '前端开发工程师');
    testPosition2 = await positionService.createPosition(testUser2.id, '后端开发工程师');

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

  // ==================== 创建投递记录测试 ====================

  describe('创建投递记录测试', () => {
    test('应该成功创建完整的投递记录', async () => {
      const applicationData = {
        companyName: '阿里巴巴',
        positionTitle: '前端开发',
        applyDate: '2024-01-15',
        status: '已投递',
        notes: '这是一家很好的公司'
      };

      const application = await applicationService.createApplication(
        testResume1.id,
        testUser1.id,
        applicationData
      );

      expect(application).toBeDefined();
      expect(application.company_name).toBe('阿里巴巴');
      expect(application.position_title).toBe('前端开发');
      expect(application.apply_date).toBe('2024-01-15');
      expect(application.status).toBe('已投递');
      expect(application.notes).toBe('这是一家很好的公司');
      expect(application.resume_id).toBe(testResume1.id);
    });

    test('应该成功创建最小字段的投递记录', async () => {
      const applicationData = {
        companyName: '腾讯',
        applyDate: '2024-01-20'
      };

      const application = await applicationService.createApplication(
        testResume1.id,
        testUser1.id,
        applicationData
      );

      expect(application.company_name).toBe('腾讯');
      expect(application.apply_date).toBe('2024-01-20');
      expect(application.status).toBe('已投递'); // 默认状态
      expect(application.position_title).toBeNull();
      expect(application.notes).toBeNull();
    });

    test('应该拒绝空公司名称', async () => {
      const applicationData = {
        companyName: '',
        applyDate: '2024-01-15'
      };

      await expect(
        applicationService.createApplication(testResume1.id, testUser1.id, applicationData)
      ).rejects.toThrow(/公司名称不能为空/);
    });

    test('应该拒绝超过200字符的公司名称', async () => {
      const applicationData = {
        companyName: 'a'.repeat(201),
        applyDate: '2024-01-15'
      };

      await expect(
        applicationService.createApplication(testResume1.id, testUser1.id, applicationData)
      ).rejects.toThrow(/公司名称不能超过200/);
    });

    test('应该拒绝未来日期的投递记录', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const applicationData = {
        companyName: '字节跳动',
        applyDate: futureDateStr
      };

      await expect(
        applicationService.createApplication(testResume1.id, testUser1.id, applicationData)
      ).rejects.toThrow(/投递日期不能为未来日期/);
    });

    test('应该拒绝无效的状态值', async () => {
      const applicationData = {
        companyName: '美团',
        applyDate: '2024-01-15',
        status: '无效状态'
      };

      await expect(
        applicationService.createApplication(testResume1.id, testUser1.id, applicationData)
      ).rejects.toThrow(/无效的投递状态/);
    });

    test('应该拒绝给不存在的简历创建投递记录', async () => {
      const fakeResumeId = '00000000-0000-0000-0000-000000000000';
      const applicationData = {
        companyName: '京东',
        applyDate: '2024-01-15'
      };

      await expect(
        applicationService.createApplication(fakeResumeId, testUser1.id, applicationData)
      ).rejects.toThrow(/简历不存在/);
    });

    test('应该拒绝给其他用户的简历创建投递记录', async () => {
      const applicationData = {
        companyName: '百度',
        applyDate: '2024-01-15'
      };

      await expect(
        applicationService.createApplication(testResume1.id, testUser2.id, applicationData)
      ).rejects.toThrow(/无权/);
    });

    test('应该支持所有有效的状态值', async () => {
      const validStatuses = ['已投递', '面试邀请', '已拒绝', '已录用'];

      for (const status of validStatuses) {
        const applicationData = {
          companyName: `公司${status}`,
          applyDate: '2024-01-15',
          status: status
        };

        const application = await applicationService.createApplication(
          testResume1.id,
          testUser1.id,
          applicationData
        );

        expect(application.status).toBe(status);
      }
    });
  });

  // ==================== 查询投递记录测试 ====================

  describe('查询投递记录测试', () => {
    let application1, application2, application3;

    beforeEach(async () => {
      // 创建测试投递记录
      application1 = await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '阿里巴巴',
        positionTitle: '前端开发',
        applyDate: '2024-01-15',
        status: '已投递'
      });

      application2 = await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '腾讯',
        positionTitle: '前端开发',
        applyDate: '2024-01-20',
        status: '面试邀请'
      });

      application3 = await applicationService.createApplication(testResume2.id, testUser2.id, {
        companyName: '字节跳动',
        positionTitle: '后端开发',
        applyDate: '2024-01-18',
        status: '已投递'
      });
    });

    test('应该成功获取指定简历的所有投递记录', async () => {
      const applications = await applicationService.getApplicationsByResumeId(
        testResume1.id,
        testUser1.id
      );

      expect(applications).toHaveLength(2);
      expect(applications[0].company_name).toBe('腾讯'); // 按日期降序
      expect(applications[1].company_name).toBe('阿里巴巴');
    });

    test('应该成功获取用户的所有投递记录', async () => {
      const applications = await applicationService.getApplicationsByUserId(testUser1.id);

      expect(applications).toHaveLength(2);
      // 验证包含关联信息
      expect(applications[0].resume).toBeDefined();
      expect(applications[0].resume.targetPosition).toBeDefined();
    });

    test('应该成功根据状态筛选投递记录', async () => {
      const applications = await applicationService.getApplicationsByUserId(testUser1.id, {
        status: '面试邀请'
      });

      expect(applications).toHaveLength(1);
      expect(applications[0].company_name).toBe('腾讯');
      expect(applications[0].status).toBe('面试邀请');
    });

    test('应该成功根据日期范围筛选投递记录', async () => {
      const applications = await applicationService.getApplicationsByUserId(testUser1.id, {
        dateFrom: '2024-01-18',
        dateTo: '2024-01-25'
      });

      expect(applications).toHaveLength(1);
      expect(applications[0].company_name).toBe('腾讯');
    });

    test('应该成功根据状态和日期范围组合筛选', async () => {
      const applications = await applicationService.getApplicationsByUserId(testUser1.id, {
        status: '已投递',
        dateFrom: '2024-01-10',
        dateTo: '2024-01-20'
      });

      expect(applications).toHaveLength(1);
      expect(applications[0].company_name).toBe('阿里巴巴');
    });

    test('应该成功获取单个投递记录详情', async () => {
      const application = await applicationService.getApplicationById(
        application1.id,
        testUser1.id
      );

      expect(application.company_name).toBe('阿里巴巴');
      expect(application.resume).toBeDefined();
      expect(application.resume.targetPosition).toBeDefined();
    });

    test('应该拒绝获取不存在的投递记录', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(
        applicationService.getApplicationById(fakeId, testUser1.id)
      ).rejects.toThrow(/投递记录不存在/);
    });

    test('应该拒绝获取其他用户的投递记录', async () => {
      await expect(
        applicationService.getApplicationById(application1.id, testUser2.id)
      ).rejects.toThrow(/无权/);
    });

    test('应该拒绝查看其他用户简历的投递记录', async () => {
      await expect(
        applicationService.getApplicationsByResumeId(testResume1.id, testUser2.id)
      ).rejects.toThrow(/无权/);
    });

    test('简历没有投递记录时应该返回空数组', async () => {
      // 创建一个新简历但不创建投递记录
      const newResume = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '新简历',
        content: '内容'
      });

      const applications = await applicationService.getApplicationsByResumeId(
        newResume.id,
        testUser1.id
      );

      expect(applications).toHaveLength(0);
    });
  });

  // ==================== 更新投递记录测试 ====================

  describe('更新投递记录测试', () => {
    let application;

    beforeEach(async () => {
      application = await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '阿里巴巴',
        positionTitle: '前端开发',
        applyDate: '2024-01-15',
        status: '已投递',
        notes: '初始备注'
      });
    });

    test('应该成功更新投递状态', async () => {
      const updated = await applicationService.updateApplication(
        application.id,
        testUser1.id,
        { status: '面试邀请' }
      );

      expect(updated.status).toBe('面试邀请');
      expect(updated.company_name).toBe('阿里巴巴'); // 其他字段不变
    });

    test('应该成功更新公司名称', async () => {
      const updated = await applicationService.updateApplication(
        application.id,
        testUser1.id,
        { companyName: '阿里云' }
      );

      expect(updated.company_name).toBe('阿里云');
    });

    test('应该成功更新投递日期', async () => {
      const updated = await applicationService.updateApplication(
        application.id,
        testUser1.id,
        { applyDate: '2024-01-20' }
      );

      expect(updated.apply_date).toBe('2024-01-20');
    });

    test('应该成功更新备注', async () => {
      const updated = await applicationService.updateApplication(
        application.id,
        testUser1.id,
        { notes: '已通过初试' }
      );

      expect(updated.notes).toBe('已通过初试');
    });

    test('应该成功同时更新多个字段', async () => {
      const updated = await applicationService.updateApplication(
        application.id,
        testUser1.id,
        {
          status: '已录用',
          notes: '已收到offer'
        }
      );

      expect(updated.status).toBe('已录用');
      expect(updated.notes).toBe('已收到offer');
    });

    test('应该拒绝更新为空的公司名称', async () => {
      await expect(
        applicationService.updateApplication(application.id, testUser1.id, { companyName: '' })
      ).rejects.toThrow(/公司名称不能为空/);
    });

    test('应该拒绝更新为无效的状态', async () => {
      await expect(
        applicationService.updateApplication(application.id, testUser1.id, {
          status: '无效状态'
        })
      ).rejects.toThrow(/无效的投递状态/);
    });

    test('应该拒绝更新为未来日期', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await expect(
        applicationService.updateApplication(application.id, testUser1.id, {
          applyDate: futureDateStr
        })
      ).rejects.toThrow(/投递日期不能为未来日期/);
    });

    test('应该拒绝更新不存在的投递记录', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(
        applicationService.updateApplication(fakeId, testUser1.id, { status: '面试邀请' })
      ).rejects.toThrow(/投递记录不存在/);
    });

    test('应该拒绝更新其他用户的投递记录', async () => {
      await expect(
        applicationService.updateApplication(application.id, testUser2.id, {
          status: '面试邀请'
        })
      ).rejects.toThrow(/无权/);
    });
  });

  // ==================== 删除投递记录测试 ====================

  describe('删除投递记录测试', () => {
    let application;

    beforeEach(async () => {
      application = await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '阿里巴巴',
        applyDate: '2024-01-15'
      });
    });

    test('应该成功删除投递记录', async () => {
      const result = await applicationService.deleteApplication(application.id, testUser1.id);

      expect(result.message).toMatch(/删除成功/);
      expect(result.deletedId).toBe(application.id);

      // 验证记录已被删除
      const deleted = await ApplicationRecord.findByPk(application.id);
      expect(deleted).toBeNull();
    });

    test('应该拒绝删除不存在的投递记录', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(
        applicationService.deleteApplication(fakeId, testUser1.id)
      ).rejects.toThrow(/投递记录不存在/);
    });

    test('应该拒绝删除其他用户的投递记录', async () => {
      await expect(
        applicationService.deleteApplication(application.id, testUser2.id)
      ).rejects.toThrow(/无权/);
    });
  });

  // ==================== 统计功能测试 ====================

  describe('统计功能测试', () => {
    beforeEach(async () => {
      // 创建多条不同状态的投递记录
      await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '阿里巴巴',
        applyDate: '2024-01-15',
        status: '已投递'
      });

      await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '腾讯',
        applyDate: '2024-01-20',
        status: '面试邀请'
      });

      await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '字节跳动',
        applyDate: '2024-01-25',
        status: '已录用'
      });

      await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '美团',
        applyDate: '2024-01-18',
        status: '已投递'
      });
    });

    test('应该正确统计总投递数', async () => {
      const stats = await applicationService.getApplicationStats(testUser1.id);

      expect(stats.total).toBe(4);
    });

    test('应该正确统计各状态的投递数量', async () => {
      const stats = await applicationService.getApplicationStats(testUser1.id);

      expect(stats.byStatus).toEqual({
        已投递: 2,
        面试邀请: 1,
        已拒绝: 0,
        已录用: 1
      });
    });

    test('应该正确获取最近和首次投递日期', async () => {
      const stats = await applicationService.getApplicationStats(testUser1.id);

      expect(stats.latestApplyDate).toBe('2024-01-25'); // 最近的
      expect(stats.firstApplyDate).toBe('2024-01-15'); // 最早的
    });

    test('没有投递记录时应该返回空统计', async () => {
      // 使用一个没有投递记录的用户
      const newUser = await authService.register('newuser@test.com', 'Test1234');
      const newPosition = await positionService.createPosition(newUser.id, '测试岗位');
      await resumeService.createOnlineResume(newPosition.id, newUser.id, {
        title: '测试简历',
        content: '内容'
      });

      const stats = await applicationService.getApplicationStats(newUser.id);

      expect(stats.total).toBe(0);
      expect(stats.byStatus).toEqual({
        已投递: 0,
        面试邀请: 0,
        已拒绝: 0,
        已录用: 0
      });
      expect(stats.latestApplyDate).toBeNull();
      expect(stats.firstApplyDate).toBeNull();
    });
  });

  // ==================== 权限隔离测试 ====================

  describe('权限隔离测试', () => {
    let app1, app2;

    beforeEach(async () => {
      // 两个用户各创建一条投递记录
      app1 = await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '用户1的公司',
        applyDate: '2024-01-15'
      });

      app2 = await applicationService.createApplication(testResume2.id, testUser2.id, {
        companyName: '用户2的公司',
        applyDate: '2024-01-15'
      });
    });

    test('用户只能查询自己的投递记录', async () => {
      const user1Apps = await applicationService.getApplicationsByUserId(testUser1.id);
      const user2Apps = await applicationService.getApplicationsByUserId(testUser2.id);

      expect(user1Apps).toHaveLength(1);
      expect(user1Apps[0].company_name).toBe('用户1的公司');

      expect(user2Apps).toHaveLength(1);
      expect(user2Apps[0].company_name).toBe('用户2的公司');
    });

    test('用户无法操作其他用户的投递记录', async () => {
      // 用户2尝试更新用户1的投递记录
      await expect(
        applicationService.updateApplication(app1.id, testUser2.id, { status: '面试邀请' })
      ).rejects.toThrow(/无权/);

      // 用户1尝试删除用户2的投递记录
      await expect(
        applicationService.deleteApplication(app2.id, testUser1.id)
      ).rejects.toThrow(/无权/);
    });

    test('统计数据应该正确隔离', async () => {
      const stats1 = await applicationService.getApplicationStats(testUser1.id);
      const stats2 = await applicationService.getApplicationStats(testUser2.id);

      expect(stats1.total).toBe(1);
      expect(stats2.total).toBe(1);
    });
  });

  // ==================== 完整流程测试 ====================

  describe('完整流程测试', () => {
    test('应该完成创建-查询-更新-删除的完整流程', async () => {
      // 1. 创建投递记录
      const created = await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '测试公司',
        positionTitle: '前端开发',
        applyDate: '2024-01-15',
        status: '已投递',
        notes: '待跟进'
      });

      expect(created.company_name).toBe('测试公司');
      expect(created.status).toBe('已投递');

      // 2. 查询投递记录
      const found = await applicationService.getApplicationById(created.id, testUser1.id);
      expect(found.company_name).toBe('测试公司');

      // 3. 更新状态为面试邀请
      const updated1 = await applicationService.updateApplication(
        created.id,
        testUser1.id,
        {
          status: '面试邀请',
          notes: '已收到面试邀请'
        }
      );
      expect(updated1.status).toBe('面试邀请');
      expect(updated1.notes).toBe('已收到面试邀请');

      // 4. 再次更新状态为已录用
      const updated2 = await applicationService.updateApplication(
        created.id,
        testUser1.id,
        {
          status: '已录用',
          notes: '已收到offer，待入职'
        }
      );
      expect(updated2.status).toBe('已录用');

      // 5. 删除投递记录
      await applicationService.deleteApplication(created.id, testUser1.id);

      // 6. 验证已删除
      const deleted = await ApplicationRecord.findByPk(created.id);
      expect(deleted).toBeNull();
    });

    test('应该支持一个简历有多条投递记录', async () => {
      // 创建3条投递记录
      await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '阿里巴巴',
        applyDate: '2024-01-15'
      });

      await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '腾讯',
        applyDate: '2024-01-20'
      });

      await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '字节跳动',
        applyDate: '2024-01-25'
      });

      const applications = await applicationService.getApplicationsByResumeId(
        testResume1.id,
        testUser1.id
      );

      expect(applications).toHaveLength(3);
      // 验证按日期降序排列
      expect(applications[0].company_name).toBe('字节跳动');
      expect(applications[1].company_name).toBe('腾讯');
      expect(applications[2].company_name).toBe('阿里巴巴');
    });

    test('删除简历时应该级联删除投递记录', async () => {
      // 创建投递记录
      const application = await applicationService.createApplication(testResume1.id, testUser1.id, {
        companyName: '测试公司',
        applyDate: '2024-01-15'
      });

      expect(application).toBeDefined();

      // 删除简历
      await resumeService.deleteResume(testResume1.id, testUser1.id);

      // 验证投递记录也被删除
      const deletedApplication = await ApplicationRecord.findByPk(application.id);
      expect(deletedApplication).toBeNull();
    });
  });
});
