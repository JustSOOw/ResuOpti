/**
 * applicationService 单元测试
 * 测试投递记录管理服务的所有功能
 */

const applicationService = require('../../../src/services/applicationService');
const { ApplicationRecord, ResumeVersion, TargetPosition } = require('../../../src/models');
const { statsCache, LRUCache } = require('../../../src/utils/cache');

// Mock models and cache
jest.mock('../../../src/models');
jest.mock('../../../src/utils/cache');

describe('applicationService', () => {
  const userId = 'test-user-123';
  const resumeId = 'resume-123';
  const positionId = 'position-123';
  const applicationId = 'application-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cache utilities
    LRUCache.generateKey = jest.fn((...args) => args.join(':'));
    statsCache.wrap = jest.fn((key, fn) => fn());
    statsCache.delete = jest.fn();
  });

  describe('createApplication', () => {
    test('应该成功创建投递记录', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: {
          id: positionId,
          user_id: userId,
          name: '前端开发'
        }
      };
      const mockApplication = {
        id: applicationId,
        resume_id: resumeId,
        company_name: 'ABC公司',
        position_title: '前端工程师',
        apply_date: '2024-01-01',
        status: '已投递',
        notes: null
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ApplicationRecord.create = jest.fn().mockResolvedValue(mockApplication);

      const result = await applicationService.createApplication(resumeId, userId, {
        companyName: 'ABC公司',
        positionTitle: '前端工程师',
        applyDate: '2024-01-01',
        status: '已投递'
      });

      expect(ResumeVersion.findByPk).toHaveBeenCalledWith(resumeId, expect.any(Object));
      expect(ApplicationRecord.create).toHaveBeenCalledWith({
        resume_id: resumeId,
        company_name: 'ABC公司',
        position_title: '前端工程师',
        apply_date: '2024-01-01',
        status: '已投递',
        notes: null
      });
      expect(result).toEqual(mockApplication);
    });

    test('应该使用默认状态"已投递"', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ApplicationRecord.create = jest.fn().mockResolvedValue({});

      await applicationService.createApplication(resumeId, userId, {
        companyName: 'ABC公司',
        applyDate: '2024-01-01'
      });

      expect(ApplicationRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: '已投递'
        })
      );
    });

    test('当公司名称为空时应该抛出错误', async () => {
      await expect(
        applicationService.createApplication(resumeId, userId, {
          companyName: '   ',
          applyDate: '2024-01-01'
        })
      ).rejects.toThrow('公司名称不能为空');
    });

    test('当公司名称超过200字符时应该抛出错误', async () => {
      const longName = 'a'.repeat(201);

      await expect(
        applicationService.createApplication(resumeId, userId, {
          companyName: longName,
          applyDate: '2024-01-01'
        })
      ).rejects.toThrow('公司名称不能超过200个字符');
    });

    test('当投递日期为未来日期时应该抛出错误', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().slice(0, 10);

      await expect(
        applicationService.createApplication(resumeId, userId, {
          companyName: 'ABC公司',
          applyDate: futureDateStr
        })
      ).rejects.toThrow('投递日期不能为未来日期');
    });

    test('当状态无效时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        applicationService.createApplication(resumeId, userId, {
          companyName: 'ABC公司',
          applyDate: '2024-01-01',
          status: '无效状态'
        })
      ).rejects.toThrow('无效的投递状态');
    });

    test('当简历不存在时应该抛出错误', async () => {
      ResumeVersion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        applicationService.createApplication(resumeId, userId, {
          companyName: 'ABC公司',
          applyDate: '2024-01-01'
        })
      ).rejects.toThrow('简历不存在');
    });

    test('当用户无权操作简历时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: {
          id: positionId,
          user_id: 'other-user',
          name: '前端开发'
        }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        applicationService.createApplication(resumeId, userId, {
          companyName: 'ABC公司',
          applyDate: '2024-01-01'
        })
      ).rejects.toThrow('无权操作此简历');
    });
  });

  describe('getApplicationsByResumeId', () => {
    test('应该成功获取指定简历的所有投递记录', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockApplications = [
        {
          id: 'app-1',
          resume_id: resumeId,
          company_name: 'ABC公司',
          apply_date: '2024-01-02'
        },
        {
          id: 'app-2',
          resume_id: resumeId,
          company_name: 'XYZ公司',
          apply_date: '2024-01-01'
        }
      ];

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ApplicationRecord.findAll = jest.fn().mockResolvedValue(mockApplications);

      const result = await applicationService.getApplicationsByResumeId(resumeId, userId);

      expect(ResumeVersion.findByPk).toHaveBeenCalledWith(resumeId, expect.any(Object));
      expect(ApplicationRecord.findAll).toHaveBeenCalledWith({
        where: { resume_id: resumeId },
        order: [
          ['apply_date', 'DESC'],
          ['created_at', 'DESC']
        ]
      });
      expect(result).toEqual(mockApplications);
    });

    test('当简历不存在时应该抛出错误', async () => {
      ResumeVersion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        applicationService.getApplicationsByResumeId(resumeId, userId)
      ).rejects.toThrow('简历不存在');
    });

    test('当用户无权查看简历时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: 'other-user' }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        applicationService.getApplicationsByResumeId(resumeId, userId)
      ).rejects.toThrow('无权查看此简历的投递记录');
    });
  });

  describe('getApplicationsByUserId', () => {
    test('应该成功获取用户的所有投递记录', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          company_name: 'ABC公司',
          status: '已投递',
          apply_date: '2024-01-02',
          resume: {
            id: resumeId,
            title: '简历1',
            targetPosition: { id: positionId, user_id: userId }
          }
        }
      ];

      ApplicationRecord.findAll = jest.fn().mockResolvedValue(mockApplications);

      const result = await applicationService.getApplicationsByUserId(userId);

      expect(ApplicationRecord.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockApplications);
    });

    test('应该支持按状态筛选', async () => {
      ApplicationRecord.findAll = jest.fn().mockResolvedValue([]);

      await applicationService.getApplicationsByUserId(userId, { status: '已投递' });

      expect(ApplicationRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: '已投递' })
        })
      );
    });

    test('应该支持按日期范围筛选', async () => {
      ApplicationRecord.findAll = jest.fn().mockResolvedValue([]);

      await applicationService.getApplicationsByUserId(userId, {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      });

      expect(ApplicationRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            apply_date: expect.any(Object)
          })
        })
      );
    });

    test('应该支持只使用开始日期筛选', async () => {
      ApplicationRecord.findAll = jest.fn().mockResolvedValue([]);

      await applicationService.getApplicationsByUserId(userId, {
        dateFrom: '2024-01-01'
      });

      expect(ApplicationRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            apply_date: expect.any(Object)
          })
        })
      );
    });

    test('应该支持只使用结束日期筛选', async () => {
      ApplicationRecord.findAll = jest.fn().mockResolvedValue([]);

      await applicationService.getApplicationsByUserId(userId, {
        dateTo: '2024-12-31'
      });

      expect(ApplicationRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            apply_date: expect.any(Object)
          })
        })
      );
    });
  });

  describe('getApplicationById', () => {
    test('应该成功获取投递记录详情', async () => {
      const mockApplication = {
        id: applicationId,
        resume_id: resumeId,
        company_name: 'ABC公司',
        resume: {
          id: resumeId,
          title: '简历标题',
          targetPosition: {
            id: positionId,
            user_id: userId,
            name: '前端开发'
          }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      const result = await applicationService.getApplicationById(applicationId, userId);

      expect(ApplicationRecord.findByPk).toHaveBeenCalledWith(applicationId, expect.any(Object));
      expect(result).toEqual(mockApplication);
    });

    test('当投递记录不存在时应该抛出错误', async () => {
      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        applicationService.getApplicationById(applicationId, userId)
      ).rejects.toThrow('投递记录不存在');
    });

    test('当用户无权查看投递记录时应该抛出错误', async () => {
      const mockApplication = {
        id: applicationId,
        resume: {
          id: resumeId,
          targetPosition: {
            id: positionId,
            user_id: 'other-user'
          }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      await expect(
        applicationService.getApplicationById(applicationId, userId)
      ).rejects.toThrow('无权查看此投递记录');
    });
  });

  describe('updateApplication', () => {
    test('应该成功更新投递记录', async () => {
      const mockApplication = {
        id: applicationId,
        company_name: '旧公司',
        status: '已投递',
        update: jest.fn().mockResolvedValue(),
        resume: {
          id: resumeId,
          targetPosition: { user_id: userId }
        }
      };
      const updatedApplication = {
        id: applicationId,
        company_name: '新公司',
        status: '面试邀请',
        resume: {
          id: resumeId,
          targetPosition: { user_id: userId }
        }
      };

      // Mock both findByPk calls - one for update validation, one for getApplicationById
      ApplicationRecord.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockApplication)
        .mockResolvedValueOnce(updatedApplication);

      const result = await applicationService.updateApplication(applicationId, userId, {
        companyName: '新公司',
        status: '面试邀请'
      });

      expect(mockApplication.update).toHaveBeenCalledWith({
        company_name: '新公司',
        status: '面试邀请'
      });
      expect(result).toEqual(updatedApplication);
    });

    test('应该支持更新职位名称', async () => {
      const mockApplication = {
        update: jest.fn().mockResolvedValue(),
        resume: {
          targetPosition: { user_id: userId }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);
      jest.spyOn(applicationService, 'getApplicationById').mockResolvedValue({});

      await applicationService.updateApplication(applicationId, userId, {
        positionTitle: '高级前端工程师'
      });

      expect(mockApplication.update).toHaveBeenCalledWith({
        position_title: '高级前端工程师'
      });
    });

    test('应该支持更新投递日期', async () => {
      const mockApplication = {
        update: jest.fn().mockResolvedValue(),
        resume: {
          targetPosition: { user_id: userId }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);
      jest.spyOn(applicationService, 'getApplicationById').mockResolvedValue({});

      await applicationService.updateApplication(applicationId, userId, {
        applyDate: '2024-01-15'
      });

      expect(mockApplication.update).toHaveBeenCalledWith({
        apply_date: '2024-01-15'
      });
    });

    test('应该支持更新备注', async () => {
      const mockApplication = {
        update: jest.fn().mockResolvedValue(),
        resume: {
          targetPosition: { user_id: userId }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);
      jest.spyOn(applicationService, 'getApplicationById').mockResolvedValue({});

      await applicationService.updateApplication(applicationId, userId, {
        notes: '新备注'
      });

      expect(mockApplication.update).toHaveBeenCalledWith({
        notes: '新备注'
      });
    });

    test('当投递记录不存在时应该抛出错误', async () => {
      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        applicationService.updateApplication(applicationId, userId, { status: '已录用' })
      ).rejects.toThrow('投递记录不存在');
    });

    test('当用户无权修改投递记录时应该抛出错误', async () => {
      const mockApplication = {
        resume: {
          targetPosition: { user_id: 'other-user' }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      await expect(
        applicationService.updateApplication(applicationId, userId, { status: '已录用' })
      ).rejects.toThrow('无权修改此投递记录');
    });

    test('当公司名称为空时应该抛出错误', async () => {
      const mockApplication = {
        resume: {
          targetPosition: { user_id: userId }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      await expect(
        applicationService.updateApplication(applicationId, userId, { companyName: '  ' })
      ).rejects.toThrow('公司名称不能为空');
    });

    test('当公司名称超过200字符时应该抛出错误', async () => {
      const mockApplication = {
        resume: {
          targetPosition: { user_id: userId }
        }
      };
      const longName = 'a'.repeat(201);

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      await expect(
        applicationService.updateApplication(applicationId, userId, { companyName: longName })
      ).rejects.toThrow('公司名称不能超过200个字符');
    });

    test('当投递日期为未来日期时应该抛出错误', async () => {
      const mockApplication = {
        resume: {
          targetPosition: { user_id: userId }
        }
      };
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().slice(0, 10);

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      await expect(
        applicationService.updateApplication(applicationId, userId, { applyDate: futureDateStr })
      ).rejects.toThrow('投递日期不能为未来日期');
    });

    test('当状态无效时应该抛出错误', async () => {
      const mockApplication = {
        resume: {
          targetPosition: { user_id: userId }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      await expect(
        applicationService.updateApplication(applicationId, userId, { status: '无效状态' })
      ).rejects.toThrow('无效的投递状态');
    });
  });

  describe('deleteApplication', () => {
    test('应该成功删除投递记录', async () => {
      const mockApplication = {
        id: applicationId,
        destroy: jest.fn().mockResolvedValue(),
        resume: {
          targetPosition: { user_id: userId }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      const result = await applicationService.deleteApplication(applicationId, userId);

      expect(mockApplication.destroy).toHaveBeenCalled();
      expect(result).toEqual({
        message: '投递记录删除成功',
        deletedId: applicationId
      });
    });

    test('当投递记录不存在时应该抛出错误', async () => {
      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        applicationService.deleteApplication(applicationId, userId)
      ).rejects.toThrow('投递记录不存在');
    });

    test('当用户无权删除投递记录时应该抛出错误', async () => {
      const mockApplication = {
        resume: {
          targetPosition: { user_id: 'other-user' }
        }
      };

      ApplicationRecord.findByPk = jest.fn().mockResolvedValue(mockApplication);

      await expect(
        applicationService.deleteApplication(applicationId, userId)
      ).rejects.toThrow('无权删除此投递记录');
    });
  });

  describe('getApplicationStats', () => {
    test('应该成功获取用户的投递统计信息', async () => {
      const mockApplications = [
        { status: '已投递', apply_date: '2024-01-03' },
        { status: '已投递', apply_date: '2024-01-02' },
        { status: '面试邀请', apply_date: '2024-01-01' }
      ];

      ApplicationRecord.findAll = jest.fn().mockResolvedValue(mockApplications);

      const result = await applicationService.getApplicationStats(userId);

      expect(result).toEqual({
        total: 3,
        byStatus: {
          已投递: 2,
          面试邀请: 1,
          已拒绝: 0,
          已录用: 0
        },
        latestApplyDate: '2024-01-03',
        firstApplyDate: '2024-01-01'
      });
    });

    test('当没有投递记录时应该返回空统计', async () => {
      ApplicationRecord.findAll = jest.fn().mockResolvedValue([]);

      const result = await applicationService.getApplicationStats(userId);

      expect(result).toEqual({
        total: 0,
        byStatus: {
          已投递: 0,
          面试邀请: 0,
          已拒绝: 0,
          已录用: 0
        },
        latestApplyDate: null,
        firstApplyDate: null
      });
    });

    test('应该使用缓存包装函数', async () => {
      ApplicationRecord.findAll = jest.fn().mockResolvedValue([]);

      await applicationService.getApplicationStats(userId);

      expect(statsCache.wrap).toHaveBeenCalled();
      expect(LRUCache.generateKey).toHaveBeenCalledWith('stats', 'applications', userId);
    });
  });

  describe('clearStatsCache', () => {
    test('应该成功清除统计缓存', () => {
      applicationService.clearStatsCache(userId);

      expect(LRUCache.generateKey).toHaveBeenCalledWith('stats', 'applications', userId);
      expect(statsCache.delete).toHaveBeenCalled();
    });
  });
});
