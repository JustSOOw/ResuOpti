/**
 * Cypress 自定义命令
 * 定义可重用的测试命令
 */

/// <reference types="cypress" />

/**
 * 自定义命令：登录
 * 通过API登录而不是UI，以加快测试速度
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password }
  }).then((response) => {
    // 将token存储到localStorage
    window.localStorage.setItem('auth_token', response.body.token)
    window.localStorage.setItem('auth_user', JSON.stringify(response.body.user))
  })
})

/**
 * 自定义命令：登出
 * 清除认证信息
 */
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('auth_token')
  window.localStorage.removeItem('auth_user')
})

/**
 * 自定义命令：等待API请求完成
 * 使用别名等待特定的API请求
 */
Cypress.Commands.add('waitForApi', (alias: string, timeout?: number) => {
  cy.wait(alias, { timeout: timeout || 10000 })
})

/**
 * 自定义命令：在Tiptap编辑器中输入内容
 * 专门用于Tiptap编辑器的输入操作
 */
Cypress.Commands.add('typeInEditor', (content: string) => {
  cy.get('.ProseMirror').should('be.visible').click().type(content)
})

/**
 * 自定义命令：清空Tiptap编辑器内容
 */
Cypress.Commands.add('clearEditor', () => {
  cy.get('.ProseMirror').should('be.visible').click().type('{selectall}{backspace}')
})

/**
 * 自定义命令：在编辑器中应用格式
 */
Cypress.Commands.add('applyEditorFormat', (format: string) => {
  const formatMap: Record<string, string> = {
    bold: 'B',
    italic: 'I',
    strike: 'S',
    h1: 'H1',
    h2: 'H2',
    h3: 'H3',
    bulletList: '•',
    orderedList: '1.'
  }

  const buttonText = formatMap[format]
  if (buttonText) {
    if (buttonText === '•') {
      cy.get('button[title="无序列表"]').click()
    } else if (buttonText === '1.') {
      cy.get('button[title="有序列表"]').click()
    } else {
      cy.contains('button', buttonText).click()
    }
  }
})

// TypeScript类型声明
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 通过API登录
       * @param email 用户邮箱
       * @param password 用户密码
       * @example cy.login('user@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>

      /**
       * 登出并清除认证信息
       * @example cy.logout()
       */
      logout(): Chainable<void>

      /**
       * 等待API请求完成
       * @param alias API请求的别名
       * @param timeout 超时时间（毫秒）
       * @example cy.waitForApi('@getPositions')
       */
      waitForApi(alias: string, timeout?: number): Chainable<void>

      /**
       * 在Tiptap编辑器中输入内容
       * @param content 要输入的内容
       * @example cy.typeInEditor('Hello World')
       */
      typeInEditor(content: string): Chainable<void>

      /**
       * 清空Tiptap编辑器内容
       * @example cy.clearEditor()
       */
      clearEditor(): Chainable<void>

      /**
       * 在编辑器中应用格式
       * @param format 格式类型：bold, italic, strike, h1, h2, h3, bulletList, orderedList
       * @example cy.applyEditorFormat('bold')
       */
      applyEditorFormat(format: string): Chainable<void>
    }
  }
}

export {}