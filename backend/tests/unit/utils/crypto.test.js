/**
 * crypto工具 单元测试
 * 测试加密工具函数
 */

// const crypto = require('crypto'); // 暂未使用
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoUtils = require('../../../src/utils/crypto');

// Mock 依赖
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('crypto - 加密工具', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword - 密码哈希', () => {
    test('应该成功对密码进行哈希', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$10$hashedValue';
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await cryptoUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    test('当哈希失败时应该抛出错误', async () => {
      bcrypt.hash.mockRejectedValue(new Error('Hash failed'));
      await expect(cryptoUtils.hashPassword('password')).rejects.toThrow('密码加密失败');
    });
  });

  describe('comparePassword - 密码比对', () => {
    test('应该正确比对密码', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const result = await cryptoUtils.comparePassword('password', 'hash');
      expect(result).toBe(true);
    });

    test('当比对失败时应该抛出错误', async () => {
      bcrypt.compare.mockRejectedValue(new Error('Compare failed'));
      await expect(cryptoUtils.comparePassword('password', 'hash')).rejects.toThrow('密码比对失败');
    });
  });

  describe('generateToken - JWT生成', () => {
    test('应该成功生成JWT token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = 'jwt.token.here';
      jwt.sign.mockReturnValue(token);

      const result = cryptoUtils.generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, expect.any(String), {
        expiresIn: expect.any(String)
      });
      expect(result).toBe(token);
    });

    test('应该支持自定义过期时间', () => {
      const payload = { userId: '123' };
      jwt.sign.mockReturnValue('token');

      cryptoUtils.generateToken(payload, '7d');

      expect(jwt.sign).toHaveBeenCalledWith(payload, expect.any(String), { expiresIn: '7d' });
    });

    test('当生成失败时应该抛出错误', () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('Sign failed');
      });
      expect(() => cryptoUtils.generateToken({ userId: '123' })).toThrow('Token生成失败');
    });
  });

  describe('verifyToken - JWT验证', () => {
    test('应该成功验证token', () => {
      const decoded = { userId: '123', email: 'test@example.com' };
      jwt.verify.mockReturnValue(decoded);

      const result = cryptoUtils.verifyToken('valid.token');

      expect(jwt.verify).toHaveBeenCalledWith('valid.token', expect.any(String));
      expect(result).toEqual(decoded);
    });

    test('当token过期时应该抛出特定错误', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => cryptoUtils.verifyToken('expired.token')).toThrow('Token已过期');
    });

    test('当token无效时应该抛出特定错误', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => cryptoUtils.verifyToken('invalid.token')).toThrow('Token无效');
    });
  });

  describe('generateRandomString - 随机字符串生成', () => {
    test('应该生成指定长度的随机字符串', () => {
      const result = cryptoUtils.generateRandomString(32);
      expect(result).toHaveLength(32);
      expect(typeof result).toBe('string');
    });

    test('应该生成不同的随机字符串', () => {
      const result1 = cryptoUtils.generateRandomString(32);
      const result2 = cryptoUtils.generateRandomString(32);
      expect(result1).not.toBe(result2);
    });

    test('应该使用默认长度32', () => {
      const result = cryptoUtils.generateRandomString();
      expect(result).toHaveLength(32);
    });
  });

  describe('generateUUID - UUID生成', () => {
    test('应该生成有效的UUID v4', () => {
      const uuid = cryptoUtils.generateUUID();
      // UUID v4 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    test('应该生成不同的UUID', () => {
      const uuid1 = cryptoUtils.generateUUID();
      const uuid2 = cryptoUtils.generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generateRandomDigits - 随机数字生成', () => {
    test('应该生成指定长度的随机数字字符串', () => {
      const result = cryptoUtils.generateRandomDigits(6);
      expect(result).toHaveLength(6);
      expect(/^\d+$/.test(result)).toBe(true); // 只包含数字
    });

    test('应该使用默认长度6', () => {
      const result = cryptoUtils.generateRandomDigits();
      expect(result).toHaveLength(6);
      expect(/^\d+$/.test(result)).toBe(true);
    });
  });

  describe('encrypt/decrypt - 数据加密解密', () => {
    test('应该成功加密和解密数据', () => {
      const originalData = '敏感信息测试';
      const encrypted = cryptoUtils.encrypt(originalData);

      // 加密后的数据应该包含三部分: iv:authTag:encryptedData
      expect(encrypted.split(':').length).toBe(3);

      // 解密应该恢复原始数据
      const decrypted = cryptoUtils.decrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    test('应该支持自定义密钥', () => {
      const data = '测试数据';
      const customKey = 'my-custom-secret-key';

      const encrypted = cryptoUtils.encrypt(data, customKey);
      const decrypted = cryptoUtils.decrypt(encrypted, customKey);

      expect(decrypted).toBe(data);
    });

    test('使用错误的密钥解密应该失败', () => {
      const data = '测试数据';
      const key1 = 'key1';
      const key2 = 'key2';

      const encrypted = cryptoUtils.encrypt(data, key1);

      expect(() => cryptoUtils.decrypt(encrypted, key2)).toThrow('数据解密失败');
    });

    test('解密格式错误的数据应该失败', () => {
      const invalidData = 'invalid:data';
      expect(() => cryptoUtils.decrypt(invalidData)).toThrow('数据解密失败');
    });
  });

  describe('hash - 哈希生成', () => {
    test('应该生成sha256哈希值', () => {
      const data = '测试数据';
      const hash1 = cryptoUtils.hash(data);
      const hash2 = cryptoUtils.hash(data);

      // 相同数据应该生成相同哈希
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64); // SHA256 输出64个十六进制字符
    });

    test('应该支持不同的哈希算法', () => {
      const data = '测试数据';
      const sha256Hash = cryptoUtils.hash(data, 'sha256');
      const sha512Hash = cryptoUtils.hash(data, 'sha512');

      expect(sha256Hash).not.toBe(sha512Hash);
      expect(sha512Hash.length).toBe(128); // SHA512 输出128个十六进制字符
    });

    test('不同数据应该生成不同哈希', () => {
      const hash1 = cryptoUtils.hash('数据1');
      const hash2 = cryptoUtils.hash('数据2');
      expect(hash1).not.toBe(hash2);
    });
  });
});
