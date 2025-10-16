/**
 * Cypress E2E 支持文件
 * 在所有测试之前加载的全局配置和自定义命令
 */

// Cypress默认命令
import './commands'

// 可选：添加全局配置
Cypress.on('uncaught:exception', (err, runnable) => {
  // 返回false可以防止Cypress因为应用程序中的未捕获异常而失败测试
  // 在某些情况下（如第三方库错误）这很有用
  console.error('Uncaught exception:', err)

  // 可以在这里添加特定的错误处理逻辑
  // 例如：忽略特定的错误类型

  // 返回false以防止测试失败
  // 返回true会导致测试失败（默认行为）
  return false
})
