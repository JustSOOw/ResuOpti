/**
 * 示例简历版本种子数据
 * 为演示用户创建不同类型的简历版本（在线和文件类型）
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  /**
   * 创建示例简历版本
   */
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // 查找演示用户的目标岗位ID
    const [positions] = await queryInterface.sequelize.query(
      `SELECT tp.id, tp.name
       FROM target_positions tp
       JOIN users u ON tp.user_id = u.id
       WHERE u.email = 'demo@resumopti.com';`
    );

    if (positions.length === 0) {
      console.log('⚠️  警告: 未找到演示用户的目标岗位，请先运行 02-demo-positions.js');
      return;
    }

    // 准备简历数据
    const resumeVersions = [];
    const resumeMetadata = [];

    // 为前端开发岗位创建在线简历
    const frontendPosition = positions.find(p => p.name === '前端开发工程师');
    if (frontendPosition) {
      const resumeId1 = uuidv4();
      resumeVersions.push({
        id: resumeId1,
        target_position_id: frontendPosition.id,
        type: 'online',
        title: '前端开发-互联网大厂版',
        file_path: null,
        file_name: null,
        file_size: null,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: '张三 - 前端开发工程师' }]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '📧 Email: zhangsan@example.com | 📱 Phone: 138****8888' }
              ]
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '技能特长' }]
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '精通 Vue 3、React 18、TypeScript' }] }]
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '熟悉 Webpack、Vite 等前端工程化工具' }] }]
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '掌握响应式设计、性能优化、前端安全' }] }]
                }
              ]
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '工作经历' }]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', marks: [{ type: 'bold' }], text: 'XX科技有限公司 | 高级前端工程师 | 2021.06 - 至今' }
              ]
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '负责公司核心产品前端架构设计和开发' }] }]
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '优化首屏加载速度，提升40%性能' }] }]
                }
              ]
            }
          ]
        }),
        created_at: now,
        updated_at: now
      });

      resumeMetadata.push({
        id: uuidv4(),
        resume_id: resumeId1,
        notes: '重点突出前端性能优化和工程化经验，适合投递阿里、字节等大厂',
        tags: JSON.stringify(['性能优化', 'Vue专家', '大厂定制']),
        created_at: now,
        updated_at: now
      });
    }

    // 为后端开发岗位创建文件类型简历
    const backendPosition = positions.find(p => p.name === '后端开发工程师');
    if (backendPosition) {
      const resumeId2 = uuidv4();
      resumeVersions.push({
        id: resumeId2,
        target_position_id: backendPosition.id,
        type: 'file',
        title: '后端开发-微服务架构版',
        file_path: '/uploads/demo/backend-resume-example.pdf',
        file_name: 'backend-resume-example.pdf',
        file_size: 245760, // 240KB
        content: null,
        created_at: now,
        updated_at: now
      });

      resumeMetadata.push({
        id: uuidv4(),
        resume_id: resumeId2,
        notes: '强调微服务架构经验和高并发处理能力',
        tags: JSON.stringify(['微服务', 'Node.js', '高并发']),
        created_at: now,
        updated_at: now
      });
    }

    // 为全栈开发岗位创建在线简历
    const fullstackPosition = positions.find(p => p.name === '全栈开发工程师');
    if (fullstackPosition) {
      const resumeId3 = uuidv4();
      resumeVersions.push({
        id: resumeId3,
        target_position_id: fullstackPosition.id,
        type: 'online',
        title: '全栈开发-创业公司版',
        file_path: null,
        file_name: null,
        file_size: null,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: '张三 - 全栈开发工程师' }]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '一个能从0到1独立完成项目的全能选手' }
              ]
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '核心技能' }]
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '前端: Vue.js、React、TypeScript' }] }]
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '后端: Node.js、Express、PostgreSQL' }] }]
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '运维: Docker、CI/CD、云服务部署' }] }]
                }
              ]
            }
          ]
        }),
        created_at: now,
        updated_at: now
      });

      resumeMetadata.push({
        id: uuidv4(),
        resume_id: resumeId3,
        notes: '全栈技能突出，适合投递创业公司和中小团队',
        tags: JSON.stringify(['全栈', '独立开发', '快速迭代']),
        created_at: now,
        updated_at: now
      });
    }

    // 插入简历版本数据
    if (resumeVersions.length > 0) {
      await queryInterface.bulkInsert('resume_versions', resumeVersions, {});
      console.log(`✅ 创建了 ${resumeVersions.length} 个示例简历版本`);
    }

    // 插入简历元数据
    if (resumeMetadata.length > 0) {
      await queryInterface.bulkInsert('resume_metadata', resumeMetadata, {});
      console.log(`✅ 创建了 ${resumeMetadata.length} 个简历元数据记录`);
    }
  },

  /**
   * 回滚操作：删除示例简历
   */
  down: async (queryInterface, Sequelize) => {
    // 查找演示用户的所有简历ID
    const [resumes] = await queryInterface.sequelize.query(
      `SELECT rv.id
       FROM resume_versions rv
       JOIN target_positions tp ON rv.target_position_id = tp.id
       JOIN users u ON tp.user_id = u.id
       WHERE u.email = 'demo@resumopti.com';`
    );

    if (resumes.length === 0) {
      return;
    }

    const resumeIds = resumes.map(r => r.id);

    // 删除简历元数据
    await queryInterface.bulkDelete('resume_metadata', {
      resume_id: resumeIds
    }, {});

    // 删除简历版本
    await queryInterface.bulkDelete('resume_versions', {
      id: resumeIds
    }, {});

    console.log('🗑️  示例简历已删除');
  }
};