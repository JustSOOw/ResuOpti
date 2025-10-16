/**
 * 权限隔离集成测试
 * 验证用户只能访问自己的资源，无法访问其他用户的资源
 * 测试范围：目标岗位、简历版本、简历元数据、投递记录
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config');
const User = require('../../src/models/User');
const TargetPosition = require('../../src/models/TargetPosition');
const ResumeVersion = require('../../src/models/ResumeVersion');
const ResumeMetadata = require('../../src/models/ResumeMetadata');
const ApplicationRecord = require('../../src/models/ApplicationRecord');
const authService = require('../../src/services/authService');

describe('权限隔离集成测试', () => {
  let user1Token, user2Token;
  let user1Id, user2Id;
  let user1Position, user2Position;
  let user1Resume, user2Resume;

  // 测试前准备：创建两个用户及其各自的资源
  beforeAll(async () => {
    // 清理数据库
    await sequelize.sync({ force: true });

    // 创建用户1
    const user1 = await User.create({
      email: 'user1@test.com',
      password_hash: await authService.hashPassword('password123')
    });
    user1Id = user1.id;
    user1Token = authService.generateToken(user1);

    // 创建用户2
    const user2 = await User.create({
      email: 'user2@test.com',
      password_hash: await authService.hashPassword('password123')
    });
    user2Id = user2.id;
    user2Token = authService.generateToken(user2);

    // 为用户1创建目标岗位
    user1Position = await TargetPosition.create({
      user_id: user1Id,
      name: '前端开发工程师',
      description: '用户1的目标岗位'
    });

    // 为用户2创建目标岗位
    user2Position = await TargetPosition.create({
      user_id: user2Id,
      name: '后端开发工程师',
      description: '用户2的目标岗位'
    });

    // 为用户1创建简历
    user1Resume = await ResumeVersion.create({
      target_position_id: user1Position.id,
      type: 'online',
      title: '用户1的简历',
      content: '这是用户1的简历内容'
    });

    // 为用户1的简历创建元数据
    await ResumeMetadata.create({
      resume_id: user1Resume.id,
      notes: '用户1的备注',
      tags: ['技术', 'React']
    });

    // 为用户2创建简历
    user2Resume = await ResumeVersion.create({
      target_position_id: user2Position.id,
      type: 'online',
      title: '用户2的简历',
      content: '这是用户2的简历内容'
    });

    // 为用户2的简历创建元数据
    await ResumeMetadata.create({
      resume_id: user2Resume.id,
      notes: '用户2的备注',
      tags: ['技术', 'Node.js']
    });

    // 为用户1的简历创建投递记录
    await ApplicationRecord.create({
      resume_id: user1Resume.id,
      company_name: '用户1投递的公司',
      position_title: '前端工程师',
      apply_date: '2025-01-01',
      status: '已投递',
      notes: '用户1的投递备注'
    });

    // 为用户2的简历创建投递记录
    await ApplicationRecord.create({
      resume_id: user2Resume.id,
      company_name: '用户2投递的公司',
      position_title: '后端工程师',
      apply_date: '2025-01-02',
      status: '已投递',
      notes: '用户2的投递备注'
    });
  });

  // 测试后清理
  afterAll(async () => {
    await sequelize.close();
  });

  describe('目标岗位权限隔离', () => {
    test('用户不能查看其他用户的目标岗位详情', async () => {
      const response = await request(app)
        .get(`/api/v1/target-positions/${user2Position.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权限');
    });

    test('用户不能更新其他用户的目标岗位', async () => {
      const response = await request(app)
        .put(`/api/v1/target-positions/${user2Position.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: '尝试修改用户2的岗位',
          description: '恶意修改'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权限');
    });

    test('用户不能删除其他用户的目标岗位', async () => {
      const response = await request(app)
        .delete(`/api/v1/target-positions/${user2Position.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权限');
    });

    test('用户获取岗位列表时只能看到自己的岗位', async () => {
      const response = await request(app)
        .get('/api/v1/target-positions')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(user1Position.id);
      expect(response.body.data[0].name).toBe('前端开发工程师');
    });
  });

  describe('简历版本权限隔离', () => {
    test('用户不能查看其他用户的简历详情', async () => {
      const response = await request(app)
        .get(`/api/v1/resumes/${user2Resume.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户不能更新其他用户的简历内容', async () => {
      const response = await request(app)
        .put(`/api/v1/resumes/${user2Resume.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: '尝试修改用户2的简历',
          content: '恶意修改内容'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户不能删除其他用户的简历', async () => {
      const response = await request(app)
        .delete(`/api/v1/resumes/${user2Resume.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户查询岗位下的简历列表时不能看到其他用户的简历', async () => {
      // 用户1尝试查询用户2的岗位下的简历
      const response = await request(app)
        .get(`/api/v1/target-positions/${user2Position.id}/resumes`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });
  });

  describe('简历元数据权限隔离', () => {
    test('用户不能查看其他用户简历的元数据', async () => {
      const response = await request(app)
        .get(`/api/v1/resumes/${user2Resume.id}/metadata`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户不能更新其他用户简历的元数据', async () => {
      const response = await request(app)
        .put(`/api/v1/resumes/${user2Resume.id}/metadata`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          notes: '尝试修改用户2的备注',
          tags: ['恶意', '标签']
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户不能为其他用户的简历添加标签', async () => {
      const response = await request(app)
        .post(`/api/v1/resumes/${user2Resume.id}/metadata/tags`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tag: '恶意标签'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });
  });

  describe('投递记录权限隔离', () => {
    test('用户不能为其他用户的简历创建投递记录', async () => {
      const response = await request(app)
        .post(`/api/v1/resumes/${user2Resume.id}/applications`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          companyName: '恶意投递记录',
          positionTitle: '测试职位',
          applyDate: '2025-01-05',
          status: '已投递'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户不能查看其他用户简历的投递记录', async () => {
      const response = await request(app)
        .get(`/api/v1/resumes/${user2Resume.id}/applications`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户查询所有投递记录时只能看到自己的记录', async () => {
      const response = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].company_name).toBe('用户1投递的公司');
    });

    test('用户不能更新其他用户的投递记录', async () => {
      // 先获取用户2的投递记录ID
      const user2Applications = await ApplicationRecord.findAll({
        where: { resume_id: user2Resume.id }
      });
      const user2ApplicationId = user2Applications[0].id;

      const response = await request(app)
        .put(`/api/v1/applications/${user2ApplicationId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          status: '已录用'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('用户不能删除其他用户的投递记录', async () => {
      // 先获取用户2的投递记录ID
      const user2Applications = await ApplicationRecord.findAll({
        where: { resume_id: user2Resume.id }
      });
      const user2ApplicationId = user2Applications[0].id;

      const response = await request(app)
        .delete(`/api/v1/applications/${user2ApplicationId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });
  });

  describe('跨资源权限验证', () => {
    test('用户不能在其他用户的岗位下创建简历', async () => {
      const response = await request(app)
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          targetPositionId: user2Position.id, // 尝试在用户2的岗位下创建
          type: 'online',
          title: '恶意简历',
          content: '尝试在其他用户岗位下创建简历'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('无权');
    });

    test('验证数据库级别的隔离：直接查询不会泄露其他用户数据', async () => {
      // 验证用户1的岗位确实不包含用户2的数据
      const user1Positions = await TargetPosition.findAll({
        where: { user_id: user1Id }
      });

      expect(user1Positions).toHaveLength(1);
      expect(user1Positions[0].id).toBe(user1Position.id);

      // 验证用户2的岗位确实不包含用户1的数据
      const user2Positions = await TargetPosition.findAll({
        where: { user_id: user2Id }
      });

      expect(user2Positions).toHaveLength(1);
      expect(user2Positions[0].id).toBe(user2Position.id);
    });
  });

  describe('正向测试：用户可以正常访问自己的资源', () => {
    test('用户可以查看自己的目标岗位', async () => {
      const response = await request(app)
        .get(`/api/v1/target-positions/${user1Position.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(user1Position.id);
      expect(response.body.data.name).toBe('前端开发工程师');
    });

    test('用户可以更新自己的目标岗位', async () => {
      const response = await request(app)
        .put(`/api/v1/target-positions/${user1Position.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: '高级前端开发工程师',
          description: '更新后的描述'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('高级前端开发工程师');
    });

    test('用户可以查看和更新自己的简历', async () => {
      const getResponse = await request(app)
        .get(`/api/v1/resumes/${user1Resume.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.id).toBe(user1Resume.id);

      const updateResponse = await request(app)
        .put(`/api/v1/resumes/${user1Resume.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: '更新后的简历标题'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.title).toBe('更新后的简历标题');
    });

    test('用户可以管理自己简历的元数据', async () => {
      const response = await request(app)
        .put(`/api/v1/resumes/${user1Resume.id}/metadata`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          notes: '更新后的备注',
          tags: ['技术', 'React', 'TypeScript']
        });

      expect(response.status).toBe(200);
      expect(response.body.data.notes).toBe('更新后的备注');
      expect(response.body.data.tags).toContain('TypeScript');
    });

    test('用户可以管理自己的投递记录', async () => {
      // 获取用户1的投递记录
      const user1Applications = await ApplicationRecord.findAll({
        where: { resume_id: user1Resume.id }
      });
      const user1ApplicationId = user1Applications[0].id;

      const response = await request(app)
        .put(`/api/v1/applications/${user1ApplicationId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          status: '面试邀请'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('面试邀请');
    });
  });
});
