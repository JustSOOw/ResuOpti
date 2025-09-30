/**
 * E2E用户场景测试 - 从注册到创建简历的完整流程
 * 模拟真实用户操作，测试整个应用的核心功能
 *
 * 测试前提条件：
 * 1. 前端应用运行在 http://localhost:5173
 * 2. 后端API运行在 http://localhost:3000/api/v1
 * 3. 数据库已正确配置并运行
 *
 * 运行方式：
 * - 交互式模式：npm run cypress:open 或 npm run test:e2e:open
 * - 命令行模式：npm run cypress:run 或 npm run test:e2e
 */

/// <reference types="cypress" />

describe('用户完整旅程：从注册到创建简历', () => {
  // 生成唯一的测试用户数据
  const timestamp = Date.now()
  const testUser = {
    email: `test.user.${timestamp}@example.com`,
    password: 'Test123456!'
  }

  // 测试岗位数据
  const testPosition = {
    company: 'Test Company',
    title: '高级前端工程师',
    description: '负责Vue3应用开发，要求熟悉TypeScript和Element Plus'
  }

  // 测试简历数据
  const testResume = {
    title: '我的第一份简历',
    content: '姓名：张三\n联系方式：13800138000\n教育背景：本科计算机科学\n工作经历：3年前端开发经验'
  }

  beforeEach(() => {
    // 在每个测试前访问首页
    // 这确保测试从一个干净的状态开始
  })

  describe('场景1: 新用户注册到创建第一个简历', () => {
    it('步骤1: 访问注册页面', () => {
      // 访问注册页面
      cy.visit('/register')

      // 验证页面元素
      cy.contains('注册').should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')

      // 验证URL
      cy.url().should('include', '/register')
    })

    it('步骤2-4: 完成注册并自动登录', () => {
      // 设置API拦截器，监控注册请求
      cy.intercept('POST', '**/api/v1/auth/register').as('registerRequest')

      // 访问注册页面
      cy.visit('/register')

      // 填写注册表单
      // 注意：如果前端组件有data-cy属性，应该优先使用
      // 例如：cy.get('[data-cy="email-input"]')
      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').first().clear().type(testUser.password)

      // 如果有确认密码字段
      const passwordInputs = cy.get('input[type="password"]')
      passwordInputs.should('have.length.gte', 1)
      // 如果有两个密码输入框（密码和确认密码）
      cy.get('input[type="password"]').then(($inputs) => {
        if ($inputs.length > 1) {
          cy.wrap($inputs[1]).clear().type(testUser.password)
        }
      })

      // 提交注册表单
      cy.contains('button', /注册|提交/).click()

      // 等待注册API响应
      cy.wait('@registerRequest').then((interception) => {
        // 验证请求体
        expect(interception.request.body).to.have.property('email', testUser.email)

        // 验证响应
        expect(interception.response?.statusCode).to.equal(201)
        expect(interception.response?.body).to.have.property('token')
      })

      // 验证注册成功后的行为
      // 根据实际实现，可能直接跳转到仪表板或登录页
      cy.url().should('match', /\/(dashboard|login)/, { timeout: 10000 })

      // 如果跳转到登录页，则进行登录
      cy.url().then((url) => {
        if (url.includes('/login')) {
          cy.log('注册后跳转到登录页，执行登录操作')

          // 设置登录API拦截器
          cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

          // 填写登录表单
          cy.get('input[type="email"]').clear().type(testUser.email)
          cy.get('input[type="password"]').clear().type(testUser.password)

          // 提交登录
          cy.contains('button', /登录|提交/).click()

          // 等待登录响应
          cy.wait('@loginRequest')

          // 验证跳转到仪表板
          cy.url().should('include', '/dashboard', { timeout: 10000 })
        }
      })

      // 最终验证：应该在仪表板页面
      cy.url().should('include', '/dashboard')
    })

    it('步骤5-6: 验证进入仪表板并查看空状态', () => {
      // 使用自定义登录命令快速登录
      cy.visit('/login')
      cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').clear().type(testUser.password)
      cy.contains('button', /登录|提交/).click()

      cy.wait('@loginRequest')

      // 验证仪表板页面
      cy.url().should('include', '/dashboard')

      // 验证仪表板标题或关键元素
      // TODO: 根据实际实现调整选择器
      cy.contains(/仪表板|Dashboard/).should('be.visible')

      // 验证初始状态（应该没有岗位）
      // TODO: 如果有空状态提示，验证它的存在
      cy.contains(/创建.*岗位|添加.*岗位|新建.*岗位/i).should('be.visible')
    })

    it('步骤7-10: 创建目标岗位', () => {
      // 登录
      cy.visit('/login')
      cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').clear().type(testUser.password)
      cy.contains('button', /登录|提交/).click()

      cy.wait('@loginRequest')
      cy.url().should('include', '/dashboard')

      // 设置创建岗位API拦截器
      cy.intercept('POST', '**/api/v1/positions').as('createPosition')
      cy.intercept('GET', '**/api/v1/positions').as('getPositions')

      // 点击创建岗位按钮
      // TODO: 根据实际UI调整选择器
      cy.contains('button', /创建.*岗位|添加.*岗位|新建.*岗位/i).click()

      // 填写岗位表单
      // 注意：这里假设有对话框或表单弹出
      // TODO: 根据实际实现调整选择器
      cy.get('input').filter(':visible').first().clear().type(testPosition.company)
      cy.get('input').filter(':visible').eq(1).clear().type(testPosition.title)

      // 如果有描述字段（可能是textarea）
      cy.get('textarea').filter(':visible').first().clear().type(testPosition.description)

      // 提交表单
      cy.contains('button', /确定|提交|保存|创建/i).click()

      // 等待创建API响应
      cy.wait('@createPosition').then((interception) => {
        // 验证请求体
        expect(interception.request.body).to.include({
          company: testPosition.company,
          title: testPosition.title
        })

        // 验证响应
        expect(interception.response?.statusCode).to.be.oneOf([200, 201])
        expect(interception.response?.body).to.have.property('id')

        // 保存岗位ID供后续测试使用
        const positionId = interception.response?.body.id
        cy.wrap(positionId).as('positionId')
      })

      // 验证岗位出现在列表中
      cy.wait('@getPositions')
      cy.contains(testPosition.company).should('be.visible')
      cy.contains(testPosition.title).should('be.visible')
    })

    it('步骤11-16: 创建在线简历', () => {
      // 登录
      cy.visit('/login')
      cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').clear().type(testUser.password)
      cy.contains('button', /登录|提交/).click()

      cy.wait('@loginRequest')
      cy.url().should('include', '/dashboard')

      // 等待岗位列表加载
      cy.intercept('GET', '**/api/v1/positions').as('getPositions')
      cy.wait('@getPositions')

      // 找到并点击刚创建的岗位
      cy.contains(testPosition.title).should('be.visible')

      // 点击岗位卡片进入详情页
      // TODO: 根据实际UI调整选择器
      cy.contains(testPosition.title).click()

      // 验证进入岗位详情页
      cy.url().should('match', /\/positions\/\d+/)

      // 设置创建简历API拦截器
      cy.intercept('POST', '**/api/v1/resumes').as('createResume')

      // 点击创建在线简历按钮
      // TODO: 根据实际UI调整选择器
      cy.contains('button', /创建.*简历|新建.*简历|在线简历/i).click()

      // 可能会弹出对话框要求输入简历标题
      // 或者直接跳转到编辑器页面
      cy.url().then((url) => {
        if (!url.includes('/editor')) {
          // 如果还在岗位详情页，说明弹出了对话框
          cy.get('input').filter(':visible').first().clear().type(testResume.title)
          cy.contains('button', /确定|创建|保存/i).click()
          cy.wait('@createResume')
        }
      })

      // 验证进入编辑器页面
      cy.url().should('include', '/editor', { timeout: 10000 })

      // 验证编辑器加载
      // Tiptap编辑器通常有.ProseMirror类
      cy.get('.ProseMirror', { timeout: 10000 }).should('be.visible')

      // 在编辑器中输入内容
      cy.get('.ProseMirror').click().type(testResume.content)

      // 验证内容已输入
      cy.get('.ProseMirror').should('contain', '张三')

      // 保存简历
      cy.intercept('PUT', '**/api/v1/resumes/*').as('updateResume')
      cy.intercept('PATCH', '**/api/v1/resumes/*').as('patchResume')

      // 查找并点击保存按钮
      cy.contains('button', /保存|Save/i).click()

      // 等待保存响应（可能是PUT或PATCH）
      cy.wait(['@updateResume', '@patchResume'], { timeout: 10000 }).then((interceptions) => {
        const interception = interceptions[0] || interceptions[1]
        if (interception) {
          expect(interception.response?.statusCode).to.be.oneOf([200, 204])
        }
      })

      // 验证保存成功提示
      // TODO: 根据实际UI调整
      cy.contains(/保存成功|已保存/i, { timeout: 5000 }).should('be.visible')
    })

    it('步骤17: 验证简历出现在岗位的简历列表中', () => {
      // 登录
      cy.visit('/login')
      cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').clear().type(testUser.password)
      cy.contains('button', /登录|提交/).click()

      cy.wait('@loginRequest')
      cy.url().should('include', '/dashboard')

      // 返回岗位详情页
      cy.intercept('GET', '**/api/v1/positions').as('getPositions')
      cy.wait('@getPositions')

      cy.contains(testPosition.title).click()
      cy.url().should('match', /\/positions\/\d+/)

      // 设置简历列表API拦截器
      cy.intercept('GET', '**/api/v1/positions/*/resumes').as('getResumes')

      // 等待简历列表加载
      cy.wait('@getResumes', { timeout: 10000 })

      // 验证简历出现在列表中
      // TODO: 根据实际UI调整选择器
      cy.contains(testResume.title).should('be.visible')
    })
  })

  describe('场景2: 用户登录后的操作流程（可选）', () => {
    // 这个测试依赖于前面创建的测试数据
    // 如果前面的测试失败，这个测试也会失败

    it('登录并查看已有的岗位和简历', () => {
      // 访问登录页面
      cy.visit('/login')

      // 设置API拦截器
      cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')
      cy.intercept('GET', '**/api/v1/positions').as('getPositions')

      // 填写登录表单
      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').clear().type(testUser.password)

      // 提交登录
      cy.contains('button', /登录|提交/).click()

      // 等待登录响应
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200)
        expect(interception.response?.body).to.have.property('token')
      })

      // 验证跳转到仪表板
      cy.url().should('include', '/dashboard')

      // 等待岗位列表加载
      cy.wait('@getPositions')

      // 验证岗位存在
      cy.contains(testPosition.company).should('be.visible')
      cy.contains(testPosition.title).should('be.visible')
    })

    it('编辑已有简历', () => {
      // 使用登录命令快速登录
      cy.visit('/login')
      cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').clear().type(testUser.password)
      cy.contains('button', /登录|提交/).click()

      cy.wait('@loginRequest')

      // 进入岗位详情
      cy.intercept('GET', '**/api/v1/positions').as('getPositions')
      cy.wait('@getPositions')

      cy.contains(testPosition.title).click()

      // 等待简历列表
      cy.intercept('GET', '**/api/v1/positions/*/resumes').as('getResumes')
      cy.wait('@getResumes')

      // 点击简历进入编辑
      cy.contains(testResume.title).click()

      // 验证进入编辑器
      cy.url().should('include', '/editor')

      // 等待编辑器加载
      cy.get('.ProseMirror', { timeout: 10000 }).should('be.visible')

      // 验证原有内容存在
      cy.get('.ProseMirror').should('contain', '张三')

      // 添加新内容
      cy.get('.ProseMirror').click().type('\n\n技能：Vue3, TypeScript, Cypress')

      // 保存修改
      cy.intercept('PUT', '**/api/v1/resumes/*').as('updateResume')
      cy.intercept('PATCH', '**/api/v1/resumes/*').as('patchResume')

      cy.contains('button', /保存|Save/i).click()

      // 等待保存
      cy.wait(['@updateResume', '@patchResume'], { timeout: 10000 })

      // 验证保存成功
      cy.contains(/保存成功|已保存/i).should('be.visible')
    })

    it('退出登录', () => {
      // 登录
      cy.visit('/login')
      cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

      cy.get('input[type="email"]').clear().type(testUser.email)
      cy.get('input[type="password"]').clear().type(testUser.password)
      cy.contains('button', /登录|提交/).click()

      cy.wait('@loginRequest')
      cy.url().should('include', '/dashboard')

      // 查找并点击登出按钮
      // TODO: 根据实际UI调整选择器
      // 可能在用户菜单中，或者在导航栏
      cy.contains(/退出|登出|Logout/i).click()

      // 验证跳转到登录页
      cy.url().should('include', '/login')

      // 验证localStorage中的token已清除
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.be.null
      })

      // 尝试访问需要认证的页面，应该被重定向到登录页
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })
  })

  // 清理：在所有测试完成后
  // 注意：这可能需要管理员权限或专门的清理API
  // 在实际项目中，可能需要通过数据库直接清理测试数据
  after(() => {
    cy.log('测试完成，测试用户数据：', testUser.email)
    // TODO: 如果有清理API，可以在这里调用
    // 例如：cy.request('DELETE', `${Cypress.env('apiUrl')}/test/cleanup`, { email: testUser.email })
  })
})

