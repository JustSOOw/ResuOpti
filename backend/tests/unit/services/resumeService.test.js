/**
 * resumeService 单元测试
 * 测试简历版本管理服务的所有功能
 */

const resumeService = require('../../../src/services/resumeService');
const {
  sequelize,
  ResumeVersion,
  ResumeMetadata,
  TargetPosition
} = require('../../../src/models');
const fs = require('fs').promises;

// Mock models and fs
jest.mock('../../../src/models');
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn()
  }
}));

describe('resumeService', () => {
  const userId = 'test-user-123';
  const targetPositionId = 'position-123';
  const resumeId = 'resume-123';

  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock transaction
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    };
    sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
  });

  describe('createFileResume', () => {
    test('应该成功创建文件类型简历', async () => {
      const mockPosition = {
        id: targetPositionId,
        user_id: userId,
        name: '前端开发'
      };
      const mockResume = {
        id: resumeId,
        type: 'file',
        title: '简历标题',
        file_path: '/uploads/resume.pdf',
        file_name: 'resume.pdf',
        file_size: 102400,
        toJSON: jest.fn().mockReturnValue({
          id: resumeId,
          type: 'file',
          title: '简历标题',
          file_path: '/uploads/resume.pdf',
          file_name: 'resume.pdf',
          file_size: 102400
        })
      };
      const mockMetadata = {
        resume_id: resumeId,
        notes: null,
        tags: [],
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: null,
          tags: []
        })
      };

      TargetPosition.findByPk = jest.fn().mockResolvedValue(mockPosition);
      ResumeVersion.create = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.create = jest.fn().mockResolvedValue(mockMetadata);

      const result = await resumeService.createFileResume(targetPositionId, userId, {
        title: '简历标题',
        filePath: '/uploads/resume.pdf',
        fileName: 'resume.pdf',
        fileSize: 102400
      });

      expect(TargetPosition.findByPk).toHaveBeenCalledWith(targetPositionId, expect.any(Object));
      expect(ResumeVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file',
          title: '简历标题'
        }),
        { transaction: mockTransaction }
      );
      expect(ResumeMetadata.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toHaveProperty('id', resumeId);
    });

    test('当标题为空时应该抛出错误', async () => {
      await expect(
        resumeService.createFileResume(targetPositionId, userId, {
          title: '',
          filePath: '/uploads/resume.pdf',
          fileName: 'resume.pdf',
          fileSize: 102400
        })
      ).rejects.toThrow('简历标题不能为空');
    });

    test('当标题超过200字符时应该抛出错误', async () => {
      const longTitle = 'a'.repeat(201);

      await expect(
        resumeService.createFileResume(targetPositionId, userId, {
          title: longTitle,
          filePath: '/uploads/resume.pdf',
          fileName: 'resume.pdf',
          fileSize: 102400
        })
      ).rejects.toThrow('简历标题长度必须在1-200字符之间');
    });

    test('当文件路径为空时应该抛出错误', async () => {
      await expect(
        resumeService.createFileResume(targetPositionId, userId, {
          title: '简历',
          filePath: '',
          fileName: 'resume.pdf',
          fileSize: 102400
        })
      ).rejects.toThrow('文件路径和文件名不能为空');
    });

    test('当文件大小超过10MB时应该抛出错误', async () => {
      await expect(
        resumeService.createFileResume(targetPositionId, userId, {
          title: '简历',
          filePath: '/uploads/resume.pdf',
          fileName: 'resume.pdf',
          fileSize: 11 * 1024 * 1024
        })
      ).rejects.toThrow('文件大小必须在0到10MB之间');
    });

    test('当目标岗位不存在时应该抛出错误', async () => {
      TargetPosition.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        resumeService.createFileResume(targetPositionId, userId, {
          title: '简历',
          filePath: '/uploads/resume.pdf',
          fileName: 'resume.pdf',
          fileSize: 102400
        })
      ).rejects.toThrow('目标岗位不存在');
    });

    test('当用户无权访问目标岗位时应该抛出错误', async () => {
      const mockPosition = {
        id: targetPositionId,
        user_id: 'other-user',
        name: '前端开发'
      };

      TargetPosition.findByPk = jest.fn().mockResolvedValue(mockPosition);

      await expect(
        resumeService.createFileResume(targetPositionId, userId, {
          title: '简历',
          filePath: '/uploads/resume.pdf',
          fileName: 'resume.pdf',
          fileSize: 102400
        })
      ).rejects.toThrow('您无权访问此目标岗位');
    });

    test('当创建失败时应该回滚事务', async () => {
      const mockPosition = {
        id: targetPositionId,
        user_id: userId,
        name: '前端开发'
      };

      TargetPosition.findByPk = jest.fn().mockResolvedValue(mockPosition);
      ResumeVersion.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        resumeService.createFileResume(targetPositionId, userId, {
          title: '简历',
          filePath: '/uploads/resume.pdf',
          fileName: 'resume.pdf',
          fileSize: 102400
        })
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('createOnlineResume', () => {
    test('应该成功创建在线类型简历', async () => {
      const mockPosition = {
        id: targetPositionId,
        user_id: userId,
        name: '前端开发'
      };
      const mockResume = {
        id: resumeId,
        type: 'online',
        title: '在线简历',
        content: '<p>简历内容</p>',
        toJSON: jest.fn().mockReturnValue({
          id: resumeId,
          type: 'online',
          title: '在线简历',
          content: '<p>简历内容</p>'
        })
      };
      const mockMetadata = {
        resume_id: resumeId,
        notes: null,
        tags: [],
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: null,
          tags: []
        })
      };

      TargetPosition.findByPk = jest.fn().mockResolvedValue(mockPosition);
      ResumeVersion.create = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.create = jest.fn().mockResolvedValue(mockMetadata);

      const result = await resumeService.createOnlineResume(targetPositionId, userId, {
        title: '在线简历',
        content: '<p>简历内容</p>'
      });

      expect(ResumeVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'online',
          title: '在线简历',
          content: '<p>简历内容</p>'
        }),
        { transaction: mockTransaction }
      );
      expect(result).toHaveProperty('type', 'online');
    });

    test('应该允许空字符串内容', async () => {
      const mockPosition = {
        id: targetPositionId,
        user_id: userId
      };
      const mockResume = {
        toJSON: jest.fn().mockReturnValue({ id: resumeId })
      };
      const mockMetadata = {
        toJSON: jest.fn().mockReturnValue({})
      };

      TargetPosition.findByPk = jest.fn().mockResolvedValue(mockPosition);
      ResumeVersion.create = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.create = jest.fn().mockResolvedValue(mockMetadata);

      await resumeService.createOnlineResume(targetPositionId, userId, {
        title: '简历',
        content: ''
      });

      expect(ResumeVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: ''
        }),
        { transaction: mockTransaction }
      );
    });

    test('当content字段缺失时应该抛出错误', async () => {
      await expect(
        resumeService.createOnlineResume(targetPositionId, userId, {
          title: '简历'
        })
      ).rejects.toThrow('在线简历必须提供content字段');
    });

    test('当content不是字符串时应该抛出错误', async () => {
      await expect(
        resumeService.createOnlineResume(targetPositionId, userId, {
          title: '简历',
          content: 123
        })
      ).rejects.toThrow('在线简历必须提供content字段');
    });
  });

  describe('getResumesByPosition', () => {
    test('应该成功获取岗位下的所有简历', async () => {
      const mockPosition = {
        id: targetPositionId,
        user_id: userId
      };
      const mockResumes = [
        {
          id: 'resume-1',
          type: 'online',
          title: '简历1',
          toJSON: jest.fn().mockReturnValue({
            id: 'resume-1',
            type: 'online',
            title: '简历1'
          })
        },
        {
          id: 'resume-2',
          type: 'file',
          title: '简历2',
          toJSON: jest.fn().mockReturnValue({
            id: 'resume-2',
            type: 'file',
            title: '简历2'
          })
        }
      ];

      TargetPosition.findByPk = jest.fn().mockResolvedValue(mockPosition);
      ResumeVersion.findAll = jest.fn().mockResolvedValue(mockResumes);

      const result = await resumeService.getResumesByPosition(targetPositionId, userId);

      expect(TargetPosition.findByPk).toHaveBeenCalled();
      expect(ResumeVersion.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { target_position_id: targetPositionId }
        })
      );
      expect(result).toHaveLength(2);
    });

    test('当岗位不存在时应该抛出错误', async () => {
      TargetPosition.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        resumeService.getResumesByPosition(targetPositionId, userId)
      ).rejects.toThrow('目标岗位不存在');
    });
  });

  describe('getResumeById', () => {
    test('应该成功获取简历详情', async () => {
      const mockResumeCheck = {
        id: resumeId,
        target_position_id: targetPositionId
      };
      const mockResume = {
        id: resumeId,
        type: 'online',
        title: '简历',
        targetPosition: {
          user_id: userId
        },
        toJSON: jest.fn().mockReturnValue({
          id: resumeId,
          type: 'online',
          title: '简历'
        })
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      const result = await resumeService.getResumeById(resumeId, userId);

      expect(result).toHaveProperty('id', resumeId);
    });

    test('当简历不存在时应该抛出错误', async () => {
      ResumeVersion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(resumeService.getResumeById(resumeId, userId)).rejects.toThrow(
        '简历不存在'
      );
    });

    test('当用户无权访问简历时应该抛出错误', async () => {
      const mockResumeCheck = {
        id: resumeId,
        target_position_id: targetPositionId
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(null);

      await expect(resumeService.getResumeById(resumeId, userId)).rejects.toThrow(
        '您无权访问此简历'
      );
    });
  });

  describe('updateOnlineResume', () => {
    test('应该成功更新在线简历', async () => {
      const mockResumeCheck = {
        id: resumeId,
        type: 'online'
      };
      const mockResume = {
        id: resumeId,
        type: 'online',
        title: '旧标题',
        content: '旧内容',
        update: jest.fn().mockResolvedValue(),
        reload: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          id: resumeId,
          type: 'online',
          title: '新标题',
          content: '新内容'
        })
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      const result = await resumeService.updateOnlineResume(resumeId, userId, {
        title: '新标题',
        content: '新内容'
      });

      expect(mockResume.update).toHaveBeenCalledWith({
        title: '新标题',
        content: '新内容'
      });
      expect(mockResume.reload).toHaveBeenCalled();
      expect(result).toHaveProperty('id', resumeId);
    });

    test('应该可以只更新标题', async () => {
      const mockResumeCheck = { id: resumeId, type: 'online' };
      const mockResume = {
        type: 'online',
        update: jest.fn().mockResolvedValue(),
        reload: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({})
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      await resumeService.updateOnlineResume(resumeId, userId, {
        title: '新标题'
      });

      expect(mockResume.update).toHaveBeenCalledWith({
        title: '新标题'
      });
    });

    test('应该可以只更新内容', async () => {
      const mockResumeCheck = { id: resumeId, type: 'online' };
      const mockResume = {
        type: 'online',
        update: jest.fn().mockResolvedValue(),
        reload: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({})
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      await resumeService.updateOnlineResume(resumeId, userId, {
        content: '新内容'
      });

      expect(mockResume.update).toHaveBeenCalledWith({
        content: '新内容'
      });
    });

    test('当简历不存在时应该抛出错误', async () => {
      ResumeVersion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        resumeService.updateOnlineResume(resumeId, userId, { title: '新标题' })
      ).rejects.toThrow('简历不存在');
    });

    test('当用户无权访问简历时应该抛出错误', async () => {
      const mockResumeCheck = { id: resumeId, type: 'online' };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(null);

      await expect(
        resumeService.updateOnlineResume(resumeId, userId, { title: '新标题' })
      ).rejects.toThrow('您无权访问此简历');
    });

    test('当尝试更新文件类型简历时应该抛出错误', async () => {
      const mockResumeCheck = { id: resumeId, type: 'file' };
      const mockResume = {
        type: 'file'
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      await expect(
        resumeService.updateOnlineResume(resumeId, userId, { title: '新标题' })
      ).rejects.toThrow('只能更新在线类型简历的内容');
    });

    test('当内容不是字符串时应该抛出错误', async () => {
      const mockResumeCheck = { id: resumeId, type: 'online' };
      const mockResume = {
        type: 'online'
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      await expect(
        resumeService.updateOnlineResume(resumeId, userId, { content: 123 })
      ).rejects.toThrow('在线简历内容必须是字符串');
    });

    test('当没有提供更新数据时应该抛出错误', async () => {
      const mockResumeCheck = { id: resumeId, type: 'online' };
      const mockResume = {
        type: 'online'
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      await expect(resumeService.updateOnlineResume(resumeId, userId, {})).rejects.toThrow(
        '没有提供需要更新的数据'
      );
    });
  });

  describe('updateResumeMetadata', () => {
    test('应该成功更新简历元数据', async () => {
      const mockMetadata = {
        id: 'metadata-123',
        resume_id: resumeId,
        notes: '旧备注',
        tags: ['旧标签'],
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '新备注',
          tags: ['新标签']
        })
      };
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: mockMetadata
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      const result = await resumeService.updateResumeMetadata(resumeId, userId, {
        notes: '新备注',
        tags: ['新标签']
      });

      expect(mockMetadata.update).toHaveBeenCalledWith({
        notes: '新备注',
        tags: ['新标签']
      });
      expect(result).toHaveProperty('notes', '新备注');
    });

    test('当元数据不存在时应该创建新元数据', async () => {
      const mockMetadata = {
        resume_id: resumeId,
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '备注',
          tags: []
        })
      };
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: null
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.create = jest.fn().mockResolvedValue(mockMetadata);

      const result = await resumeService.updateResumeMetadata(resumeId, userId, {
        notes: '备注'
      });

      expect(ResumeMetadata.create).toHaveBeenCalledWith({
        resume_id: resumeId,
        notes: null,
        tags: []
      });
      expect(mockMetadata.update).toHaveBeenCalledWith({
        notes: '备注'
      });
      expect(result).toHaveProperty('notes', '备注');
    });

    test('当没有提供更新字段时应该返回null', async () => {
      const result = await resumeService.updateResumeMetadata(resumeId, userId, {});

      expect(result).toBeNull();
    });

    test('当简历不存在时应该抛出错误', async () => {
      ResumeVersion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        resumeService.updateResumeMetadata(resumeId, userId, { notes: '备注' })
      ).rejects.toThrow('简历不存在或您无权访问');
    });

    test('当备注不是字符串时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: { update: jest.fn() }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        resumeService.updateResumeMetadata(resumeId, userId, { notes: 123 })
      ).rejects.toThrow('备注必须是字符串');
    });

    test('当备注长度超过2000字符时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: { update: jest.fn() }
      };
      const longNotes = 'a'.repeat(2001);

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        resumeService.updateResumeMetadata(resumeId, userId, { notes: longNotes })
      ).rejects.toThrow('备注长度不能超过2000字符');
    });

    test('当标签不是数组时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: { update: jest.fn() }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        resumeService.updateResumeMetadata(resumeId, userId, { tags: 'not-array' })
      ).rejects.toThrow('标签必须是数组');
    });

    test('当标签数量超过20个时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: { update: jest.fn() }
      };
      const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        resumeService.updateResumeMetadata(resumeId, userId, { tags: tooManyTags })
      ).rejects.toThrow('标签数量不能超过20个');
    });

    test('当标签长度超过50字符时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: { update: jest.fn() }
      };
      const longTag = 'a'.repeat(51);

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(
        resumeService.updateResumeMetadata(resumeId, userId, { tags: [longTag] })
      ).rejects.toThrow('每个标签长度不能超过50字符');
    });

    test('应该过滤空标签和非字符串标签', async () => {
      const mockMetadata = {
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({})
      };
      const mockResume = {
        id: resumeId,
        targetPosition: { user_id: userId },
        metadata: mockMetadata
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await resumeService.updateResumeMetadata(resumeId, userId, {
        tags: ['tag1', '', '  ', 123, 'tag2']
      });

      expect(mockMetadata.update).toHaveBeenCalledWith({
        tags: ['tag1', 'tag2']
      });
    });
  });

  describe('deleteResume', () => {
    test('应该成功删除在线类型简历', async () => {
      const mockResumeCheck = {
        id: resumeId,
        type: 'online',
        file_path: null
      };
      const mockResume = {
        id: resumeId,
        type: 'online',
        file_path: null,
        destroy: jest.fn().mockResolvedValue(),
        targetPosition: { user_id: userId }
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      const result = await resumeService.deleteResume(resumeId, userId);

      expect(mockResume.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: '简历删除成功',
        resumeId: resumeId,
        type: 'online'
      });
    });

    test('应该成功删除文件类型简历并删除文件', async () => {
      const mockResumeCheck = {
        id: resumeId,
        type: 'file',
        file_path: '/uploads/resume.pdf'
      };
      const mockResume = {
        id: resumeId,
        type: 'file',
        file_path: '/uploads/resume.pdf',
        destroy: jest.fn().mockResolvedValue(),
        targetPosition: { user_id: userId }
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);
      fs.unlink.mockResolvedValue();

      const result = await resumeService.deleteResume(resumeId, userId);

      expect(mockResume.destroy).toHaveBeenCalled();
      expect(fs.unlink).toHaveBeenCalled();
      expect(result.type).toBe('file');
    });

    test('文件删除失败不应该影响数据库删除', async () => {
      const mockResumeCheck = {
        id: resumeId,
        type: 'file',
        file_path: '/uploads/resume.pdf'
      };
      const mockResume = {
        id: resumeId,
        type: 'file',
        file_path: '/uploads/resume.pdf',
        destroy: jest.fn().mockResolvedValue(),
        targetPosition: { user_id: userId }
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);
      fs.unlink.mockRejectedValue(new Error('File not found'));

      // 使用 console.warn spy 来避免测试输出中显示警告
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await resumeService.deleteResume(resumeId, userId);

      expect(result.success).toBe(true);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    test('当简历不存在时应该抛出错误', async () => {
      ResumeVersion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(resumeService.deleteResume(resumeId, userId)).rejects.toThrow(
        '简历不存在'
      );
    });

    test('当用户无权访问简历时应该抛出错误', async () => {
      const mockResumeCheck = {
        id: resumeId,
        type: 'online'
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(null);

      await expect(resumeService.deleteResume(resumeId, userId)).rejects.toThrow(
        '您无权访问此简历'
      );
    });

    test('当删除失败时应该回滚事务', async () => {
      const mockResumeCheck = {
        id: resumeId,
        type: 'online'
      };
      const mockResume = {
        id: resumeId,
        type: 'online',
        destroy: jest.fn().mockRejectedValue(new Error('Database error')),
        targetPosition: { user_id: userId }
      };

      ResumeVersion.findByPk = jest
        .fn()
        .mockResolvedValueOnce(mockResumeCheck)
        .mockResolvedValueOnce(mockResume);

      await expect(resumeService.deleteResume(resumeId, userId)).rejects.toThrow(
        'Database error'
      );

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
