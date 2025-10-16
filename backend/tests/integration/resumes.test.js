/**
 * 简历版本管理集成测试
 *
 * 测试目标: 验证简历创建、查询、更新、删除的完整流程
 * 测试范围:
 * - 创建文件类型简历
 * - 创建在线类型简历
 * - 查询简历列表和详情
 * - 更新在线简历
 * - 删除简历及其关联数据
 * - 权限验证
 */

const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const {
  sequelize,
  ResumeVersion,
  ResumeMetadata,
  TargetPosition,
  User
} = require('../../src/models');
const resumeService = require('../../src/services/resumeService');
const authService = require('../../src/services/authService');
const positionService = require('../../src/services/positionService');

describe('简历版本管理集成测试', () => {
  let testUser1;
  let testUser2;
  let testPosition1;
  let testPosition2;

  /**
   * 测试环境初始化
   * 创建测试用户和测试岗位
   */
  beforeAll(async () => {
    // 确保数据库连接正常
    await sequelize.authenticate();

    // 同步数据库表结构（仅测试环境）
    await sequelize.sync({ force: false });

    // 创建测试用户1
    const timestamp = Date.now();
    testUser1 = await authService.register(
      `test-resume-user1-${timestamp}@example.com`,
      'Test123456'
    );

    // 创建测试用户2（用于权限验证测试）
    testUser2 = await authService.register(
      `test-resume-user2-${timestamp}@example.com`,
      'Test123456'
    );
  });

  /**
   * 每个测试用例前清理简历和岗位数据
   * 并创建新的测试岗位
   */
  beforeEach(async () => {
    // 清理测试数据（按依赖顺序：先删除简历和元数据，再删除岗位）
    await ResumeMetadata.destroy({ where: {}, force: true });
    await ResumeVersion.destroy({ where: {}, force: true });
    await TargetPosition.destroy({ where: {}, force: true });

    // 为用户1创建测试岗位
    testPosition1 = await positionService.createPosition(
      testUser1.id,
      '前端开发工程师',
      '测试岗位1'
    );

    // 为用户2创建测试岗位（用于权限验证）
    testPosition2 = await positionService.createPosition(
      testUser2.id,
      '后端开发工程师',
      '测试岗位2'
    );
  });

  /**
   * 测试结束后清理所有测试数据
   */
  afterAll(async () => {
    // 清理所有测试数据
    await ResumeMetadata.destroy({ where: {}, force: true });
    await ResumeVersion.destroy({ where: {}, force: true });
    await TargetPosition.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 关闭数据库连接
    await sequelize.close();
  });

  /**
   * 测试组1: 创建文件类型简历
   */
  describe('创建文件类型简历', () => {
    it('应该成功创建file类型简历并自动创建metadata', async () => {
      const resumeData = {
        title: '阿里巴巴简历_2024版',
        filePath: '/uploads/resumes/test-resume-001.pdf',
        fileName: 'test-resume-001.pdf',
        fileSize: 1024000 // 1MB
      };

      const result = await resumeService.createFileResume(
        testPosition1.id,
        testUser1.id,
        resumeData
      );

      // 验证简历基本信息
      expect(result).toHaveProperty('id');
      expect(result.target_position_id).toBe(testPosition1.id);
      expect(result.type).toBe('file');
      expect(result.title).toBe(resumeData.title);
      expect(result.file_path).toBe(resumeData.filePath);
      expect(result.file_name).toBe(resumeData.fileName);
      expect(result.file_size).toBe(resumeData.fileSize);
      expect(result.content).toBeNull();

      // 验证metadata自动创建
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('id');
      expect(result.metadata.resume_id).toBe(result.id);
      expect(result.metadata.notes).toBeNull();
      expect(result.metadata.tags).toEqual([]);

      // 验证数据库中实际存储
      const dbResume = await ResumeVersion.findByPk(result.id);
      expect(dbResume).not.toBeNull();
      expect(dbResume.title).toBe(resumeData.title);

      const dbMetadata = await ResumeMetadata.findOne({
        where: { resume_id: result.id }
      });
      expect(dbMetadata).not.toBeNull();
    });

    it('应该验证title长度在1-200字符之间', async () => {
      // 测试空标题
      await expect(
        resumeService.createFileResume(testPosition1.id, testUser1.id, {
          title: '',
          filePath: '/uploads/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1000
        })
      ).rejects.toThrow('简历标题长度必须在1-200字符之间');

      // 测试超长标题
      const longTitle = 'a'.repeat(201);
      await expect(
        resumeService.createFileResume(testPosition1.id, testUser1.id, {
          title: longTitle,
          filePath: '/uploads/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1000
        })
      ).rejects.toThrow('简历标题长度必须在1-200字符之间');
    });

    it('应该验证file_path和file_name必填', async () => {
      // 缺少filePath
      await expect(
        resumeService.createFileResume(testPosition1.id, testUser1.id, {
          title: '测试简历',
          fileName: 'test.pdf',
          fileSize: 1000
        })
      ).rejects.toThrow('文件路径和文件名不能为空');

      // 缺少fileName
      await expect(
        resumeService.createFileResume(testPosition1.id, testUser1.id, {
          title: '测试简历',
          filePath: '/uploads/test.pdf',
          fileSize: 1000
        })
      ).rejects.toThrow('文件路径和文件名不能为空');
    });

    it('应该验证file_size限制为0到10MB', async () => {
      // 测试负数文件大小
      await expect(
        resumeService.createFileResume(testPosition1.id, testUser1.id, {
          title: '测试简历',
          filePath: '/uploads/test.pdf',
          fileName: 'test.pdf',
          fileSize: -100
        })
      ).rejects.toThrow('文件大小必须在0到10MB之间');

      // 测试超过10MB
      await expect(
        resumeService.createFileResume(testPosition1.id, testUser1.id, {
          title: '测试简历',
          filePath: '/uploads/test.pdf',
          fileName: 'test.pdf',
          fileSize: 11 * 1024 * 1024 // 11MB
        })
      ).rejects.toThrow('文件大小必须在0到10MB之间');
    });

    it('应该在targetPositionId不存在时抛出错误', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';

      await expect(
        resumeService.createFileResume(nonExistentId, testUser1.id, {
          title: '测试简历',
          filePath: '/uploads/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1000
        })
      ).rejects.toThrow('目标岗位不存在或您无权访问');
    });

    it('应该在无权访问targetPosition时抛出错误', async () => {
      // 用户1尝试在用户2的岗位下创建简历
      await expect(
        resumeService.createFileResume(testPosition2.id, testUser1.id, {
          title: '测试简历',
          filePath: '/uploads/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1000
        })
      ).rejects.toThrow('目标岗位不存在或您无权访问');
    });
  });

  /**
   * 测试组2: 创建在线类型简历
   */
  describe('创建在线类型简历', () => {
    it('应该成功创建online类型简历并自动创建metadata', async () => {
      const resumeData = {
        title: '腾讯前端简历',
        content: '<h1>个人简历</h1><p>这是一份在线简历内容</p><h2>教育背景</h2>'
      };

      const result = await resumeService.createOnlineResume(
        testPosition1.id,
        testUser1.id,
        resumeData
      );

      // 验证简历基本信息
      expect(result).toHaveProperty('id');
      expect(result.target_position_id).toBe(testPosition1.id);
      expect(result.type).toBe('online');
      expect(result.title).toBe(resumeData.title);
      expect(result.content).toBe(resumeData.content);
      expect(result.file_path).toBeNull();
      expect(result.file_name).toBeNull();
      expect(result.file_size).toBeNull();

      // 验证metadata自动创建
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('id');
      expect(result.metadata.resume_id).toBe(result.id);
      expect(result.metadata.notes).toBeNull();
      expect(result.metadata.tags).toEqual([]);
    });

    it('应该验证content必填且非空', async () => {
      // 缺少content
      await expect(
        resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
          title: '测试简历'
        })
      ).rejects.toThrow('在线简历内容不能为空');

      // content为空字符串
      await expect(
        resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
          title: '测试简历',
          content: '   '
        })
      ).rejects.toThrow('在线简历内容不能为空');
    });

    it('应该验证title必填', async () => {
      await expect(
        resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
          title: '',
          content: '<p>测试内容</p>'
        })
      ).rejects.toThrow('简历标题长度必须在1-200字符之间');
    });

    it('应该自动trim标题空格', async () => {
      const result = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '  测试简历标题  ',
        content: '<p>测试内容</p>'
      });

      expect(result.title).toBe('测试简历标题');
    });
  });

  /**
   * 测试组3: 查询简历
   */
  describe('查询简历', () => {
    it('应该获取岗位下的所有简历（空列表）', async () => {
      const resumes = await resumeService.getResumesByPosition(testPosition1.id, testUser1.id);

      expect(Array.isArray(resumes)).toBe(true);
      expect(resumes.length).toBe(0);
    });

    it('应该获取岗位下的所有简历（多个简历）', async () => {
      // 创建多个简历
      await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '简历A',
        content: '<p>内容A</p>'
      });

      await resumeService.createFileResume(testPosition1.id, testUser1.id, {
        title: '简历B',
        filePath: '/uploads/b.pdf',
        fileName: 'b.pdf',
        fileSize: 1000
      });

      await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '简历C',
        content: '<p>内容C</p>'
      });

      const resumes = await resumeService.getResumesByPosition(testPosition1.id, testUser1.id);

      expect(resumes.length).toBe(3);

      // 验证每个简历都包含metadata
      resumes.forEach((resume) => {
        expect(resume).toHaveProperty('metadata');
        expect(resume.metadata).toHaveProperty('id');
      });

      // 验证按创建时间降序排列
      expect(resumes[0].title).toBe('简历C');
      expect(resumes[1].title).toBe('简历B');
      expect(resumes[2].title).toBe('简历A');
    });

    it('应该获取单个简历详情（包含metadata）', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '详情测试简历',
        content: '<p>详情内容</p>'
      });

      const resume = await resumeService.getResumeById(created.id, testUser1.id);

      expect(resume.id).toBe(created.id);
      expect(resume.title).toBe('详情测试简历');
      expect(resume).toHaveProperty('metadata');
      expect(resume).toHaveProperty('targetPosition');
      expect(resume.targetPosition.id).toBe(testPosition1.id);
    });

    it('应该在简历不存在时抛出错误', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';

      await expect(resumeService.getResumeById(nonExistentId, testUser1.id)).rejects.toThrow(
        '简历不存在或您无权访问'
      );
    });

    it('应该在无权限访问其他用户的简历时抛出错误', async () => {
      // 用户1创建简历
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '用户1的简历',
        content: '<p>内容</p>'
      });

      // 用户2尝试访问用户1的简历
      await expect(resumeService.getResumeById(created.id, testUser2.id)).rejects.toThrow(
        '简历不存在或您无权访问'
      );
    });
  });

  /**
   * 测试组4: 更新在线简历
   */
  describe('更新在线简历', () => {
    it('应该成功更新title', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '原标题',
        content: '<p>原内容</p>'
      });

      const updated = await resumeService.updateOnlineResume(created.id, testUser1.id, {
        title: '新标题'
      });

      expect(updated.title).toBe('新标题');
      expect(updated.content).toBe('<p>原内容</p>');
    });

    it('应该成功更新content', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '原标题',
        content: '<p>原内容</p>'
      });

      const updated = await resumeService.updateOnlineResume(created.id, testUser1.id, {
        content: '<p>新内容</p><h2>新章节</h2>'
      });

      expect(updated.title).toBe('原标题');
      expect(updated.content).toBe('<p>新内容</p><h2>新章节</h2>');
    });

    it('应该同时更新title和content', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '原标题',
        content: '<p>原内容</p>'
      });

      const updated = await resumeService.updateOnlineResume(created.id, testUser1.id, {
        title: '全新标题',
        content: '<p>全新内容</p>'
      });

      expect(updated.title).toBe('全新标题');
      expect(updated.content).toBe('<p>全新内容</p>');
    });

    it('应该验证只能更新online类型简历', async () => {
      const fileResume = await resumeService.createFileResume(testPosition1.id, testUser1.id, {
        title: '文件简历',
        filePath: '/uploads/test.pdf',
        fileName: 'test.pdf',
        fileSize: 1000
      });

      await expect(
        resumeService.updateOnlineResume(fileResume.id, testUser1.id, {
          title: '尝试更新文件简历'
        })
      ).rejects.toThrow('只能更新在线类型简历的内容，文件类型简历不支持此操作');
    });

    it('应该在无权限更新其他用户的简历时抛出错误', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '用户1的简历',
        content: '<p>内容</p>'
      });

      await expect(
        resumeService.updateOnlineResume(created.id, testUser2.id, {
          title: '尝试修改'
        })
      ).rejects.toThrow('简历不存在或您无权访问');
    });

    it('应该验证更新的title长度', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '原标题',
        content: '<p>内容</p>'
      });

      const longTitle = 'a'.repeat(201);
      await expect(
        resumeService.updateOnlineResume(created.id, testUser1.id, {
          title: longTitle
        })
      ).rejects.toThrow('简历标题长度必须在1-200字符之间');
    });

    it('应该验证更新的content不能为空', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '原标题',
        content: '<p>原内容</p>'
      });

      await expect(
        resumeService.updateOnlineResume(created.id, testUser1.id, {
          content: '   '
        })
      ).rejects.toThrow('在线简历内容不能为空');
    });

    it('应该在没有提供更新数据时抛出错误', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '原标题',
        content: '<p>原内容</p>'
      });

      await expect(resumeService.updateOnlineResume(created.id, testUser1.id, {})).rejects.toThrow(
        '没有提供需要更新的数据'
      );
    });
  });

  /**
   * 测试组5: 删除简历
   */
  describe('删除简历', () => {
    it('应该成功删除简历并级联删除metadata', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '待删除简历',
        content: '<p>内容</p>'
      });

      const resumeId = created.id;
      const metadataId = created.metadata.id;

      // 删除简历
      const result = await resumeService.deleteResume(resumeId, testUser1.id);

      expect(result.success).toBe(true);
      expect(result.resumeId).toBe(resumeId);
      expect(result.type).toBe('online');

      // 验证简历已被删除
      const dbResume = await ResumeVersion.findByPk(resumeId);
      expect(dbResume).toBeNull();

      // 验证metadata已被级联删除
      const dbMetadata = await ResumeMetadata.findByPk(metadataId);
      expect(dbMetadata).toBeNull();
    });

    it('应该在删除不存在的简历时抛出错误', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';

      await expect(resumeService.deleteResume(nonExistentId, testUser1.id)).rejects.toThrow(
        '简历不存在或您无权访问'
      );
    });

    it('应该在无权限删除其他用户的简历时抛出错误', async () => {
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '用户1的简历',
        content: '<p>内容</p>'
      });

      await expect(resumeService.deleteResume(created.id, testUser2.id)).rejects.toThrow(
        '简历不存在或您无权访问'
      );
    });

    it('应该能删除file类型简历', async () => {
      const fileResume = await resumeService.createFileResume(testPosition1.id, testUser1.id, {
        title: '文件简历',
        filePath: '/uploads/test.pdf',
        fileName: 'test.pdf',
        fileSize: 1000
      });

      const result = await resumeService.deleteResume(fileResume.id, testUser1.id);

      expect(result.success).toBe(true);
      expect(result.type).toBe('file');

      // 验证已被删除
      const dbResume = await ResumeVersion.findByPk(fileResume.id);
      expect(dbResume).toBeNull();
    });
  });

  /**
   * 测试组6: 完整流程测试
   */
  describe('完整流程测试', () => {
    it('应该完成创建->查询->更新->删除的完整流程', async () => {
      // 步骤1: 创建在线简历
      const created = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '流程测试简历',
        content: '<p>初始内容</p>'
      });
      expect(created.id).toBeDefined();
      expect(created.title).toBe('流程测试简历');

      // 步骤2: 查询简历详情
      const fetched = await resumeService.getResumeById(created.id, testUser1.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.content).toBe('<p>初始内容</p>');

      // 步骤3: 更新简历
      const updated = await resumeService.updateOnlineResume(created.id, testUser1.id, {
        title: '更新后的标题',
        content: '<p>更新后的内容</p>'
      });
      expect(updated.title).toBe('更新后的标题');
      expect(updated.content).toBe('<p>更新后的内容</p>');

      // 步骤4: 再次查询验证更新
      const fetchedAgain = await resumeService.getResumeById(created.id, testUser1.id);
      expect(fetchedAgain.title).toBe('更新后的标题');
      expect(fetchedAgain.content).toBe('<p>更新后的内容</p>');

      // 步骤5: 删除简历
      const deleteResult = await resumeService.deleteResume(created.id, testUser1.id);
      expect(deleteResult.success).toBe(true);

      // 步骤6: 验证已删除
      await expect(resumeService.getResumeById(created.id, testUser1.id)).rejects.toThrow(
        '简历不存在或您无权访问'
      );
    });

    it('应该支持一个岗位下管理多个简历', async () => {
      // 创建多个不同类型的简历
      const online1 = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '在线简历1',
        content: '<p>内容1</p>'
      });

      const file1 = await resumeService.createFileResume(testPosition1.id, testUser1.id, {
        title: '文件简历1',
        filePath: '/uploads/file1.pdf',
        fileName: 'file1.pdf',
        fileSize: 2000
      });

      const online2 = await resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
        title: '在线简历2',
        content: '<p>内容2</p>'
      });

      // 查询该岗位下的所有简历
      const resumes = await resumeService.getResumesByPosition(testPosition1.id, testUser1.id);

      expect(resumes.length).toBe(3);

      // 验证包含所有创建的简历
      const resumeIds = resumes.map((r) => r.id);
      expect(resumeIds).toContain(online1.id);
      expect(resumeIds).toContain(file1.id);
      expect(resumeIds).toContain(online2.id);

      // 验证类型
      const onlineCount = resumes.filter((r) => r.type === 'online').length;
      const fileCount = resumes.filter((r) => r.type === 'file').length;
      expect(onlineCount).toBe(2);
      expect(fileCount).toBe(1);

      // 更新其中一个在线简历
      await resumeService.updateOnlineResume(online1.id, testUser1.id, {
        title: '更新后的在线简历1'
      });

      // 删除其中一个简历
      await resumeService.deleteResume(file1.id, testUser1.id);

      // 再次查询
      const remainingResumes = await resumeService.getResumesByPosition(
        testPosition1.id,
        testUser1.id
      );
      expect(remainingResumes.length).toBe(2);

      // 验证更新和删除生效
      const updatedResume = remainingResumes.find((r) => r.id === online1.id);
      expect(updatedResume.title).toBe('更新后的在线简历1');

      const deletedResume = remainingResumes.find((r) => r.id === file1.id);
      expect(deletedResume).toBeUndefined();
    });

    it('应该确保事务一致性：创建简历失败时不创建metadata', async () => {
      // 尝试创建一个会失败的简历（title过长）
      const longTitle = 'a'.repeat(201);

      await expect(
        resumeService.createOnlineResume(testPosition1.id, testUser1.id, {
          title: longTitle,
          content: '<p>内容</p>'
        })
      ).rejects.toThrow();

      // 验证没有创建任何简历或metadata
      const resumes = await ResumeVersion.findAll({
        where: { target_position_id: testPosition1.id }
      });
      expect(resumes.length).toBe(0);

      const metadatas = await ResumeMetadata.findAll();
      expect(metadatas.length).toBe(0);
    });
  });
});
