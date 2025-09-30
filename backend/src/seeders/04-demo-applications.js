/**
 * 示例投递记录种子数据
 * 为演示用户的简历创建一些投递记录，展示状态跟踪功能
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  /**
   * 创建示例投递记录
   */
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // 查找演示用户的简历版本
    const [resumes] = await queryInterface.sequelize.query(
      `SELECT rv.id, rv.title
       FROM resume_versions rv
       JOIN target_positions tp ON rv.target_position_id = tp.id
       JOIN users u ON tp.user_id = u.id
       WHERE u.email = 'demo@resumopti.com';`
    );

    if (resumes.length === 0) {
      console.log('⚠️  警告: 未找到演示用户的简历，请先运行 03-demo-resumes.js');
      return;
    }

    // 准备投递记录数据
    const applicationRecords = [];

    // 为第一份简历添加投递记录
    if (resumes[0]) {
      const resumeId = resumes[0].id;

      // 已投递状态
      applicationRecords.push({
        id: uuidv4(),
        resume_id: resumeId,
        company_name: '字节跳动',
        position_title: '前端开发工程师',
        apply_date: new Date('2025-09-25'),
        status: '已投递',
        notes: '通过官网投递，岗位编号: FE-2025-001',
        created_at: new Date('2025-09-25'),
        updated_at: new Date('2025-09-25')
      });

      // 面试邀请状态
      applicationRecords.push({
        id: uuidv4(),
        resume_id: resumeId,
        company_name: '阿里巴巴',
        position_title: '高级前端工程师',
        apply_date: new Date('2025-09-20'),
        status: '面试邀请',
        notes: '已安排一面，时间: 2025-10-05 14:00，腾讯会议',
        created_at: new Date('2025-09-20'),
        updated_at: new Date('2025-09-28')
      });

      // 已拒绝状态
      applicationRecords.push({
        id: uuidv4(),
        resume_id: resumeId,
        company_name: '腾讯',
        position_title: 'Web前端开发',
        apply_date: new Date('2025-09-15'),
        status: '已拒绝',
        notes: '未通过简历筛选，原因：工作年限不符合要求',
        created_at: new Date('2025-09-15'),
        updated_at: new Date('2025-09-18')
      });
    }

    // 为第二份简历添加投递记录
    if (resumes[1]) {
      const resumeId = resumes[1].id;

      applicationRecords.push({
        id: uuidv4(),
        resume_id: resumeId,
        company_name: '美团',
        position_title: 'Node.js后端工程师',
        apply_date: new Date('2025-09-22'),
        status: '已投递',
        notes: '内推投递，推荐人: 李四',
        created_at: new Date('2025-09-22'),
        updated_at: new Date('2025-09-22')
      });

      applicationRecords.push({
        id: uuidv4(),
        resume_id: resumeId,
        company_name: '京东',
        position_title: '后端开发专家',
        apply_date: new Date('2025-09-10'),
        status: '已录用',
        notes: '已通过三轮面试，HR已发offer，待入职',
        created_at: new Date('2025-09-10'),
        updated_at: new Date('2025-09-27')
      });
    }

    // 为第三份简历添加投递记录
    if (resumes[2]) {
      const resumeId = resumes[2].id;

      applicationRecords.push({
        id: uuidv4(),
        resume_id: resumeId,
        company_name: '小米科技',
        position_title: '全栈开发工程师',
        apply_date: new Date('2025-09-18'),
        status: '面试邀请',
        notes: '一面已通过，等待二面通知',
        created_at: new Date('2025-09-18'),
        updated_at: new Date('2025-09-26')
      });
    }

    // 插入投递记录数据
    if (applicationRecords.length > 0) {
      await queryInterface.bulkInsert('application_records', applicationRecords, {});
      console.log(`✅ 创建了 ${applicationRecords.length} 个示例投递记录`);
      console.log('📊 投递状态分布:');

      const statusCounts = applicationRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} 条`);
      });
    }
  },

  /**
   * 回滚操作：删除示例投递记录
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

    // 删除投递记录
    await queryInterface.bulkDelete('application_records', {
      resume_id: resumeIds
    }, {});

    console.log('🗑️  示例投递记录已删除');
  }
};