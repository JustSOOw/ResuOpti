/**
 * 文件上传中间件单元测试
 * 测试文件上传处理和错误处理
 */

const multer = require('multer');
const path = require('path');
const {
  handleUploadError,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES
} = require('../../../src/middleware/upload');

describe('Upload Middleware - handleUploadError', () => {
  let req, res, next, consoleErrorSpy;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('没有错误时', () => {
    it('应该调用next()当没有错误', () => {
      handleUploadError(null, req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('应该调用next()当错误为undefined', () => {
      handleUploadError(undefined, req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Multer错误处理', () => {
    describe('LIMIT_FILE_SIZE', () => {
      it('应该返回400并提示文件大小超限', () => {
        const err = new multer.MulterError('LIMIT_FILE_SIZE', 'file');

        handleUploadError(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: `文件大小超过限制，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('应该正确计算MB值', () => {
        const err = new multer.MulterError('LIMIT_FILE_SIZE', 'file');
        handleUploadError(err, req, res, next);

        const expectedSize = MAX_FILE_SIZE / 1024 / 1024;
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining(`${expectedSize}MB`)
          })
        );
      });
    });

    describe('LIMIT_FILE_COUNT', () => {
      it('应该返回400并提示文件数量超限', () => {
        const err = new multer.MulterError('LIMIT_FILE_COUNT', 'file');

        handleUploadError(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: '上传文件数量超过限制'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('LIMIT_UNEXPECTED_FILE', () => {
      it('应该返回400并提示字段名错误', () => {
        const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'wrongField');

        handleUploadError(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: '上传字段名错误，请使用"file"字段上传文件'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('其他Multer错误', () => {
      it('应该返回400并显示错误消息', () => {
        const err = new multer.MulterError('UNKNOWN_ERROR', 'file');
        err.message = '未知的Multer错误';

        handleUploadError(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: '文件上传错误: 未知的Multer错误'
        });
      });

      it('应该处理没有message的Multer错误', () => {
        const err = new multer.MulterError('SOME_ERROR', 'file');
        delete err.message;

        handleUploadError(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: expect.stringContaining('文件上传错误')
        });
      });
    });
  });

  describe('文件类型错误处理', () => {
    it('应该处理不支持的文件类型错误', () => {
      const err = new Error('不支持的文件类型。仅支持 .pdf, .docx, .doc 格式');

      handleUploadError(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '不支持的文件类型。仅支持 .pdf, .docx, .doc 格式'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该识别包含"不支持的文件类型"的错误消息', () => {
      const err = new Error('不支持的文件类型，请上传PDF文件');

      handleUploadError(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '不支持的文件类型，请上传PDF文件'
      });
    });
  });

  describe('未知错误处理', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('应该返回500并记录错误', () => {
      const err = new Error('未知错误');

      handleUploadError(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '文件上传失败，请稍后重试',
        error: '未知错误'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('文件上传错误:', err);
    });

    it('应该在开发环境显示错误详情', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('详细错误信息');

      handleUploadError(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '详细错误信息'
        })
      );
    });

    it('应该在生产环境隐藏错误详情', () => {
      process.env.NODE_ENV = 'production';
      const err = new Error('敏感错误信息');

      handleUploadError(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '文件上传失败，请稍后重试',
        error: undefined
      });
    });

    it('应该处理没有message的错误对象', () => {
      const err = {};

      handleUploadError(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('应该处理null错误对象', () => {
      const err = { message: null };

      handleUploadError(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('边界情况', () => {
    it('应该处理MulterError实例检查', () => {
      // 创建一个看起来像MulterError但不是的对象
      const fakeMulterError = {
        code: 'LIMIT_FILE_SIZE',
        message: 'File too large'
      };

      handleUploadError(fakeMulterError, req, res, next);

      // 应该被当作未知错误处理
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('应该处理错误消息为空字符串', () => {
      const err = new Error('');

      handleUploadError(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('应该处理MulterError的不同错误码', () => {
      const errorCodes = [
        'LIMIT_PART_COUNT',
        'LIMIT_FIELD_KEY',
        'LIMIT_FIELD_VALUE',
        'LIMIT_FIELD_COUNT'
      ];

      errorCodes.forEach((code) => {
        res.status.mockClear();
        res.json.mockClear();

        const err = new multer.MulterError(code, 'file');
        handleUploadError(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: expect.stringContaining('文件上传错误')
        });
      });
    });
  });
});

describe('Upload Middleware - 配置常量', () => {
  describe('MAX_FILE_SIZE', () => {
    it('应该等于10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
      expect(MAX_FILE_SIZE).toBe(10485760);
    });
  });

  describe('ALLOWED_EXTENSIONS', () => {
    it('应该包含.pdf, .docx, .doc', () => {
      expect(ALLOWED_EXTENSIONS).toEqual(['.pdf', '.docx', '.doc']);
      expect(ALLOWED_EXTENSIONS).toHaveLength(3);
    });

    it('应该包含正确的扩展名格式', () => {
      ALLOWED_EXTENSIONS.forEach((ext) => {
        expect(ext).toMatch(/^\./);
        expect(ext.toLowerCase()).toBe(ext);
      });
    });
  });

  describe('ALLOWED_MIME_TYPES', () => {
    it('应该包含正确的MIME类型', () => {
      expect(ALLOWED_MIME_TYPES).toEqual([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]);
      expect(ALLOWED_MIME_TYPES).toHaveLength(3);
    });

    it('应该映射到对应的文件扩展名', () => {
      const mimeToExt = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          '.docx',
        'application/msword': '.doc'
      };

      ALLOWED_MIME_TYPES.forEach((mime) => {
        expect(mimeToExt[mime]).toBeDefined();
        expect(ALLOWED_EXTENSIONS).toContain(mimeToExt[mime]);
      });
    });
  });
});
