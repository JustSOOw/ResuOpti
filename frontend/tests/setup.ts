/**
 * Vitest测试环境设置
 * 配置Element Plus和其他全局依赖
 */

import { beforeAll, afterAll, vi } from 'vitest'

// Mock window.matchMedia（Element Plus暗黑模式需要）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

beforeAll(() => {
  // 全局测试初始化
})

afterAll(() => {
  // 全局测试清理
})