/**
 * 实施建议和注意事项：
 *
 * 1. 元素选择器优化：
 *    - 在前端组件中添加data-cy属性，例如：
 *      <el-button data-cy="create-position-btn">创建岗位</el-button>
 *    - 然后在测试中使用：cy.get('[data-cy="create-position-btn"]')
 *    - 这样可以避免因UI文本变化导致测试失败
 *
 * 2. API拦截和等待：
 *    - 所有cy.intercept()都应该配合cy.wait()使用
 *    - 这确保测试在API响应完成后再继续
 *    - 避免竞态条件和不稳定的测试
 *
 * 3. 测试数据管理：
 *    - 使用时间戳生成唯一的测试用户邮箱
 *    - 这允许测试在不清理数据库的情况下重复运行
 *    - 在CI/CD环境中特别有用
 *
 * 4. 超时设置：
 *    - 根据实际网络和服务器响应时间调整超时值
 *    - 在cypress.config.ts中设置全局默认值
 *    - 在特定命令中可以覆盖默认值
 *
 * 5. 错误处理：
 *    - Cypress会自动重试某些命令
 *    - 在cypress.config.ts中配置重试策略
 *    - 对于关键操作，可以添加额外的验证
 *
 * 6. 调试技巧：
 *    - 使用cy.pause()暂停测试
 *    - 使用cy.debug()输出调试信息
 *    - 在Cypress Test Runner中可以时间旅行查看每一步
 *    - 查看视频和截图了解失败原因
 *
 * 7. CI/CD集成：
 *    - 确保在CI环境中后端服务和数据库都已启动
 *    - 可能需要使用docker-compose启动完整的测试环境
 *    - 设置适当的环境变量
 *
 * 8. 性能优化：
 *    - 对于重复的登录操作，考虑使用cy.session()缓存会话
 *    - 使用自定义命令简化重复的操作
 *    - 在不影响测试准确性的前提下，使用API代替UI操作
 */