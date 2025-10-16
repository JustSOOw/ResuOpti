/**
 * JWT认证中间件单元测试
 * 测试认证逻辑和权限场景
 */

const { authenticate, optionalAuth } = require('../../../src/middleware/auth');
const authService = require('../../../src/services/authService');

// Mock authService
jest.mock('../../../src/services/authService');

describe('Auth Middleware - authenticate', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('成功认证场景', () => {
    it('应该成功验证有效的Bearer token', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 9999999999
      };

      req.headers.authorization = 'Bearer valid-token';
      authService.verifyToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual({
        ...mockDecoded,
        id: 'user-123'
      });
      expect(req.userId).toBe('user-123');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该正确提取用户ID并设置到req.userId', () => {
      const mockDecoded = {
        userId: 'abc-456',
        email: 'user@test.com'
      };

      req.headers.authorization = 'Bearer token-123';
      authService.verifyToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(req.userId).toBe('abc-456');
      expect(req.user.id).toBe('abc-456');
    });

    it('应该保留token中的所有原始字段', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        customField: 'custom-value'
      };

      req.headers.authorization = 'Bearer token-456';
      authService.verifyToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(req.user).toMatchObject(mockDecoded);
      expect(req.user.role).toBe('admin');
      expect(req.user.customField).toBe('custom-value');
    });
  });

  describe('缺少Authorization头', () => {
    it('应该返回401当没有Authorization头', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供认证令牌，请先登录'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该返回401当Authorization头为空字符串', () => {
      req.headers.authorization = '';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供认证令牌，请先登录'
      });
    });

    it('应该返回401当Authorization头为undefined', () => {
      req.headers.authorization = undefined;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Authorization头格式错误', () => {
    it('应该返回401当格式不是"Bearer <token>"', () => {
      req.headers.authorization = 'InvalidFormat token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌格式错误，应为: Bearer <token>'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该返回401当只有"Bearer"没有token', () => {
      req.headers.authorization = 'Bearer';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌格式错误，应为: Bearer <token>'
      });
    });

    it('应该返回401当有多余的空格', () => {
      req.headers.authorization = 'Bearer  token  extra';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('应该返回401当使用小写bearer', () => {
      req.headers.authorization = 'bearer token-123';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌格式错误，应为: Bearer <token>'
      });
    });

    it('应该返回401当使用其他认证方案', () => {
      req.headers.authorization = 'Basic dXNlcjpwYXNz';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌格式错误，应为: Bearer <token>'
      });
    });
  });

  describe('Token为空或无效', () => {
    it('应该返回401当token为空字符串', () => {
      req.headers.authorization = 'Bearer ';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌不能为空'
      });
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('应该返回401当token只有空格', () => {
      req.headers.authorization = 'Bearer    ';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌格式错误，应为: Bearer <token>'
      });
    });
  });

  describe('Token验证失败', () => {
    it('应该返回401当token已过期', () => {
      req.headers.authorization = 'Bearer expired-token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Token已过期');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token已过期'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该返回401当token无效', () => {
      req.headers.authorization = 'Bearer invalid-token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Token无效');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token无效'
      });
    });

    it('应该返回401当token验证抛出异常', () => {
      req.headers.authorization = 'Bearer bad-token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Token验证失败');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token验证失败'
      });
    });

    it('应该处理没有错误消息的异常', () => {
      req.headers.authorization = 'Bearer error-token';
      authService.verifyToken.mockImplementation(() => {
        const error = new Error();
        delete error.message;
        throw error;
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证失败'
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理token包含特殊字符', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com'
      };
      const specialToken = 'eyJ0eXAi.OiJKV1Qi-LCJh_bGci=OiJI';

      req.headers.authorization = `Bearer ${specialToken}`;
      authService.verifyToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(specialToken);
      expect(next).toHaveBeenCalled();
    });

    it('应该处理极长的token', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com'
      };
      const longToken = 'a'.repeat(1000);

      req.headers.authorization = `Bearer ${longToken}`;
      authService.verifyToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(longToken);
      expect(next).toHaveBeenCalled();
    });

    it('应该处理token中只有userId字段', () => {
      const mockDecoded = {
        userId: 'user-only-id'
      };

      req.headers.authorization = 'Bearer minimal-token';
      authService.verifyToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(req.user).toEqual({
        userId: 'user-only-id',
        id: 'user-only-id'
      });
      expect(req.userId).toBe('user-only-id');
      expect(next).toHaveBeenCalled();
    });
  });
});

