/**
 * E2E测试: 简历元数据完整编辑流程测试
 *
 * 测试范围:
 * - 打开元数据编辑对话框
 * - 编辑备注内容（添加、修改、清空）
 * - 管理标签（添加、删除）
 * - 表单验证（备注长度、标签数量限制）
 * - 提交更新并验证数据持久化
 * - 不同类型简历（文件/在线）的元数据编辑
 *
 * 技术栈:
 * - Cypress: E2E测试框架
 * - Vue 3 + TypeScript
 * - Element Plus UI库
 * - ResumeMetadataDialog组件
 *
 * 运行方式:
 * - 交互式: npm run cypress:open --prefix frontend
 * - 命令行: npm run cypress:run --prefix frontend --spec "tests/e2e/resume-metadata.cy.ts"
 *
 * 前提条件:
 * 1. 后端服务运行在 http://localhost:3000
 * 2. 前端应用运行在 http://localhost:5173
 * 3. 数据库已正确配置
 * 4. 已有测试用户账号
 */

/// <reference types="cypress" />

describe('简历元数据编辑 - E2E测试', () => {
  // ==================== 测试数据准备 ====================

  let testPositionId: string
  let testOnlineResumeId: string
  let testFileResumeId: string
  const testUser = Cypress.env('testUser')

  // 测试数据
  const testData = {
    position: {
      company: '测试公司-元数据',
      title: '前端工程师-元数据测试',
      description: '用于测试简历元数据编辑功能'
    },
    onlineResume: {
      title: '在线简历-元数据测试',
      content: '<p>这是在线简历内容</p>'
    },
    fileResume: {
      title: '文件简历-元数据测试'
    },
    metadata: {
      notes: '这是一条测试备注，用于验证备注编辑功能',
      updatedNotes: '这是更新后的备注内容，包含更多详细信息',
      tags: ['技术重点', 'React专精', '前端开发'],
      additionalTags: ['TypeScript', 'Vue3']
    }
  }

  // ==================== 测试前置设置 ====================

  before(() => {
    // 确保测试从首页开始
    cy.visit('/')
  })

  beforeEach(() => {
    // 清理cookies和localStorage
    cy.clearCookies()
    cy.clearLocalStorage()

    // 登录测试用户
    cy.visit('/login')
    cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest')

    cy.get('input[type="email"]').clear().type(testUser.email)
    cy.get('input[type="password"]').clear().type(testUser.password)
    cy.contains('button', /登录|提交/).click()

    cy.wait('@loginRequest')
    cy.url().should('include', '/dashboard')

    // 设置API拦截器
    cy.intercept('GET', '**/api/v1/resumes*').as('getResumes')
    cy.intercept('GET', '**/api/v1/resumes/*').as('getResumeById')
    cy.intercept('PUT', '**/api/v1/resumes/*').as('updateResume')
    cy.intercept('GET', '**/api/v1/positions*').as('getPositions')
    cy.intercept('POST', '**/api/v1/positions').as('createPosition')
    cy.intercept('POST', '**/api/v1/resumes').as('createResume')
  })

  // ==================== 辅助函数 ====================

  /**
   * 创建测试岗位
   */
  const createTestPosition = () => {
    cy.visit('/dashboard')

    // 点击创建岗位按钮
    cy.contains('button', /创建.*岗位|添加.*岗位|新建.*岗位/i).click()

    // 填写岗位表单
    cy.get('input').filter(':visible').first().clear().type(testData.position.company)
    cy.get('input').filter(':visible').eq(1).clear().type(testData.position.title)
    cy.get('textarea').filter(':visible').first().clear().type(testData.position.description)

    // 提交表单
    cy.contains('button', /确定|提交|保存|创建/i).click()

    // 等待API响应
    cy.wait('@createPosition').then((interception) => {
      testPositionId = interception.response?.body.data.id
      expect(testPositionId).to.exist
    })

    // 验证创建成功
    cy.contains(testData.position.title).should('be.visible')
  }

  /**
   * 创建测试简历（在线）
   */
  const createTestOnlineResume = () => {
    cy.visit('/dashboard')

    // 进入岗位详情页
    cy.wait('@getPositions')
    cy.contains(testData.position.title).click()
    cy.url().should('match', /\/positions\/\d+/)

    // 创建在线简历
    cy.contains('button', /创建.*简历|新建.*简历|在线简历/i).click()

    // 如果弹出对话框，填写标题
    cy.url().then((url) => {
      if (!url.includes('/editor')) {
        cy.get('input').filter(':visible').first().clear().type(testData.onlineResume.title)
        cy.contains('button', /确定|创建|保存/i).click()
      }
    })

    cy.wait('@createResume').then((interception) => {
      testOnlineResumeId = interception.response?.body.data.id
      expect(testOnlineResumeId).to.exist
    })
  }

  /**
   * 打开元数据编辑对话框
   * @param resumeTitle 简历标题
   */
  const openMetadataDialog = (resumeTitle: string) => {
    // 返回岗位详情页
    cy.visit('/dashboard')
    cy.wait('@getPositions')
    cy.contains(testData.position.title).click()
    cy.url().should('match', /\/positions\/\d+/)

    // 等待简历列表加载
    cy.wait('@getResumes')

    // 找到简历卡片并点击编辑元数据按钮
    cy.contains(resumeTitle).parents('[data-cy=resume-card]').within(() => {
      // 点击编辑元数据按钮（可能是一个图标按钮或文本按钮）
      cy.get('[data-cy=edit-metadata-btn]').click()
    })

    // 验证对话框打开
    cy.get('.el-dialog').should('be.visible')
    cy.contains('编辑简历元数据').should('be.visible')
  }

  // ==================== 测试套件1: 基础元数据编辑功能 ====================

  describe('场景1: 基础元数据编辑功能', () => {
    before(() => {
      // 创建测试数据
      createTestPosition()
      createTestOnlineResume()
    })

    it('应该能够打开元数据编辑对话框', () => {
      openMetadataDialog(testData.onlineResume.title)

      // 验证对话框元素
      cy.get('.el-dialog').within(() => {
        cy.contains('编辑简历元数据').should('be.visible')
        cy.contains(testData.onlineResume.title).should('be.visible')
        cy.get('textarea').should('be.visible') // 备注输入框
        cy.contains('标签').should('be.visible')
        cy.contains('button', '取消').should('be.visible')
        cy.contains('button', '保存').should('be.visible')
      })
    })

    it('应该能够添加和保存备注', () => {
      openMetadataDialog(testData.onlineResume.title)

      // 输入备注
      cy.get('.el-dialog').within(() => {
        cy.get('textarea').clear().type(testData.metadata.notes)

        // 验证字符计数
        cy.contains(/\d+\s*\/\s*2000/).should('be.visible')

        // 点击保存
        cy.contains('button', '保存').click()
      })

      // 等待API响应
      cy.wait('@updateResume').then((interception) => {
        expect(interception.request.body).to.have.property('notes', testData.metadata.notes)
        expect(interception.response?.statusCode).to.equal(200)
      })

      // 验证保存成功提示
      cy.contains(/元数据更新成功|保存成功/).should('be.visible')

      // 验证对话框关闭
      cy.get('.el-dialog').should('not.exist')
    })

    it('应该能够修改已有备注', () => {
      openMetadataDialog(testData.onlineResume.title)

      // 验证已有备注显示
      cy.get('.el-dialog').within(() => {
        cy.get('textarea').should('have.value', testData.metadata.notes)

        // 修改备注
        cy.get('textarea').clear().type(testData.metadata.updatedNotes)

        // 保存
        cy.contains('button', '保存').click()
      })

      cy.wait('@updateResume').then((interception) => {
        expect(interception.request.body.notes).to.equal(testData.metadata.updatedNotes)
      })

      cy.contains(/元数据更新成功|保存成功/).should('be.visible')
    })

    it('应该能够清空备注', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 清空备注
        cy.get('textarea').clear()

        // 保存
        cy.contains('button', '保存').click()
      })

      cy.wait('@updateResume').then((interception) => {
        // 空备注应该发送null
        expect(interception.request.body.notes).to.be.null
      })

      cy.contains(/元数据更新成功|保存成功/).should('be.visible')
    })
  })

  // ==================== 测试套件2: 标签管理功能 ====================

  describe('场景2: 标签管理功能', () => {
    it('应该能够添加标签', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 逐个添加标签
        testData.metadata.tags.forEach((tag) => {
          cy.get('input[placeholder*="输入标签"]').type(`${tag}{enter}`)

          // 验证标签出现在列表中
          cy.contains('.el-tag', tag).should('be.visible')
        })

        // 保存
        cy.contains('button', '保存').click()
      })

      cy.wait('@updateResume').then((interception) => {
        expect(interception.request.body.tags).to.deep.equal(testData.metadata.tags)
      })

      cy.contains(/元数据更新成功|保存成功/).should('be.visible')
    })

    it('应该能够删除标签', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 验证标签存在
        testData.metadata.tags.forEach((tag) => {
          cy.contains('.el-tag', tag).should('be.visible')
        })

        // 删除第一个标签
        cy.contains('.el-tag', testData.metadata.tags[0]).within(() => {
          cy.get('.el-icon-close').click()
        })

        // 验证标签已删除
        cy.contains('.el-tag', testData.metadata.tags[0]).should('not.exist')

        // 保存
        cy.contains('button', '保存').click()
      })

      cy.wait('@updateResume').then((interception) => {
        // 验证删除后的标签列表
        expect(interception.request.body.tags).to.have.length(2)
        expect(interception.request.body.tags).to.not.include(testData.metadata.tags[0])
      })
    })

    it('应该能够通过点击添加按钮添加标签', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 输入标签但不按回车
        cy.get('input[placeholder*="输入标签"]').type(testData.metadata.additionalTags[0])

        // 点击添加按钮
        cy.contains('button', '添加').click()

        // 验证标签添加成功
        cy.contains('.el-tag', testData.metadata.additionalTags[0]).should('be.visible')

        // 保存
        cy.contains('button', '保存').click()
      })

      cy.wait('@updateResume')
      cy.contains(/元数据更新成功|保存成功/).should('be.visible')
    })

    it('应该阻止添加重复标签', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 获取已有标签
        cy.get('.el-tag').first().invoke('text').then((tagText) => {
          const existingTag = tagText.trim()

          // 尝试添加重复标签
          cy.get('input[placeholder*="输入标签"]').type(`${existingTag}{enter}`)

          // 验证显示警告消息
          cy.contains(/该标签已存在/).should('be.visible')
        })
      })
    })

    it('应该能够清空所有标签', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 删除所有标签
        cy.get('.el-tag .el-icon-close').each(($closeBtn) => {
          cy.wrap($closeBtn).click()
        })

        // 验证显示空状态
        cy.contains('暂无标签').should('be.visible')

        // 保存
        cy.contains('button', '保存').click()
      })

      cy.wait('@updateResume').then((interception) => {
        expect(interception.request.body.tags).to.be.an('array').that.is.empty
      })
    })
  })

  // ==================== 测试套件3: 表单验证 ====================

  describe('场景3: 表单验证功能', () => {
    it('应该阻止超长备注（>2000字符）', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 生成2001个字符的备注
        const longNotes = 'a'.repeat(2001)
        cy.get('textarea').clear().type(longNotes, { delay: 0 })

        // 验证错误提示
        cy.contains(/备注长度不能超过2000/).should('be.visible')

        // 验证保存按钮禁用
        cy.contains('button', '保存').should('be.disabled')
      })
    })

    it('应该阻止超过20个标签', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 清空现有标签
        cy.get('.el-tag .el-icon-close').each(($closeBtn) => {
          cy.wrap($closeBtn).click()
        })

        // 添加20个标签
        for (let i = 1; i <= 20; i++) {
          cy.get('input[placeholder*="输入标签"]').type(`标签${i}{enter}`)
        }

        // 验证达到上限提示
        cy.contains(/已达到标签数量上限/).should('be.visible')

        // 验证输入框禁用
        cy.get('input[placeholder*="输入标签"]').should('be.disabled')

        // 验证添加按钮禁用
        cy.contains('button', '添加').should('be.disabled')

        // 尝试添加第21个标签（应该被阻止）
        cy.get('input[placeholder*="输入标签"]').should('be.disabled')
      })
    })

    it('应该阻止超长标签（>50字符）', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 输入超长标签
        const longTag = 'a'.repeat(51)
        cy.get('input[placeholder*="输入标签"]').type(longTag)

        // 点击添加
        cy.contains('button', '添加').click()

        // 验证错误提示
        cy.contains(/标签长度不能超过50/).should('be.visible')

        // 验证标签未添加
        cy.get('.el-tag').should('not.contain', longTag)
      })
    })

    it('应该阻止空标签', () => {
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        // 输入空格并尝试添加
        cy.get('input[placeholder*="输入标签"]').type('   {enter}')

        // 验证标签未添加（标签数量不变）
        cy.get('.el-tag').should('have.length', 0) // 假设之前清空了
      })
    })
  })

  // ==================== 测试套件4: 数据持久化验证 ====================

  describe('场景4: 数据持久化验证', () => {
    it('应该在刷新后保持元数据', () => {
      // 添加元数据
      openMetadataDialog(testData.onlineResume.title)

      cy.get('.el-dialog').within(() => {
        cy.get('textarea').clear().type('持久化测试备注')
        cy.get('input[placeholder*="输入标签"]').type('持久化标签{enter}')
        cy.contains('button', '保存').click()
      })

      cy.wait('@updateResume')

      // 刷新页面
      cy.reload()

      // 重新打开对话框
      cy.wait('@getPositions')
      cy.contains(testData.position.title).click()
      cy.wait('@getResumes')

      cy.contains(testData.onlineResume.title).parents('[data-cy=resume-card]').within(() => {
        cy.get('[data-cy=edit-metadata-btn]').click()
      })

      // 验证数据保持
      cy.get('.el-dialog').within(() => {
        cy.get('textarea').should('have.value', '持久化测试备注')
        cy.contains('.el-tag', '持久化标签').should('be.visible')
      })
    })

    it('应该在取消后不保存更改', () => {
      openMetadataDialog(testData.onlineResume.title)

      // 记录原始备注
      let originalNotes: string

      cy.get('.el-dialog').within(() => {
        cy.get('textarea').invoke('val').then((val) => {
          originalNotes = val as string

          // 修改备注
          cy.get('textarea').clear().type('这个修改应该被取消')

          // 点击取消
          cy.contains('button', '取消').click()
        })
      })

      // 验证对话框关闭
      cy.get('.el-dialog').should('not.exist')

      // 重新打开对话框
      cy.contains(testData.onlineResume.title).parents('[data-cy=resume-card]').within(() => {
        cy.get('[data-cy=edit-metadata-btn]').click()
      })

      // 验证备注未改变
      cy.get('.el-dialog').within(() => {
        cy.get('textarea').invoke('val').should((val) => {
          expect(val).to.equal(originalNotes)
        })
      })
    })
  })

  // ==================== 测试套件5: 完整工作流程 ====================

  describe('场景5: 完整元数据编辑工作流程', () => {
    it('应该能够完成完整的元数据编辑流程', () => {
      // 步骤1: 打开对话框
      openMetadataDialog(testData.onlineResume.title)

      // 步骤2: 添加备注
      cy.get('.el-dialog').within(() => {
        cy.get('textarea').clear().type('完整流程测试 - 这份简历专门针对某公司定制')

        // 步骤3: 添加多个标签
        const workflowTags = ['技术栈优化', '项目经验调整', '公司定制版', '待投递']
        workflowTags.forEach((tag) => {
          cy.get('input[placeholder*="输入标签"]').type(`${tag}{enter}`)
        })

        // 步骤4: 验证所有标签都添加成功
        workflowTags.forEach((tag) => {
          cy.contains('.el-tag', tag).should('be.visible')
        })

        // 步骤5: 删除一个标签
        cy.contains('.el-tag', '待投递').within(() => {
          cy.get('.el-icon-close').click()
        })

        // 步骤6: 验证标签被删除
        cy.contains('.el-tag', '待投递').should('not.exist')

        // 步骤7: 保存
        cy.contains('button', '保存').click()
      })

      // 步骤8: 验证API调用
      cy.wait('@updateResume').then((interception) => {
        expect(interception.request.body.notes).to.include('完整流程测试')
        expect(interception.request.body.tags).to.have.length(3)
        expect(interception.request.body.tags).to.not.include('待投递')
      })

      // 步骤9: 验证成功提示
      cy.contains(/元数据更新成功|保存成功/).should('be.visible')

      // 步骤10: 验证简历卡片显示元数据
      cy.contains(testData.onlineResume.title).parents('[data-cy=resume-card]').within(() => {
        // 验证标签显示
        cy.contains('技术栈优化').should('be.visible')
        cy.contains('项目经验调整').should('be.visible')
        cy.contains('公司定制版').should('be.visible')
      })
    })
  })

  // ==================== 清理 ====================

  after(() => {
    cy.log('元数据编辑E2E测试完成')
    // 注意: 在实际项目中，可能需要清理测试数据
    // 可以通过API或数据库直接清理
  })
})

/**
 * 实施建议:
 *
 * 1. data-cy属性配置:
 *    需要在以下组件中添加data-cy属性:
 *    - ResumeCard组件: data-cy="resume-card", data-cy="edit-metadata-btn"
 *    - ResumeMetadataDialog组件: data-cy属性已足够
 *    - PositionDetailView: 确保简历卡片有正确的data-cy属性
 *
 * 2. API拦截器:
 *    所有元数据相关的API调用都已拦截，确保测试稳定性
 *
 * 3. 等待策略:
 *    使用cy.wait()等待API响应，避免竞态条件
 *
 * 4. 元素选择器:
 *    优先使用data-cy属性，其次使用Element Plus组件类名
 *
 * 5. 错误处理:
 *    Cypress会自动重试失败的断言，配置在cypress.config.ts中
 *
 * 6. 测试数据隔离:
 *    每个测试使用独立的测试数据，避免互相影响
 *
 * 7. 调试技巧:
 *    - 使用cy.pause()暂停测试
 *    - 在Cypress Test Runner中查看DOM快照
 *    - 查看Network标签验证API调用
 *
 * 8. CI/CD集成:
 *    确保后端服务和数据库在CI环境中正确启动
 */
