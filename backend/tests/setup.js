/**
 * Jest测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'resumopti_test';

// 全局测试设置
beforeAll(() => {
  // 全局测试初始化
});

afterAll(() => {
  // 全局测试清理
});
