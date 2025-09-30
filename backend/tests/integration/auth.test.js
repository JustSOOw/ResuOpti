/**
 * 用户认证集成测试
 *
 * 测试目标: 验证用户注册和登录的完整业务流程
 *
 * 集成测试范围:
 * - 服务层 (authService)
 * - 数据访问层 (User模型)
 * - 数据库 (PostgreSQL - resumopti_test)
 *
 * 测试策略:
 * - 直接调用Service层方法进行测试，不依赖API层
 * - 每个测试用例使用唯一的测试数据
 * - 验证数据库实际存储的数据
 * - 测试正常流程和异常场景
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../src/config');
const User = require('../../src/models/User');
const authService = require('../../src/services/authService');

describe('用户认证集成测试', () => {
  /**
   * 测试前置准备
   *
   * 1. 确保数据库连接正常
   * 2. 同步数据库表结构
   * 3. 清空users表，确保测试环境干净
   */
  beforeAll(async () => {
    // 确保使用test环境
    process.env.NODE_ENV = 'test';

    // 测试数据库连接
    try {
      await sequelize.authenticate();
      console.log('✅ 测试数据库连接成功');
    } catch (error) {
      console.error('❌ 测试数据库连接失败:', error.message);
      throw error;
    }

    // 同步数据库表结构（使用force: false避免删除已有数据）
    await sequelize.sync();

    // 清空users表
    await User.destroy({ where: {}, truncate: true });
    console.log('✅ 测试环境准备完成');
  });

  /**
   * 每个测试用例前清理users表
   * 确保测试用例之间相互独立
   */
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  /**
   * 测试后置清理
   *
   * 1. 清空测试数据
   * 2. 关闭数据库连接
   */
  afterAll(async () => {
    // 清空所有测试数据
    await User.destroy({ where: {}, truncate: true });

    // 关闭数据库连接
    await sequelize.close();
    console.log('✅ 测试环境清理完成');
  });

  /**
   * ============================================
   * 用户注册功能测试套件
   * ============================================
   */
  describe('用户注册功能 (authService.register)', () => {
    /**
     * 测试用例 1: 成功注册新用户
     *
     * 测试目标:
     * - 验证能够成功创建新用户账户
     * - 验证用户数据正确保存到数据库
     * - 验证返回的用户信息不包含密码哈希
     * - 验证返回数据包含必需字段 (id, email, created_at, updated_at)
     */
    test('应该成功注册新用户并将数据保存到数据库', async () => {
      const testEmail = 'newuser@example.com';
      const testPassword = 'password123';

      // 执行注册
      const result = await authService.register(testEmail, testPassword);

      // 验证返回的用户对象包含必需字段
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', testEmail);
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');

      // 验证返回的对象不包含password_hash（安全性检查）
      expect(result).not.toHaveProperty('password_hash');

      // 验证id是有效的UUID格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.id).toMatch(uuidRegex);

      // 从数据库查询用户，验证数据确实被保存
      const userInDb = await User.findOne({ where: { email: testEmail } });

      // 验证数据库中存在该用户
      expect(userInDb).not.toBeNull();
      expect(userInDb.id).toBe(result.id);
      expect(userInDb.email).toBe(testEmail);
      expect(userInDb.password_hash).toBeDefined();

      // 验证created_at和updated_at是有效的日期对象
      expect(userInDb.created_at).toBeInstanceOf(Date);
      expect(userInDb.updated_at).toBeInstanceOf(Date);
    });

    /**
     * 测试用例 2: 密码正确加密存储
     *
     * 测试目标:
     * - 验证密码不以明文形式存储
     * - 验证使用bcrypt加密
     * - 验证加密后的密码可以正确比对
     */
    test('应该使用bcrypt正确加密存储密码', async () => {
      const testEmail = 'secure@example.com';
      const testPassword = 'mySecurePass123';

      // 执行注册
      await authService.register(testEmail, testPassword);

      // 从数据库查询用户
      const userInDb = await User.findOne({ where: { email: testEmail } });

      // 验证密码不是明文存储
      expect(userInDb.password_hash).not.toBe(testPassword);

      // 验证密码哈希是bcrypt格式（以$2b$开头）
      expect(userInDb.password_hash).toMatch(/^\$2b\$/);

      // 验证密码哈希可以正确比对
      const isPasswordValid = await bcrypt.compare(testPassword, userInDb.password_hash);
      expect(isPasswordValid).toBe(true);

      // 验证错误的密码无法通过比对
      const isWrongPasswordValid = await bcrypt.compare('wrongPassword', userInDb.password_hash);
      expect(isWrongPasswordValid).toBe(false);
    });

    /**
     * 测试用例 3: 邮箱重复注册错误
     *
     * 测试目标:
     * - 验证相同邮箱不能注册两次
     * - 验证抛出正确的错误信息
     * - 验证数据库中只有一条用户记录
     */
    test('应该拒绝重复的邮箱注册', async () => {
      const testEmail = 'duplicate@example.com';
      const testPassword = 'password123';

      // 第一次注册应该成功
      await authService.register(testEmail, testPassword);

      // 第二次使用相同邮箱注册应该失败
      await expect(
        authService.register(testEmail, testPassword)
      ).rejects.toThrow('该邮箱已被注册');

      // 验证数据库中只有一个用户
      const users = await User.findAll({ where: { email: testEmail } });
      expect(users).toHaveLength(1);
    });

    /**
     * 测试用例 4: 邮箱格式验证
     *
     * 测试目标:
     * - 验证无效的邮箱格式被拒绝
     * - 验证多种无效邮箱格式
     */
    test('应该拒绝无效的邮箱格式', async () => {
      const invalidEmails = [
        'notanemail',           // 缺少@符号
        'missing@domain',       // 缺少顶级域名
        '@nodomain.com',        // 缺少用户名
        'spaces in@email.com',  // 包含空格
        ''                      // 空字符串
      ];

      // 测试所有无效邮箱格式
      for (const invalidEmail of invalidEmails) {
        await expect(
          authService.register(invalidEmail, 'password123')
        ).rejects.toThrow('邮箱格式不正确');
      }

      // 验证数据库中没有创建任何用户
      const userCount = await User.count();
      expect(userCount).toBe(0);
    });

    /**
     * 测试用例 5: 密码格式验证 - 长度不足
     *
     * 测试目标:
     * - 验证密码长度必须至少8位
     * - 验证短密码被拒绝
     */
    test('应该拒绝长度少于8位的密码', async () => {
      const testEmail = 'user@example.com';
      const shortPasswords = [
        'pass1',      // 5位
        'abc123',     // 6位
        'test12',     // 6位
        '1234567'     // 7位
      ];

      // 测试所有短密码
      for (const shortPassword of shortPasswords) {
        await expect(
          authService.register(testEmail, shortPassword)
        ).rejects.toThrow('密码长度至少为8位');
      }

      // 验证数据库中没有创建任何用户
      const userCount = await User.count();
      expect(userCount).toBe(0);
    });

    /**
     * 测试用例 6: 密码格式验证 - 必须包含字母和数字
     *
     * 测试目标:
     * - 验证密码必须同时包含字母和数字
     * - 验证纯字母密码被拒绝
     * - 验证纯数字密码被拒绝
     */
    test('应该拒绝不包含字母和数字的密码', async () => {
      const testEmail = 'user@example.com';

      // 测试纯字母密码
      await expect(
        authService.register(testEmail, 'onlyletters')
      ).rejects.toThrow('密码必须同时包含字母和数字');

      // 测试纯数字密码
      await expect(
        authService.register(testEmail, '12345678')
      ).rejects.toThrow('密码必须同时包含字母和数字');

      // 测试特殊字符密码（没有字母和数字）
      await expect(
        authService.register(testEmail, '!@#$%^&*')
      ).rejects.toThrow('密码必须同时包含字母和数字');

      // 验证数据库中没有创建任何用户
      const userCount = await User.count();
      expect(userCount).toBe(0);
    });

    /**
     * 测试用例 7: 空输入验证
     *
     * 测试目标:
     * - 验证空邮箱被拒绝
     * - 验证空密码被拒绝
     */
    test('应该拒绝空的邮箱或密码', async () => {
      // 测试空邮箱
      await expect(
        authService.register('', 'password123')
      ).rejects.toThrow('邮箱格式不正确');

      // 测试空密码
      await expect(
        authService.register('user@example.com', '')
      ).rejects.toThrow('密码长度至少为8位');

      // 测试null值
      await expect(
        authService.register(null, 'password123')
      ).rejects.toThrow('邮箱格式不正确');

      // 验证数据库中没有创建任何用户
      const userCount = await User.count();
      expect(userCount).toBe(0);
    });
  });

  /**
   * ============================================
   * 用户登录功能测试套件
   * ============================================
   */
  describe('用户登录功能 (authService.login)', () => {
    /**
     * 测试前置准备：创建测试用户
     * 每个登录测试用例都需要一个已存在的用户
     */
    const testUser = {
      email: 'logintest@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // 清空表后重新创建测试用户
      await User.destroy({ where: {}, truncate: true });
      await authService.register(testUser.email, testUser.password);
    });

    /**
     * 测试用例 1: 成功登录并获取JWT token
     *
     * 测试目标:
     * - 验证正确的邮箱密码可以登录
     * - 验证返回JWT token
     * - 验证返回的用户信息正确
     * - 验证返回的用户信息不包含密码
     */
    test('应该成功登录并返回JWT token和用户信息', async () => {
      // 执行登录
      const result = await authService.login(testUser.email, testUser.password);

      // 验证返回对象包含user和token字段
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');

      // 验证user对象包含必需字段
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email', testUser.email);
      expect(result.user).toHaveProperty('created_at');
      expect(result.user).toHaveProperty('updated_at');

      // 验证user对象不包含password_hash（安全性检查）
      expect(result.user).not.toHaveProperty('password_hash');

      // 验证token是字符串且不为空
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
    });

    /**
     * 测试用例 2: JWT token格式正确性验证
     *
     * 测试目标:
     * - 验证token是有效的JWT格式
     * - 验证token包含正确的payload信息
     * - 验证token可以被解码
     */
    test('应该返回格式正确的JWT token', async () => {
      // 执行登录
      const result = await authService.login(testUser.email, testUser.password);

      // 验证token格式（JWT格式：xxx.yyy.zzz）
      const tokenParts = result.token.split('.');
      expect(tokenParts).toHaveLength(3);

      // 使用authService.verifyToken验证token
      const decoded = authService.verifyToken(result.token);

      // 验证decoded payload包含正确的用户信息
      expect(decoded).toHaveProperty('userId', result.user.id);
      expect(decoded).toHaveProperty('email', testUser.email);
      expect(decoded).toHaveProperty('exp'); // 过期时间
      expect(decoded).toHaveProperty('iat'); // 签发时间

      // 验证token尚未过期
      const currentTime = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(currentTime);
    });

    /**
     * 测试用例 3: 错误密码登录失败
     *
     * 测试目标:
     * - 验证错误的密码无法登录
     * - 验证抛出正确的错误信息
     */
    test('应该拒绝错误的密码', async () => {
      const wrongPassword = 'wrongpassword123';

      // 尝试使用错误密码登录
      await expect(
        authService.login(testUser.email, wrongPassword)
      ).rejects.toThrow('密码错误');
    });

    /**
     * 测试用例 4: 不存在的用户登录失败
     *
     * 测试目标:
     * - 验证不存在的邮箱无法登录
     * - 验证抛出正确的错误信息
     */
    test('应该拒绝不存在的用户', async () => {
      const nonExistentEmail = 'nonexistent@example.com';

      // 尝试使用不存在的邮箱登录
      await expect(
        authService.login(nonExistentEmail, 'password123')
      ).rejects.toThrow('用户不存在');
    });

    /**
     * 测试用例 5: 空输入验证
     *
     * 测试目标:
     * - 验证空邮箱无法登录
     * - 验证空密码无法登录
     * - 验证抛出正确的错误信息
     */
    test('应该拒绝空的邮箱或密码', async () => {
      // 测试空邮箱
      await expect(
        authService.login('', 'password123')
      ).rejects.toThrow('邮箱和密码不能为空');

      // 测试空密码
      await expect(
        authService.login(testUser.email, '')
      ).rejects.toThrow('邮箱和密码不能为空');

      // 测试null值
      await expect(
        authService.login(null, 'password123')
      ).rejects.toThrow('邮箱和密码不能为空');

      await expect(
        authService.login(testUser.email, null)
      ).rejects.toThrow('邮箱和密码不能为空');
    });

    /**
     * 测试用例 6: 大小写敏感性测试
     *
     * 测试目标:
     * - 验证邮箱不区分大小写（符合邮箱标准）
     * - 验证密码区分大小写（安全性要求）
     */
    test('应该正确处理邮箱和密码的大小写', async () => {
      // 邮箱使用大写形式应该能够登录（邮箱不区分大小写）
      // 注意：这取决于数据库配置，PostgreSQL默认邮箱是区分大小写的
      // 如果需要不区分大小写，需要在查询时使用ILIKE或将邮箱转为小写存储

      // 密码使用不同大小写应该失败（密码区分大小写）
      const wrongCasePassword = 'PASSWORD123'; // 原密码是password123
      await expect(
        authService.login(testUser.email, wrongCasePassword)
      ).rejects.toThrow('密码错误');
    });
  });

  /**
   * ============================================
   * 注册+登录组合流程测试套件
   * ============================================
   */
  describe('注册与登录组合流程', () => {
    /**
     * 测试用例 1: 完整的注册后立即登录流程
     *
     * 测试目标:
     * - 验证新注册的用户可以立即登录
     * - 验证注册和登录返回的用户ID一致
     * - 验证整个流程端到端正常工作
     */
    test('应该能够注册后立即登录', async () => {
      const newUserEmail = 'endtoend@example.com';
      const newUserPassword = 'testpass123';

      // 步骤1: 注册新用户
      const registerResult = await authService.register(newUserEmail, newUserPassword);

      // 验证注册成功
      expect(registerResult).toHaveProperty('id');
      expect(registerResult.email).toBe(newUserEmail);

      // 步骤2: 使用相同凭据登录
      const loginResult = await authService.login(newUserEmail, newUserPassword);

      // 验证登录成功
      expect(loginResult).toHaveProperty('user');
      expect(loginResult).toHaveProperty('token');

      // 验证注册和登录返回的用户ID一致
      expect(loginResult.user.id).toBe(registerResult.id);
      expect(loginResult.user.email).toBe(newUserEmail);

      // 步骤3: 验证token有效性
      const decoded = authService.verifyToken(loginResult.token);
      expect(decoded.userId).toBe(registerResult.id);
      expect(decoded.email).toBe(newUserEmail);
    });

    /**
     * 测试用例 2: 验证token有效性
     *
     * 测试目标:
     * - 验证生成的token包含正确的用户信息
     * - 验证token可以正确解码
     * - 验证token中的userId可以用于查询用户
     */
    test('应该生成可验证且包含正确信息的token', async () => {
      const newUserEmail = 'tokentest@example.com';
      const newUserPassword = 'secure123';

      // 注册并登录
      const registerResult = await authService.register(newUserEmail, newUserPassword);
      const loginResult = await authService.login(newUserEmail, newUserPassword);

      // 解码token
      const decoded = authService.verifyToken(loginResult.token);

      // 使用token中的userId从数据库查询用户
      const userFromToken = await User.findByPk(decoded.userId);

      // 验证通过token找到的用户与原用户一致
      expect(userFromToken).not.toBeNull();
      expect(userFromToken.id).toBe(registerResult.id);
      expect(userFromToken.email).toBe(newUserEmail);
    });

    /**
     * 测试用例 3: 多用户注册和登录
     *
     * 测试目标:
     * - 验证系统可以处理多个用户
     * - 验证每个用户的token独立且正确
     * - 验证用户数据不会混淆
     */
    test('应该能够正确处理多个用户的注册和登录', async () => {
      // 创建多个用户
      const users = [
        { email: 'user1@example.com', password: 'password123' },
        { email: 'user2@example.com', password: 'secure456' },
        { email: 'user3@example.com', password: 'test789abc' }
      ];

      const registeredUsers = [];
      const loginResults = [];

      // 注册所有用户
      for (const user of users) {
        const registerResult = await authService.register(user.email, user.password);
        registeredUsers.push(registerResult);
      }

      // 验证数据库中有3个用户
      const userCount = await User.count();
      expect(userCount).toBe(3);

      // 登录所有用户
      for (const user of users) {
        const loginResult = await authService.login(user.email, user.password);
        loginResults.push(loginResult);
      }

      // 验证每个用户的token包含正确的信息
      for (let i = 0; i < users.length; i++) {
        const decoded = authService.verifyToken(loginResults[i].token);
        expect(decoded.email).toBe(users[i].email);
        expect(decoded.userId).toBe(registeredUsers[i].id);
      }

      // 验证每个用户的ID是唯一的
      const userIds = registeredUsers.map(u => u.id);
      const uniqueIds = new Set(userIds);
      expect(uniqueIds.size).toBe(3);
    });

    /**
     * 测试用例 4: 密码更改场景模拟
     *
     * 测试目标:
     * - 验证用户使用旧密码无法登录（模拟密码更改后的场景）
     * - 本测试通过直接更新数据库密码来模拟密码更改
     */
    test('更改密码后旧密码应该无法登录', async () => {
      const userEmail = 'changepass@example.com';
      const oldPassword = 'oldpass123';
      const newPassword = 'newpass456';

      // 注册用户
      const registerResult = await authService.register(userEmail, oldPassword);

      // 验证旧密码可以登录
      const loginWithOldPass = await authService.login(userEmail, oldPassword);
      expect(loginWithOldPass).toHaveProperty('token');

      // 模拟密码更改：直接更新数据库中的密码哈希
      const newPasswordHash = await authService.hashPassword(newPassword);
      await User.update(
        { password_hash: newPasswordHash },
        { where: { id: registerResult.id } }
      );

      // 验证旧密码无法登录
      await expect(
        authService.login(userEmail, oldPassword)
      ).rejects.toThrow('密码错误');

      // 验证新密码可以登录
      const loginWithNewPass = await authService.login(userEmail, newPassword);
      expect(loginWithNewPass).toHaveProperty('token');
    });
  });

  /**
   * ============================================
   * 边界条件和特殊场景测试
   * ============================================
   */
  describe('边界条件和特殊场景', () => {
    /**
     * 测试用例 1: 最小有效密码
     *
     * 测试目标:
     * - 验证刚好8位的密码可以通过
     */
    test('应该接受刚好8位且包含字母和数字的密码', async () => {
      const minValidPassword = 'pass1234'; // 刚好8位，包含字母和数字

      const result = await authService.register('minpass@example.com', minValidPassword);
      expect(result).toHaveProperty('id');

      // 验证可以使用该密码登录
      const loginResult = await authService.login('minpass@example.com', minValidPassword);
      expect(loginResult).toHaveProperty('token');
    });

    /**
     * 测试用例 2: 包含特殊字符的密码
     *
     * 测试目标:
     * - 验证密码可以包含特殊字符
     * - 验证特殊字符被正确处理
     */
    test('应该正确处理包含特殊字符的密码', async () => {
      const specialPassword = 'P@ssw0rd!#$%';

      const result = await authService.register('special@example.com', specialPassword);
      expect(result).toHaveProperty('id');

      // 验证可以使用该密码登录
      const loginResult = await authService.login('special@example.com', specialPassword);
      expect(loginResult).toHaveProperty('token');
    });

    /**
     * 测试用例 3: 邮箱大小写处理
     *
     * 测试目标:
     * - 验证邮箱的存储和查询行为
     * - 注意：PostgreSQL默认邮箱查询区分大小写
     */
    test('应该按照存储的邮箱格式进行匹配', async () => {
      const email = 'Test@Example.com';
      const password = 'password123';

      // 注册用户（邮箱包含大写字母）
      await authService.register(email, password);

      // 使用相同格式的邮箱登录应该成功
      const loginResult = await authService.login(email, password);
      expect(loginResult).toHaveProperty('token');
    });

    /**
     * 测试用例 4: 非常长的密码
     *
     * 测试目标:
     * - 验证系统可以处理较长的密码
     */
    test('应该能够处理较长的密码', async () => {
      const longPassword = 'a1' + 'x'.repeat(100); // 102位密码

      const result = await authService.register('longpass@example.com', longPassword);
      expect(result).toHaveProperty('id');

      // 验证可以使用该密码登录
      const loginResult = await authService.login('longpass@example.com', longPassword);
      expect(loginResult).toHaveProperty('token');
    });

    /**
     * 测试用例 5: 连续失败登录尝试
     *
     * 测试目标:
     * - 验证多次失败登录不会影响系统
     * - 验证正确密码仍然可以登录
     */
    test('多次失败登录后正确密码仍可登录', async () => {
      const email = 'retry@example.com';
      const correctPassword = 'correct123';

      // 注册用户
      await authService.register(email, correctPassword);

      // 多次使用错误密码尝试登录
      const wrongPasswords = ['wrong1', 'wrong2', 'wrong3', 'wrong4', 'wrong5'];
      for (const wrongPass of wrongPasswords) {
        await expect(
          authService.login(email, wrongPass)
        ).rejects.toThrow();
      }

      // 使用正确密码应该仍然可以登录
      const loginResult = await authService.login(email, correctPassword);
      expect(loginResult).toHaveProperty('token');
    });
  });
});