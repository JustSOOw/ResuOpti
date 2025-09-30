/**
 * Cypress E2E 测试配置
 * 用于端到端测试的配置文件
 */

import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // 基础URL，所有测试中的相对URL都会基于此
    baseUrl: 'http://localhost:5173',

    // 测试文件所在目录
    specPattern: 'tests/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // 支持文件
    supportFile: 'tests/support/e2e.ts',

    // 视频和截图设置
    video: true,
    screenshotOnRunFailure: true,

    // 视口大小
    viewportWidth: 1280,
    viewportHeight: 720,

    // 默认命令超时时间
    defaultCommandTimeout: 10000,

    // 页面加载超时时间
    pageLoadTimeout: 30000,

    // 重试配置
    retries: {
      // 在CI环境中运行时的重试次数
      runMode: 2,
      // 在交互式模式下的重试次数
      openMode: 0
    },

    // 环境变量
    env: {
      // API基础URL
      apiUrl: 'http://localhost:3000/api/v1',

      // 测试用户凭据（可选，用于已存在的测试账号）
      testUser: {
        email: 'test@example.com',
        password: 'Test123456!'
      }
    },

    setupNodeEvents(on, config) {
      // 在这里可以注册各种node事件监听器
      // 例如：数据库清理、API mock等

      return config
    }
  }
})