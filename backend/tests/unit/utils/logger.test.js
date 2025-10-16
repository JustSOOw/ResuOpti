/**
 * logger工具 单元测试
 * 测试日志记录工具函数
 */

const logger = require('../../../src/utils/logger');

describe('logger - 日志工具', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;
  let consoleDebugSpy;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('基本日志记录功能', () => {
    test('error方法应该记录错误日志', () => {
      logger.error('测试错误', { code: 500 });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('warn方法应该记录警告日志', () => {
      logger.warn('测试警告', { code: 400 });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    test('info方法应该记录信息日志', () => {
      logger.info('测试信息', { user: 'test' });
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    test('debug方法应该记录调试日志', () => {
      logger.debug('测试调试', { detail: 'test' });
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('requestLogger - 请求日志中间件', () => {
    test('应该记录HTTP请求信息', (done) => {
      const mockReq = {
        method: 'GET',
        url: '/api/test',
        originalUrl: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        connection: { remoteAddress: '127.0.0.1' }
      };

      const mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            callback();
            expect(consoleInfoSpy).toHaveBeenCalled();
            done();
          }
        })
      };

      const mockNext = jest.fn();

      logger.requestLogger(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('对于4xx错误应该记录warn级别日志', (done) => {
      const mockReq = {
        method: 'GET',
        url: '/api/test',
        originalUrl: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        connection: { remoteAddress: '127.0.0.1' }
      };

      const mockRes = {
        statusCode: 404,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            callback();
            expect(consoleWarnSpy).toHaveBeenCalled();
            done();
          }
        })
      };

      logger.requestLogger(mockReq, mockRes, jest.fn());
    });

    test('对于5xx错误应该记录error级别日志', (done) => {
      const mockReq = {
        method: 'POST',
        url: '/api/test',
        originalUrl: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        connection: { remoteAddress: '127.0.0.1' }
      };

      const mockRes = {
        statusCode: 500,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            callback();
            expect(consoleErrorSpy).toHaveBeenCalled();
            done();
          }
        })
      };

      logger.requestLogger(mockReq, mockRes, jest.fn());
    });
  });

  describe('errorLogger - 错误日志中间件', () => {
    test('应该记录应用错误信息', () => {
      const mockError = new Error('测试错误');
      mockError.stack = 'Error stack trace';

      const mockReq = {
        method: 'POST',
        url: '/api/test',
        originalUrl: '/api/test',
        body: { data: 'test' },
        params: { id: '123' },
        query: { page: '1' },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' }
      };

      const mockRes = {};
      const mockNext = jest.fn();

      logger.errorLogger(mockError, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('createChildLogger - 子日志记录器', () => {
    test('应该创建带标签的子日志记录器', () => {
      const childLogger = logger.createChildLogger('Database');

      expect(childLogger).toBeDefined();
      expect(typeof childLogger.error).toBe('function');
      expect(typeof childLogger.warn).toBe('function');
      expect(typeof childLogger.info).toBe('function');
      expect(typeof childLogger.debug).toBe('function');
    });

    test('子日志记录器应该正常工作', () => {
      const childLogger = logger.createChildLogger('TestModule');

      childLogger.info('测试消息');

      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });
});
