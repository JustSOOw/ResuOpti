/**
 * metadataService 单元测试
 * 测试简历元数据管理服务的所有功能
 */

const metadataService = require('../../../src/services/metadataService');
const { ResumeMetadata, ResumeVersion, TargetPosition } = require('../../../src/models');
const { metadataCache, LRUCache } = require('../../../src/utils/cache');

// Mock models
jest.mock('../../../src/models');
jest.mock('../../../src/utils/cache');

describe('metadataService', () => {
  const userId = 'test-user-123';
  const resumeId = 'resume-123';
  const positionId = 'position-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cache utilities
    LRUCache.generateKey = jest.fn((type, id) => `${type}:${id}`);
    metadataCache.wrap = jest.fn((key, fn) => fn());
    metadataCache.set = jest.fn();
  });

  describe('getMetadataByResumeId', () => {
    test('应该成功获取已存在的元数据', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: {
          id: positionId,
          user_id: userId,
          name: '前端开发'
        }
      };
      const mockMetadata = {
        id: 'metadata-123',
        resume_id: resumeId,
        notes: '测试备注',
        tags: ['tag1', 'tag2'],
        created_at: new Date(),
        updated_at: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 'metadata-123',
          resume_id: resumeId,
          notes: '测试备注',
          tags: ['tag1', 'tag2']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.getMetadataByResumeId(resumeId, userId);

      expect(ResumeVersion.findByPk).toHaveBeenCalledWith(resumeId, expect.any(Object));
      expect(ResumeMetadata.findOne).toHaveBeenCalled();
      expect(result).toHaveProperty('notes', '测试备注');
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    test('应该在元数据不存在时自动创建', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: {
          id: positionId,
          user_id: userId,
          name: '前端开发'
        }
      };
      const newMetadata = {
        id: 'new-metadata',
        resume_id: resumeId,
        notes: null,
        tags: [],
        toJSON: jest.fn().mockReturnValue({
          id: 'new-metadata',
          resume_id: resumeId,
          notes: null,
          tags: []
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(null);
      ResumeMetadata.create = jest.fn().mockResolvedValue(newMetadata);

      const result = await metadataService.getMetadataByResumeId(resumeId, userId);

      expect(ResumeMetadata.create).toHaveBeenCalledWith({
        resume_id: resumeId,
        notes: null,
        tags: []
      });
      expect(result).toHaveProperty('resume_id', resumeId);
      expect(result.tags).toEqual([]);
    });

    test('当简历不存在时应该抛出错误', async () => {
      ResumeVersion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(metadataService.getMetadataByResumeId(resumeId, userId)).rejects.toThrow(
        '简历不存在'
      );
    });

    test('当用户无权访问简历时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: {
          id: positionId,
          user_id: 'other-user',
          name: '前端开发'
        }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(metadataService.getMetadataByResumeId(resumeId, userId)).rejects.toThrow(
        '无权限访问该简历'
      );
    });
  });

  describe('updateNotes', () => {
    test('应该成功更新已存在元数据的备注', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        notes: '旧备注',
        tags: ['tag1'],
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '新备注',
          tags: ['tag1']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.updateNotes(resumeId, userId, '新备注');

      expect(mockMetadata.notes).toBe('新备注');
      expect(mockMetadata.save).toHaveBeenCalled();
      expect(metadataCache.set).toHaveBeenCalled();
      expect(result.notes).toBe('新备注');
    });

    test('应该在元数据不存在时创建新记录', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const newMetadata = {
        resume_id: resumeId,
        notes: '新备注',
        tags: [],
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '新备注',
          tags: []
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(null);
      ResumeMetadata.create = jest.fn().mockResolvedValue(newMetadata);

      const result = await metadataService.updateNotes(resumeId, userId, '新备注');

      expect(ResumeMetadata.create).toHaveBeenCalledWith({
        resume_id: resumeId,
        notes: '新备注',
        tags: []
      });
      expect(result.notes).toBe('新备注');
    });

    test('当备注超过2000字符时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      const longNotes = 'a'.repeat(2001);

      await expect(metadataService.updateNotes(resumeId, userId, longNotes)).rejects.toThrow(
        '备注长度不能超过2000字符'
      );
    });
  });

  describe('addTag', () => {
    test('应该成功添加新标签到已存在的元数据', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        tags: ['tag1'],
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: null,
          tags: ['tag1', 'tag2']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.addTag(resumeId, userId, 'tag2');

      expect(mockMetadata.tags).toEqual(['tag1', 'tag2']);
      expect(mockMetadata.save).toHaveBeenCalled();
      expect(result.tags).toContain('tag2');
    });

    test('应该在元数据不存在时创建新记录并添加标签', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const newMetadata = {
        resume_id: resumeId,
        notes: null,
        tags: ['tag1'],
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: null,
          tags: ['tag1']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(null);
      ResumeMetadata.create = jest.fn().mockResolvedValue(newMetadata);

      const result = await metadataService.addTag(resumeId, userId, 'tag1');

      expect(ResumeMetadata.create).toHaveBeenCalledWith({
        resume_id: resumeId,
        notes: null,
        tags: ['tag1']
      });
      expect(result.tags).toEqual(['tag1']);
    });

    test('当标签为空字符串时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(metadataService.addTag(resumeId, userId, '  ')).rejects.toThrow(
        '标签必须是非空字符串'
      );
    });

    test('当标签不是字符串时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(metadataService.addTag(resumeId, userId, 123)).rejects.toThrow(
        '标签必须是非空字符串'
      );
    });

    test('当标签超过50字符时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      const longTag = 'a'.repeat(51);

      await expect(metadataService.addTag(resumeId, userId, longTag)).rejects.toThrow(
        '标签长度不能超过50字符'
      );
    });

    test('当标签已存在时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        tags: ['tag1'],
        save: jest.fn()
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      await expect(metadataService.addTag(resumeId, userId, 'tag1')).rejects.toThrow(
        '标签已存在'
      );
    });

    test('当标签数量达到20个时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        tags: Array.from({ length: 20 }, (_, i) => `tag${i}`),
        save: jest.fn()
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      await expect(metadataService.addTag(resumeId, userId, 'newTag')).rejects.toThrow(
        '标签数量不能超过20个'
      );
    });
  });

  describe('removeTag', () => {
    test('应该成功删除指定标签', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        tags: ['tag1', 'tag2', 'tag3'],
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: null,
          tags: ['tag1', 'tag3']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.removeTag(resumeId, userId, 'tag2');

      expect(mockMetadata.tags).toEqual(['tag1', 'tag3']);
      expect(mockMetadata.save).toHaveBeenCalled();
      expect(result.tags).not.toContain('tag2');
    });

    test('当元数据不存在时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(null);

      await expect(metadataService.removeTag(resumeId, userId, 'tag1')).rejects.toThrow(
        '元数据不存在'
      );
    });
  });

  describe('updateTags', () => {
    test('应该成功批量更新标签', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        tags: ['old1', 'old2'],
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: null,
          tags: ['new1', 'new2', 'new3']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.updateTags(resumeId, userId, ['new1', 'new2', 'new3']);

      expect(mockMetadata.tags).toEqual(['new1', 'new2', 'new3']);
      expect(mockMetadata.save).toHaveBeenCalled();
      expect(result.tags).toHaveLength(3);
    });

    test('应该在元数据不存在时创建新记录', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const newMetadata = {
        resume_id: resumeId,
        notes: null,
        tags: ['tag1', 'tag2'],
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: null,
          tags: ['tag1', 'tag2']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(null);
      ResumeMetadata.create = jest.fn().mockResolvedValue(newMetadata);

      const result = await metadataService.updateTags(resumeId, userId, ['tag1', 'tag2']);

      expect(ResumeMetadata.create).toHaveBeenCalledWith({
        resume_id: resumeId,
        notes: null,
        tags: ['tag1', 'tag2']
      });
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    test('当标签不是数组时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(metadataService.updateTags(resumeId, userId, 'not-array')).rejects.toThrow(
        '标签必须是数组格式'
      );
    });

    test('当标签数量超过20个时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);

      await expect(metadataService.updateTags(resumeId, userId, tooManyTags)).rejects.toThrow(
        '标签数量不能超过20个'
      );
    });

    test('当标签数组包含非字符串元素时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(metadataService.updateTags(resumeId, userId, ['tag1', 123, 'tag3'])).rejects.toThrow(
        '每个标签必须是非空字符串'
      );
    });

    test('当标签数组包含空字符串时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(metadataService.updateTags(resumeId, userId, ['tag1', '  ', 'tag3'])).rejects.toThrow(
        '每个标签必须是非空字符串'
      );
    });

    test('当标签长度超过50字符时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      const longTag = 'a'.repeat(51);

      await expect(
        metadataService.updateTags(resumeId, userId, ['tag1', longTag])
      ).rejects.toThrow('每个标签长度不能超过50字符');
    });
  });

  describe('updateMetadata', () => {
    test('应该成功同时更新备注和标签', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        notes: '旧备注',
        tags: ['old'],
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '新备注',
          tags: ['new1', 'new2']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.updateMetadata(resumeId, userId, {
        notes: '新备注',
        tags: ['new1', 'new2']
      });

      expect(mockMetadata.notes).toBe('新备注');
      expect(mockMetadata.tags).toEqual(['new1', 'new2']);
      expect(mockMetadata.save).toHaveBeenCalled();
      expect(result.notes).toBe('新备注');
    });

    test('应该可以只更新备注', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        notes: '旧备注',
        tags: ['tag1'],
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '新备注',
          tags: ['tag1']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.updateMetadata(resumeId, userId, {
        notes: '新备注'
      });

      expect(mockMetadata.notes).toBe('新备注');
      expect(mockMetadata.tags).toEqual(['tag1']);
      expect(result.notes).toBe('新备注');
    });

    test('应该可以只更新标签', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        notes: '备注',
        tags: ['old'],
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '备注',
          tags: ['new1', 'new2']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const result = await metadataService.updateMetadata(resumeId, userId, {
        tags: ['new1', 'new2']
      });

      expect(mockMetadata.notes).toBe('备注');
      expect(mockMetadata.tags).toEqual(['new1', 'new2']);
      expect(result.tags).toEqual(['new1', 'new2']);
    });

    test('当未提供任何更新字段时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);

      await expect(metadataService.updateMetadata(resumeId, userId, {})).rejects.toThrow(
        '至少需要提供一个更新字段'
      );
    });

    test('应该在元数据不存在时创建新记录', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const newMetadata = {
        resume_id: resumeId,
        notes: '新备注',
        tags: ['tag1'],
        toJSON: jest.fn().mockReturnValue({
          resume_id: resumeId,
          notes: '新备注',
          tags: ['tag1']
        })
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(null);
      ResumeMetadata.create = jest.fn().mockResolvedValue(newMetadata);

      const result = await metadataService.updateMetadata(resumeId, userId, {
        notes: '新备注',
        tags: ['tag1']
      });

      expect(ResumeMetadata.create).toHaveBeenCalledWith({
        resume_id: resumeId,
        notes: '新备注',
        tags: ['tag1']
      });
      expect(result.notes).toBe('新备注');
    });

    test('当备注长度超过2000字符时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        notes: '旧备注',
        tags: [],
        save: jest.fn()
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      const longNotes = 'a'.repeat(2001);

      await expect(
        metadataService.updateMetadata(resumeId, userId, { notes: longNotes })
      ).rejects.toThrow('备注长度不能超过2000字符');
    });

    test('当标签验证失败时应该抛出错误', async () => {
      const mockResume = {
        id: resumeId,
        targetPosition: { id: positionId, user_id: userId }
      };
      const mockMetadata = {
        notes: '备注',
        tags: ['tag1'],
        save: jest.fn()
      };

      ResumeVersion.findByPk = jest.fn().mockResolvedValue(mockResume);
      ResumeMetadata.findOne = jest.fn().mockResolvedValue(mockMetadata);

      await expect(
        metadataService.updateMetadata(resumeId, userId, { tags: 'not-array' })
      ).rejects.toThrow('标签必须是数组格式');
    });
  });

  describe('searchByTag', () => {
    test('应该成功根据标签搜索简历', async () => {
      const mockMetadataList = [
        {
          id: 'metadata-1',
          resume_id: 'resume-1',
          notes: '备注1',
          tags: ['前端', 'React'],
          created_at: new Date(),
          updated_at: new Date(),
          resume: {
            id: 'resume-1',
            type: 'online',
            title: '前端开发简历',
            created_at: new Date(),
            updated_at: new Date(),
            targetPosition: {
              id: 'position-1',
              name: '前端工程师',
              description: '描述1'
            }
          }
        },
        {
          id: 'metadata-2',
          resume_id: 'resume-2',
          notes: '备注2',
          tags: ['前端', 'Vue'],
          created_at: new Date(),
          updated_at: new Date(),
          resume: {
            id: 'resume-2',
            type: 'file',
            title: '前端开发简历2',
            created_at: new Date(),
            updated_at: new Date(),
            targetPosition: {
              id: 'position-2',
              name: '前端开发',
              description: '描述2'
            }
          }
        }
      ];

      ResumeMetadata.findAll = jest.fn().mockResolvedValue(mockMetadataList);

      const result = await metadataService.searchByTag(userId, '前端');

      expect(ResumeMetadata.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          include: expect.any(Array)
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('metadata');
      expect(result[0]).toHaveProperty('resume');
      expect(result[0]).toHaveProperty('targetPosition');
      expect(result[0].metadata.tags).toContain('前端');
    });

    test('当没有找到匹配的简历时应该返回空数组', async () => {
      ResumeMetadata.findAll = jest.fn().mockResolvedValue([]);

      const result = await metadataService.searchByTag(userId, '不存在的标签');

      expect(result).toEqual([]);
    });
  });
});
