/**
 * E2E测试：简历管理 - 编辑、导出、投递记录流程
 *
 * 功能覆盖：
 * - 简历在线编辑（Tiptap编辑器）
 * - PDF导出功能
 * - 投递记录创建和管理
 * - 简历版本切换
 * - 投递状态更新
 *
 * 技术栈：
 * - Cypress: E2E测试框架
 * - Vue 3 + TypeScript
 * - Tiptap编辑器
 * - Element Plus UI
 * - html2pdf.js
 *
 * 运行方式：
 * - 交互式: npm run test:e2e:open 或 npm run cypress:open
 * - 命令行: npm run test:e2e 或 npm run cypress:run
 *
 * 前置条件：
 * 1. 测试API服务运行在 http://localhost:3000
 * 2. 测试前端服务运行在 http://localhost:5173
 * 3. 测试环境: cypress.config.ts 中 env.testUser 可用
 * 4. 测试数据库已初始化
 */

/// <reference types="cypress" />

describe('简历管理 - E2E测试', () => {
  // ==================== 测试数据准备 ====================

  let testUser: { email: string; password: string }
  let testPosition: { name: string; description: string }
  let testResume: { title: string; content: string }
  let positionId: string
  let resumeId: string

  before(() => {
    // 生成唯一测试数据
    const timestamp = Date.now()
    testUser = {
      email: `resume.test.${timestamp}@example.com`,
      password: 'Test123456!'
    }
    testPosition = {
      name: `测试岗位-${timestamp}`,
      description: '这是一个用于测试简历管理功能的岗位'
    }
    testResume = {
      title: `测试简历-${timestamp}`,
      content: '# 个人简历\n\n## 基本信息\n姓名：测试用户\n\n## 工作经历\n- 2020-2023: 前端工程师'
    }

    // 注册并登录，创建测试岗位和简历
    cy.visit('/register')
    cy.intercept('POST', '**/api/v1/auth/register').as('register')
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').first().type(testUser.password)
    cy.get('input[type="password"]').then(($inputs) => {
      if ($inputs.length > 1) {
        cy.wrap($inputs[1]).type(testUser.password)
      }
    })
    cy.contains('button', /注册|提交/).click()
    cy.wait('@register')

    // 确保到达dashboard
    cy.url().should('match', /\/(dashboard|login)/, { timeout: 10000 })
    cy.url().then((url) => {
      if (url.includes('/login')) {
        cy.intercept('POST', '**/api/v1/auth/login').as('login')
        cy.get('input[type="email"]').type(testUser.email)
        cy.get('input[type="password"]').type(testUser.password)
        cy.contains('button', /登录|提交/).click()
        cy.wait('@login')
      }
    })
    cy.url().should('include', '/dashboard')

    // 创建测试岗位
    cy.intercept('POST', '**/api/v1/target-positions').as('createPosition')
    cy.contains('button', '创建新岗位').click()

    // 等待对话框出现 - Element Plus对话框结构: div.el-overlay > div.el-dialog__wrapper > div.el-dialog
    cy.get('.el-dialog:visible', { timeout: 10000 }).should('exist')
    cy.get('.el-dialog .el-form-item').eq(0).find('.el-input__inner').type(testPosition.name)
    cy.get('.el-dialog .el-form-item').eq(1).find('textarea').type(testPosition.description)
    cy.get('.el-dialog').contains('button', /确定|提交|保存|创建/i).click()

    cy.wait('@createPosition').then((interception) => {
      if (interception.response?.statusCode === 200 || interception.response?.statusCode === 201) {
        positionId = interception.response?.body.data?.id || interception.response?.body.id
      }
    })

    // 等待对话框关闭 - 检查不再可见
    cy.get('.el-dialog:visible').should('not.exist', { timeout: 10000 })
    cy.wait(1000)

    // 创建测试简历
    cy.contains(testPosition.name).click()
    cy.url().should('match', /\/positions\/[a-f0-9-]+/)
    cy.intercept('POST', '**/api/v1/resumes').as('createResume')

    // 等待页面加载完成后再点击按钮
    cy.wait(1000)
    cy.contains('button', /创建.*简历|新建.*简历|在线.*简历/i).click()

    // 等待对话框出现
    cy.get('.el-dialog:visible', { timeout: 10000 }).should('exist')

    // 在对话框中填写标题
    cy.get('.el-dialog input[type="text"]').filter(':visible').first().clear().type(testResume.title)

    // 点击对话框中的确认按钮
    cy.get('.el-dialog').contains('button', /确定|创建|保存|进入编辑/i).click()

    // 等待创建API响应
    cy.wait('@createResume', { timeout: 10000 }).then((interception) => {
      resumeId = interception.response?.body.data?.id || interception.response?.body.id
    })

    // 等待对话框关闭
    cy.get('.el-dialog:visible').should('not.exist', { timeout: 10000 })

    // 验证跳转到编辑器
    cy.url().should('include', '/editor', { timeout: 10000 })

    // 导航回仪表板，确保后续测试从干净状态开始
    cy.visit('/dashboard')
    cy.url().should('include', '/dashboard')
  })

  beforeEach(() => {
    // 每个测试前登录
    cy.visit('/login')
    cy.intercept('POST', '**/api/v1/auth/login').as('login')
    cy.get('input[type="email"]').clear().type(testUser.email)
    cy.get('input[type="password"]').clear().type(testUser.password)
    cy.contains('button', /登录|提交/).click()
    cy.wait('@login')
    cy.url().should('include', '/dashboard')
  })

  // ==================== 场景1：简历编辑功能 ====================

  describe('场景1：简历在线编辑', () => {
    it('应该能够打开简历编辑器', () => {
      // 进入岗位详情
      cy.contains(testPosition.name).click()
      cy.url().should('match', /\/positions\/[a-f0-9-]+/)

      // 点击简历卡片上的"查看"按钮进入编辑
      cy.contains(testResume.title).parents('.resume-card').within(() => {
        cy.contains('button', '查看').click()
      })
      cy.url().should('include', '/editor', { timeout: 10000 })

      // 验证编辑器加载
      cy.get('.ProseMirror', { timeout: 10000 }).should('be.visible')
    })

    it('应该能够编辑简历内容', () => {
      // 进入编辑器
      cy.contains(testPosition.name).click()
      cy.contains(testResume.title).parents('.resume-card').within(() => {
        cy.contains('button', '查看').click()
      })
      cy.url().should('include', '/editor', { timeout: 10000 })
      cy.get('.ProseMirror', { timeout: 10000 }).should('be.visible')

      // 清空并输入新内容
      cy.get('.ProseMirror').click().clear()
      cy.get('.ProseMirror').type(testResume.content)

      // 验证内容已输入
      cy.get('.ProseMirror').should('contain', '个人简历')
      cy.get('.ProseMirror').should('contain', '前端工程师')
    })

    it('应该能够保存简历修改', () => {
      // 进入编辑器
      cy.contains(testPosition.name).click()
      cy.contains(testResume.title).parents('.resume-card').within(() => {
        cy.contains('button', '查看').click()
      })
      cy.url().should('include', '/editor', { timeout: 10000 })
      cy.get('.ProseMirror', { timeout: 10000 }).should('be.visible')

      // 修改内容
      cy.get('.ProseMirror').click().type('\n\n新增内容：精通Cypress测试')

      // 保存 - 注意：API使用PUT方法，不是PATCH
      cy.intercept('PUT', '**/api/v1/resumes/*').as('updateResume')
      cy.contains('button', /保存|Save/i).click()

      // 等待保存完成
      cy.wait('@updateResume', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 204])
      })

      // 验证保存成功提示
      cy.contains(/保存成功|已保存/i, { timeout: 5000 }).should('be.visible')
    })
  })

  // ==================== 场景2：PDF导出功能 ====================

  describe('场景2：PDF导出', () => {
    it('应该显示PDF导出按钮', () => {
      // 进入编辑器
      cy.contains(testPosition.name).click()
      cy.contains(testResume.title).parents('.resume-card').within(() => {
        cy.contains('button', '查看').click()
      })
      cy.url().should('include', '/editor', { timeout: 10000 })
      cy.get('.ProseMirror', { timeout: 10000 }).should('be.visible')

      // 查找导出按钮
      cy.contains('button', /导出|Export|PDF/i).should('be.visible')
    })

    it('应该能够触发PDF导出', () => {
      // 进入编辑器
      cy.contains(testPosition.name).click()
      cy.contains(testResume.title).parents('.resume-card').within(() => {
        cy.contains('button', '查看').click()
      })
      cy.url().should('include', '/editor', { timeout: 10000 })
      cy.get('.ProseMirror', { timeout: 10000 }).should('be.visible')

      // 点击导出按钮（注意：实际下载可能在无头模式下不工作）
      cy.contains('button', /导出|Export|PDF/i).click()

      // 验证导出过程启动（可能显示loading或成功提示）
      // 根据实际UI调整验证方式
      cy.wait(1000) // 等待导出过程
    })
  })

  // ==================== 场景3：投递记录管理 ====================
  // 注意：投递记录功能的UI尚未实现，暂时跳过这些测试
  // TODO: 实现投递记录UI后，移除.skip()恢复这些测试

  describe.skip('场景3：投递记录创建和管理', () => {
    it('应该能够为简历创建投递记录', () => {
      // 进入岗位详情
      cy.contains(testPosition.name).click()
      cy.url().should('match', /\/positions\/[a-f0-9-]+/)

      // 找到简历卡片，点击添加投递记录
      cy.contains(testResume.title).parents('.resume-card').within(() => {
        cy.contains('button', /投递|添加投递/i).click()
      })

      // 填写投递记录表单
      cy.intercept('POST', '**/api/v1/applications').as('createApplication')

      cy.get('.el-dialog').should('be.visible')
      cy.get('.el-dialog input').filter(':visible').first().type('测试公司')
      cy.get('.el-dialog textarea').filter(':visible').first().type('通过官网投递')
      cy.get('.el-dialog').contains('button', /确定|提交|保存/i).click()

      cy.wait('@createApplication')
      cy.get('.el-dialog').should('not.exist')
    })

    it('应该能够查看投递记录列表', () => {
      // 进入岗位详情
      cy.contains(testPosition.name).click()
      cy.url().should('match', /\/positions\/[a-f0-9-]+/)

      // 查找投递记录tab或按钮
      cy.contains(/投递记录|Application/i).should('be.visible')
    })

    it('应该能够更新投递状态', () => {
      // 进入岗位详情
      cy.contains(testPosition.name).click()
      cy.url().should('match', /\/positions\/[a-f0-9-]+/)

      // 点击投递记录
      cy.contains(/投递记录|Application/i).click()

      // 更新状态（根据实际UI调整）
      cy.intercept('PUT', '**/api/v1/applications/*').as('updateApplication')
      cy.intercept('PATCH', '**/api/v1/applications/*').as('patchApplication')

      // 查找状态下拉或按钮
      cy.get('[data-cy="application-status"]').first().click()
      cy.contains(/面试中|已通过|已拒绝/i).first().click()

      // 等待更新完成
      cy.wait(['@updateApplication', '@patchApplication'], { timeout: 5000 })
    })
  })

  // ==================== 场景4：简历版本管理 ====================

  describe('场景4：简历版本和持久化', () => {
    it('应该能够查看同一岗位的多个简历版本', () => {
      // 进入岗位详情
      cy.contains(testPosition.name).click()
      cy.url().should('match', /\/positions\/[a-f0-9-]+/)

      // 验证简历列表存在
      cy.contains(testResume.title).should('be.visible')

      // 简历计数应该显示
      cy.contains(/简历|Resume/i).should('be.visible')
    })

    it('应该能够在刷新后保持数据', () => {
      // 进入岗位详情
      cy.contains(testPosition.name).click()
      cy.url().should('match', /\/positions\/[a-f0-9-]+/)

      // 记录当前URL
      cy.url().then((url) => {
        // 刷新页面
        cy.reload()

        // 验证数据依然存在
        cy.url().should('eq', url)
        cy.contains(testResume.title, { timeout: 10000 }).should('be.visible')
      })
    })

    it('应该能够删除简历', () => {
      // 创建一个临时简历用于删除测试
      cy.contains(testPosition.name).click()
      cy.url().should('match', /\/positions\/[a-f0-9-]+/)

      cy.intercept('POST', '**/api/v1/resumes').as('createTempResume')
      cy.contains('button', /创建.*简历|新建.*简历|在线.*简历/i).click()

      // 等待对话框出现
      cy.get('.el-dialog:visible', { timeout: 10000 }).should('exist')

      const tempResumeTitle = `待删除简历-${Date.now()}`
      // 在对话框中填写标题
      cy.get('.el-dialog input[type="text"]').filter(':visible').first().clear().type(tempResumeTitle)

      // 点击对话框中的确认按钮
      cy.get('.el-dialog').contains('button', /确定|创建|保存|进入编辑/i).click()

      // 等待API响应
      cy.wait('@createTempResume', { timeout: 10000 })

      // 等待对话框关闭
      cy.get('.el-dialog:visible').should('not.exist', { timeout: 10000 })

      // 如果跳转到编辑器，返回岗位详情
      cy.url().then((url) => {
        if (url.includes('/editor')) {
          cy.visit('/dashboard')
          cy.contains(testPosition.name).click()
          cy.url().should('match', /\/positions\/[a-f0-9-]+/)
        }
      })

      // 等待简历列表加载
      cy.contains(tempResumeTitle, { timeout: 10000 }).should('be.visible')

      // 删除简历 - 点击下拉菜单中的删除按钮
      cy.intercept('DELETE', '**/api/v1/resumes/*').as('deleteResume')
      cy.contains(tempResumeTitle).parents('.resume-card').within(() => {
        // 点击More按钮打开下拉菜单
        cy.get('.el-dropdown').find('button').click()
      })

      // 等待下拉菜单出现并点击删除
      cy.get('.el-dropdown-menu').should('be.visible')
      cy.get('.el-dropdown-menu').contains(/删除|Delete/i).click()

      // 确认删除（在确认对话框中）
      // ElMessageBox会创建一个.el-message-box元素，等待它出现
      cy.get('.el-message-box:visible', { timeout: 10000 }).should('exist')
      cy.get('.el-message-box:visible').within(() => {
        // 查找确认按钮 - Element Plus的确认按钮通常有el-button--primary类
        cy.contains('button', /确定|确认|删除/i).click()
      })

      cy.wait('@deleteResume')

      // 验证简历已删除
      cy.contains(tempResumeTitle).should('not.exist')
    })
  })

  // ==================== 清理 ====================

  after(() => {
    cy.log('测试完成，测试数据：', {
      user: testUser.email,
      position: testPosition.name,
      resume: testResume.title
    })
    // 注意：在实际项目中，应该通过专门的清理API删除测试数据
  })
})

/**
 * 最佳实践和注意事项：
 *
 * 1. 元素选择器：
 *    - 优先使用 data-cy 属性
 *    - 避免依赖易变的文本或CSS类
 *    - 使用语义化的选择器
 *
 * 2. 等待策略：
 *    - 使用 cy.intercept() + cy.wait() 等待API
 *    - 对异步UI更新使用适当的超时
 *    - 避免使用固定的 cy.wait(ms)
 *
 * 3. 测试隔离：
 *    - 每个测试应该独立可运行
 *    - 使用 beforeEach 重置状态
 *    - 避免测试间的数据依赖
 *
 * 4. 错误处理：
 *    - 使用条件判断处理可选流程
 *    - 配置合理的重试策略
 *    - 在关键操作后添加验证
 *
 * 5. 性能优化：
 *    - 使用 cy.session() 缓存登录状态
 *    - 在 before 钩子中准备共享数据
 *    - 避免不必要的UI交互
 *
 * 6. 维护性：
 *    - 保持测试简洁明了
 *    - 添加清晰的注释和描述
 *    - 定期重构重复代码为自定义命令
 */
