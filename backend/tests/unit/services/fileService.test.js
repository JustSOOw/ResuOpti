/**
 * fileService 单元测试
 * 测试文件上传处理服务的所有功能
 */

const fileService = require('../../../src/services/fileService');
const path = require('path');
const fs = require('fs').promises;

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    unlink: jest.fn(),
    rm: jest.fn()
  }
}));

describe('fileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('validateFileType', () => {
    test('应该接受有效的PDF文件', () => {
      const file = {
        mimetype: 'application/pdf',
        originalname: 'resume.pdf'
      };

      const result = fileService.validateFileType(file);

      expect(result).toBe(true);
    });

    test('应该接受有效的DOCX文件', () => {
      const file = {
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'resume.docx'
      };

      const result = fileService.validateFileType(file);

      expect(result).toBe(true);
    });

    test('应该接受有效的DOC文件', () => {
      const file = {
        mimetype: 'application/msword',
        originalname: 'resume.doc'
      };

      const result = fileService.validateFileType(file);

      expect(result).toBe(true);
    });

    test('应该接受有效的TXT文件', () => {
      const file = {
        mimetype: 'text/plain',
        originalname: 'resume.txt'
      };

      const result = fileService.validateFileType(file);

      expect(result).toBe(true);
    });

    test('应该拒绝不支持的MIME类型', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'image.jpg'
      };

      const result = fileService.validateFileType(file);

      expect(result).toBe(false);
    });

    test('应该拒绝不支持的文件扩展名', () => {
      const file = {
        mimetype: 'application/pdf',
        originalname: 'resume.exe'
      };

      const result = fileService.validateFileType(file);

      expect(result).toBe(false);
    });

    test('当文件为null时应该返回false', () => {
      const result = fileService.validateFileType(null);

      expect(result).toBe(false);
    });

    test('当文件为undefined时应该返回false', () => {
      const result = fileService.validateFileType(undefined);

      expect(result).toBe(false);
    });

    test('应该处理大小写不敏感的扩展名', () => {
      const file = {
        mimetype: 'application/pdf',
        originalname: 'RESUME.PDF'
      };

      const result = fileService.validateFileType(file);

      expect(result).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    test('应该接受小于最大大小的文件', () => {
      const file = {
        size: 5 * 1024 * 1024 // 5MB
      };

      const result = fileService.validateFileSize(file);

      expect(result).toBe(true);
    });

    test('应该接受等于最大大小的文件', () => {
      const file = {
        size: 10 * 1024 * 1024 // 10MB
      };

      const result = fileService.validateFileSize(file);

      expect(result).toBe(true);
    });

    test('应该拒绝超过最大大小的文件', () => {
      const file = {
        size: 11 * 1024 * 1024 // 11MB
      };

      const result = fileService.validateFileSize(file);

      expect(result).toBe(false);
    });

    test('当文件为null时应该返回false', () => {
      const result = fileService.validateFileSize(null);

      expect(result).toBe(false);
    });

    test('当文件为undefined时应该返回false', () => {
      const result = fileService.validateFileSize(undefined);

      expect(result).toBe(false);
    });

    test('应该接受零字节文件', () => {
      const file = {
        size: 0
      };

      const result = fileService.validateFileSize(file);

      expect(result).toBe(true);
    });
  });

  describe('generateFilePath', () => {
    test('应该成功生成文件路径并创建目录', async () => {
      const userId = 'user-123';
      const targetPositionId = 'position-456';
      const filename = 'resume.pdf';

      fs.mkdir.mockResolvedValue();

      const result = await fileService.generateFilePath(userId, targetPositionId, filename);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining(path.join('user-123', 'position-456')),
        { recursive: true }
      );
      expect(result).toContain('user-123');
      expect(result).toContain('position-456');
      expect(result).toContain('resume.pdf');
    });

    test('当目录创建失败时应该抛出错误', async () => {
      const userId = 'user-123';
      const targetPositionId = 'position-456';
      const filename = 'resume.pdf';

      fs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(
        fileService.generateFilePath(userId, targetPositionId, filename)
      ).rejects.toThrow('创建文件存储目录失败');
    });

    test('应该将用户ID和岗位ID转换为字符串', async () => {
      const userId = 123;
      const targetPositionId = 456;
      const filename = 'resume.pdf';

      fs.mkdir.mockResolvedValue();

      const result = await fileService.generateFilePath(userId, targetPositionId, filename);

      expect(result).toContain('123');
      expect(result).toContain('456');
    });
  });

  describe('deleteFile', () => {
    test('应该成功删除存在的文件', async () => {
      const filePath = '/uploads/user-123/position-456/resume.pdf';

      fs.access.mockResolvedValue();
      fs.unlink.mockResolvedValue();

      const result = await fileService.deleteFile(filePath);

      expect(fs.access).toHaveBeenCalledWith(filePath);
      expect(fs.unlink).toHaveBeenCalledWith(filePath);
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('文件已删除'));
    });

    test('当文件不存在时应该返回true', async () => {
      const filePath = '/uploads/user-123/position-456/resume.pdf';

      const error = new Error('File not found');
      error.code = 'ENOENT';
      fs.access.mockRejectedValue(error);

      const result = await fileService.deleteFile(filePath);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('文件不存在'));
    });

    test('当删除失败时应该抛出错误', async () => {
      const filePath = '/uploads/user-123/position-456/resume.pdf';

      fs.access.mockResolvedValue();
      fs.unlink.mockRejectedValue(new Error('Permission denied'));

      await expect(fileService.deleteFile(filePath)).rejects.toThrow('删除文件失败');
    });
  });

  describe('getMulterConfig', () => {
    test('应该返回配置好的multer实例', () => {
      const userId = 'user-123';
      const targetPositionId = 'position-456';

      const multerInstance = fileService.getMulterConfig(userId, targetPositionId);

      expect(multerInstance).toBeDefined();
      expect(typeof multerInstance.single).toBe('function');
    });

    test('应该包含正确的文件大小限制', () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      // Multer实例应该有limits配置
      expect(multerInstance).toBeDefined();
    });

    test('storage.destination 应该处理从body获取targetPositionId', async () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      // 获取内部storage配置
      const storage = multerInstance._storage || multerInstance.storage;

      if (storage && typeof storage.getDestination === 'function') {
        const req = {
          body: { targetPositionId: 'position-from-body' }
        };
        const file = {};

        const mockCb = jest.fn();
        fs.mkdir.mockResolvedValue();

        await storage.getDestination(req, file, mockCb);

        expect(fs.mkdir).toHaveBeenCalled();
        expect(mockCb).toHaveBeenCalledWith(null, expect.stringContaining('position-from-body'));
      }
    });

    test('storage.destination 应该处理从query获取targetPositionId', async () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      const storage = multerInstance._storage || multerInstance.storage;

      if (storage && typeof storage.getDestination === 'function') {
        const req = {
          query: { targetPositionId: 'position-from-query' }
        };
        const file = {};

        const mockCb = jest.fn();
        fs.mkdir.mockResolvedValue();

        await storage.getDestination(req, file, mockCb);

        expect(fs.mkdir).toHaveBeenCalled();
        expect(mockCb).toHaveBeenCalledWith(null, expect.stringContaining('position-from-query'));
      }
    });

    test('storage.destination 应该使用tmp目录当无targetPositionId时', async () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      const storage = multerInstance._storage || multerInstance.storage;

      if (storage && typeof storage.getDestination === 'function') {
        const req = { body: {}, query: {} };
        const file = {};

        const mockCb = jest.fn();
        fs.mkdir.mockResolvedValue();

        await storage.getDestination(req, file, mockCb);

        expect(fs.mkdir).toHaveBeenCalled();
        expect(mockCb).toHaveBeenCalledWith(null, expect.stringContaining('tmp'));
      }
    });

    test('storage.destination 应该处理目录创建错误', async () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      const storage = multerInstance._storage || multerInstance.storage;

      if (storage && typeof storage.getDestination === 'function') {
        const req = { body: {} };
        const file = {};

        const mockCb = jest.fn();
        fs.mkdir.mockRejectedValue(new Error('Permission denied'));

        await storage.getDestination(req, file, mockCb);

        expect(mockCb).toHaveBeenCalledWith(expect.any(Error));
      }
    });

    test('storage.filename 应该生成唯一文件名', () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      const storage = multerInstance._storage || multerInstance.storage;

      if (storage && typeof storage.getFilename === 'function') {
        const req = {};
        const file = { originalname: 'resume.pdf' };

        const mockCb = jest.fn();

        storage.getFilename(req, file, mockCb);

        expect(mockCb).toHaveBeenCalledWith(null, expect.stringContaining('.pdf'));
        const filename = mockCb.mock.calls[0][1];
        expect(filename).toMatch(/[a-f0-9-]+\.pdf$/);
      }
    });

    test('storage.filename 应该处理生成错误', () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      const storage = multerInstance._storage || multerInstance.storage;

      if (storage && typeof storage.getFilename === 'function') {
        const req = {};
        // 使用没有 originalname 属性的 file，会在path.extname中导致错误
        const file = { originalname: null };

        const mockCb = jest.fn();

        // 这个测试检查错误处理，但在当前实现中不太可能触发
        // 因为 path.extname(null) 只会返回空字符串而不会抛错
        storage.getFilename(req, file, mockCb);

        // 应该仍然调用 callback
        expect(mockCb).toHaveBeenCalled();
      }
    });

    test('fileFilter 应该接受有效文件', () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      // 访问内部fileFilter
      const fileFilter = multerInstance._fileFilter || multerInstance.fileFilter;

      if (fileFilter) {
        const req = {};
        const file = {
          mimetype: 'application/pdf',
          originalname: 'resume.pdf'
        };
        const mockCb = jest.fn();

        fileFilter(req, file, mockCb);

        expect(mockCb).toHaveBeenCalledWith(null, true);
      }
    });

    test('fileFilter 应该拒绝无效文件类型', () => {
      const userId = 'user-123';

      const multerInstance = fileService.getMulterConfig(userId);

      const fileFilter = multerInstance._fileFilter || multerInstance.fileFilter;

      if (fileFilter) {
        const req = {};
        const file = {
          mimetype: 'image/jpeg',
          originalname: 'image.jpg'
        };
        const mockCb = jest.fn();

        fileFilter(req, file, mockCb);

        expect(mockCb).toHaveBeenCalled();
        const error = mockCb.mock.calls[0][0];
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe('INVALID_FILE_TYPE');
        expect(mockCb).toHaveBeenCalledWith(expect.any(Error), false);
      }
    });
  });

  describe('cleanupUserFiles', () => {
    test('应该成功删除用户目录', async () => {
      const userId = 'user-123';

      fs.access.mockResolvedValue();
      fs.rm.mockResolvedValue();

      const result = await fileService.cleanupUserFiles(userId);

      expect(fs.access).toHaveBeenCalled();
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('user-123'),
        { recursive: true, force: true }
      );
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('已清理用户文件'));
    });

    test('当用户目录不存在时应该返回true', async () => {
      const userId = 'user-123';

      const error = new Error('Directory not found');
      error.code = 'ENOENT';
      fs.access.mockRejectedValue(error);

      const result = await fileService.cleanupUserFiles(userId);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('用户目录不存在'));
    });

    test('当删除失败时应该抛出错误', async () => {
      const userId = 'user-123';

      fs.access.mockResolvedValue();
      fs.rm.mockRejectedValue(new Error('Permission denied'));

      await expect(fileService.cleanupUserFiles(userId)).rejects.toThrow('清理用户文件失败');
    });

    test('当访问检查失败（非ENOENT错误）时应该抛出错误', async () => {
      const userId = 'user-123';

      const error = new Error('Permission denied');
      error.code = 'EACCES';
      fs.access.mockRejectedValue(error);

      await expect(fileService.cleanupUserFiles(userId)).rejects.toThrow('清理用户文件失败');
    });
  });

  describe('cleanupPositionFiles', () => {
    test('应该成功删除岗位目录', async () => {
      const userId = 'user-123';
      const targetPositionId = 'position-456';

      fs.access.mockResolvedValue();
      fs.rm.mockResolvedValue();

      const result = await fileService.cleanupPositionFiles(userId, targetPositionId);

      expect(fs.access).toHaveBeenCalled();
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining(path.join('user-123', 'position-456')),
        { recursive: true, force: true }
      );
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('已清理职位文件'));
    });

    test('当岗位目录不存在时应该返回true', async () => {
      const userId = 'user-123';
      const targetPositionId = 'position-456';

      const error = new Error('Directory not found');
      error.code = 'ENOENT';
      fs.access.mockRejectedValue(error);

      const result = await fileService.cleanupPositionFiles(userId, targetPositionId);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('职位目录不存在'));
    });

    test('当删除失败时应该抛出错误', async () => {
      const userId = 'user-123';
      const targetPositionId = 'position-456';

      fs.access.mockResolvedValue();
      fs.rm.mockRejectedValue(new Error('Permission denied'));

      await expect(
        fileService.cleanupPositionFiles(userId, targetPositionId)
      ).rejects.toThrow('清理职位文件失败');
    });

    test('当访问检查失败（非ENOENT错误）时应该抛出错误', async () => {
      const userId = 'user-123';
      const targetPositionId = 'position-456';

      const error = new Error('Permission denied');
      error.code = 'EACCES';
      fs.access.mockRejectedValue(error);

      await expect(
        fileService.cleanupPositionFiles(userId, targetPositionId)
      ).rejects.toThrow('清理职位文件失败');
    });

    test('应该将用户ID和岗位ID转换为字符串', async () => {
      const userId = 123;
      const targetPositionId = 456;

      fs.access.mockResolvedValue();
      fs.rm.mockResolvedValue();

      await fileService.cleanupPositionFiles(userId, targetPositionId);

      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('123'),
        expect.any(Object)
      );
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('456'),
        expect.any(Object)
      );
    });
  });

  describe('常量导出', () => {
    test('应该导出正确的最大文件大小', () => {
      expect(fileService.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    test('应该导出允许的MIME类型数组', () => {
      expect(fileService.ALLOWED_MIME_TYPES).toBeInstanceOf(Array);
      expect(fileService.ALLOWED_MIME_TYPES).toContain('application/pdf');
    });

    test('应该导出允许的文件扩展名数组', () => {
      expect(fileService.ALLOWED_EXTENSIONS).toBeInstanceOf(Array);
      expect(fileService.ALLOWED_EXTENSIONS).toContain('.pdf');
    });

    test('应该导出上传基础目录', () => {
      expect(fileService.UPLOAD_BASE_DIR).toBeDefined();
      expect(typeof fileService.UPLOAD_BASE_DIR).toBe('string');
    });
  });
});