describe('Auth Middleware - optionalAuth', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('成功认证场景', () => {
    it('应该成功验证有效的Bearer token', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com'
      };

      req.headers.authorization = 'Bearer valid-token';
      authService.verifyToken.mockReturnValue(mockDecoded);

      optionalAuth(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual({
        ...mockDecoded,
        id: 'user-123'
      });
      expect(req.userId).toBe('user-123');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该正确设置用户信息', () => {
      const mockDecoded = {
        userId: 'opt-user-456',
        email: 'optional@test.com',
        role: 'user'
      };

      req.headers.authorization = 'Bearer opt-token';
      authService.verifyToken.mockReturnValue(mockDecoded);

      optionalAuth(req, res, next);

      expect(req.userId).toBe('opt-user-456');
      expect(req.user).toMatchObject(mockDecoded);
    });
  });

  describe('没有提供认证信息', () => {
    it('应该继续处理请求当没有Authorization头', () => {
      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(req.userId).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该继续处理请求当Authorization头为空', () => {
      req.headers.authorization = '';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('应该继续处理请求当Authorization头为undefined', () => {
      req.headers.authorization = undefined;

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('格式错误但不阻止请求', () => {
    it('应该继续处理当格式不是"Bearer <token>"', () => {
      req.headers.authorization = 'InvalidFormat token';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('应该继续处理当只有"Bearer"没有token', () => {
      req.headers.authorization = 'Bearer';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('应该继续处理当token为空字符串', () => {
      req.headers.authorization = 'Bearer ';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('应该继续处理当token只有空格', () => {
      req.headers.authorization = 'Bearer    ';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('应该继续处理当使用小写bearer', () => {
      req.headers.authorization = 'bearer token-123';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Token验证失败但不阻止请求', () => {
    it('应该继续处理当token已过期', () => {
      req.headers.authorization = 'Bearer expired-token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Token已过期');
      });

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该继续处理当token无效', () => {
      req.headers.authorization = 'Bearer invalid-token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Token无效');
      });

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('应该继续处理当token验证抛出任何异常', () => {
      req.headers.authorization = 'Bearer bad-token';
      authService.verifyToken.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('应该处理token包含特殊字符', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com'
      };
      const specialToken = 'eyJ0eXAi.OiJKV1Qi-LCJh_bGci=OiJI';

      req.headers.authorization = `Bearer ${specialToken}`;
      authService.verifyToken.mockReturnValue(mockDecoded);

      optionalAuth(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(specialToken);
      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('应该处理极长的token', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com'
      };
      const longToken = 'a'.repeat(1000);

      req.headers.authorization = `Bearer ${longToken}`;
      authService.verifyToken.mockReturnValue(mockDecoded);

      optionalAuth(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(longToken);
      expect(next).toHaveBeenCalled();
    });

    it('应该处理验证成功但没有userId的token', () => {
      const mockDecoded = {
        email: 'test@example.com'
      };

      req.headers.authorization = 'Bearer no-userid-token';
      authService.verifyToken.mockReturnValue(mockDecoded);

      optionalAuth(req, res, next);

      expect(req.user).toMatchObject(mockDecoded);
      expect(req.user.id).toBeUndefined();
      expect(req.userId).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalAuth vs authenticate 行为对比', () => {
    it('相同token,optionalAuth应该设置相同的用户信息', () => {
      const mockDecoded = {
        userId: 'compare-123',
        email: 'compare@test.com'
      };
      const token = 'Bearer same-token';

      // 测试 authenticate
      req.headers.authorization = token;
      authService.verifyToken.mockReturnValue(mockDecoded);
      authenticate(req, res, next);
      const authenticateUser = req.user;
      const authenticateUserId = req.userId;

      // 重置 req
      req = { headers: { authorization: token } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();

      // 测试 optionalAuth
      authService.verifyToken.mockReturnValue(mockDecoded);
      optionalAuth(req, res, next);
      const optionalAuthUser = req.user;
      const optionalAuthUserId = req.userId;

      // 比较结果
      expect(optionalAuthUser).toEqual(authenticateUser);
      expect(optionalAuthUserId).toBe(authenticateUserId);
    });

    it('无token时,authenticate返回401,optionalAuth继续处理', () => {
      const reqAuth = { headers: {} };
      const resAuth = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const nextAuth = jest.fn();

      const reqOpt = { headers: {} };
      const resOpt = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const nextOpt = jest.fn();

      // 测试 authenticate
      authenticate(reqAuth, resAuth, nextAuth);
      expect(resAuth.status).toHaveBeenCalledWith(401);
      expect(nextAuth).not.toHaveBeenCalled();

      // 测试 optionalAuth
      optionalAuth(reqOpt, resOpt, nextOpt);
      expect(resOpt.status).not.toHaveBeenCalled();
      expect(nextOpt).toHaveBeenCalled();
    });

    it('无效token时,authenticate返回401,optionalAuth继续处理', () => {
      const reqAuth = { headers: { authorization: 'Bearer invalid' } };
      const resAuth = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const nextAuth = jest.fn();

      const reqOpt = { headers: { authorization: 'Bearer invalid' } };
      const resOpt = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const nextOpt = jest.fn();

      authService.verifyToken.mockImplementation(() => {
        throw new Error('Token无效');
      });

      // 测试 authenticate
      authenticate(reqAuth, resAuth, nextAuth);
      expect(resAuth.status).toHaveBeenCalledWith(401);
      expect(nextAuth).not.toHaveBeenCalled();

      // 测试 optionalAuth
      optionalAuth(reqOpt, resOpt, nextOpt);
      expect(resOpt.status).not.toHaveBeenCalled();
      expect(nextOpt).toHaveBeenCalled();
      expect(reqOpt.user).toBeUndefined();
    });
  });
});
