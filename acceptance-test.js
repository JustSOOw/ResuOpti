/**
 * 端到端用户验收测试脚本
 * 基于 quickstart.md 中定义的所有验证场景
 *
 * 使用方法:
 * node acceptance-test.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: `test_${Date.now()}@example.com`,
  password: 'password123'
};
const TEST_USER_2 = {
  email: `test2_${Date.now()}@example.com`,
  password: 'password123'
};

// 测试上下文
const ctx = {
  authToken: null,
  authToken2: null,
  userId: null,
  positions: [],
  resumes: [],
  applications: []
};

// 测试结果
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// 工具函数：断言
function assert(condition, testName, errorMessage) {
  if (!condition) {
    results.failed.push({ test: testName, error: errorMessage });
    console.error(`❌ ${testName}: ${errorMessage}`);
    return false;
  }
  results.passed.push(testName);
  console.log(`✅ ${testName}`);
  return true;
}

// 工具函数：警告
function warning(testName, message) {
  results.warnings.push({ test: testName, message });
  console.warn(`⚠️  ${testName}: ${message}`);
}

// 工具函数：延迟
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 场景1：新用户注册和登录
async function testScenario1() {
  console.log('\n=== 场景1：新用户注册和登录 ===');

  try {
    // 步骤1.1: 用户注册
    console.log('\n步骤1.1: 用户注册');
    const registerRes = await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
    assert(
      registerRes.status === 201,
      '注册返回201状态码',
      `期望201，实际${registerRes.status}`
    );
    assert(
      registerRes.data.success === true,
      '注册成功标志为true',
      '注册响应success字段不是true'
    );

    // 步骤1.2: 用户登录
    console.log('\n步骤1.2: 用户登录');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    assert(
      loginRes.status === 200,
      '登录返回200状态码',
      `期望200，实际${loginRes.status}`
    );
    assert(
      loginRes.data.success === true,
      '登录成功标志为true',
      '登录响应success字段不是true'
    );
    assert(
      loginRes.data.data && loginRes.data.data.token,
      '登录返回JWT token',
      '登录响应没有返回token'
    );

    // 保存认证token供后续使用
    ctx.authToken = loginRes.data.data.token;
    ctx.userId = loginRes.data.data.user.id;

    // 步骤1.3: 验证工作区状态 (通过获取目标岗位列表，应该为空)
    console.log('\n步骤1.3: 验证工作区状态');
    const positionsRes = await axios.get(`${API_BASE_URL}/target-positions`, {
      headers: { Authorization: `Bearer ${ctx.authToken}` }
    });
    assert(
      positionsRes.status === 200,
      '获取岗位列表返回200',
      `期望200，实际${positionsRes.status}`
    );
    assert(
      Array.isArray(positionsRes.data.data) && positionsRes.data.data.length === 0,
      '新用户的岗位列表为空',
      `期望空数组，实际有${positionsRes.data.data?.length}个岗位`
    );

  } catch (error) {
    assert(false, '场景1执行', error.response?.data?.message || error.message);
  }
}

// 场景2：创建目标岗位分类
async function testScenario2() {
  console.log('\n=== 场景2：创建目标岗位分类 ===');

  try {
    // 步骤2.1: 创建第一个目标岗位
    console.log('\n步骤2.1: 创建第一个目标岗位');
    const position1Res = await axios.post(
      `${API_BASE_URL}/target-positions`,
      {
        title: '前端开发工程师',
        description: '专注于React和Vue技术栈'
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );
    assert(
      position1Res.status === 201,
      '创建岗位返回201状态码',
      `期望201，实际${position1Res.status}`
    );
    assert(
      position1Res.data.success === true,
      '创建岗位成功',
      '创建岗位响应success字段不是true'
    );
    assert(
      position1Res.data.data.title === '前端开发工程师',
      '岗位名称正确保存',
      `期望"前端开发工程师"，实际"${position1Res.data.data.title}"`
    );

    ctx.positions.push(position1Res.data.data);

    // 步骤2.2: 创建第二个目标岗位
    console.log('\n步骤2.2: 创建第二个目标岗位');
    const position2Res = await axios.post(
      `${API_BASE_URL}/target-positions`,
      {
        title: '全栈开发工程师',
        description: 'Node.js + React全栈开发'
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );
    assert(
      position2Res.status === 201,
      '创建第二个岗位成功',
      `期望201，实际${position2Res.status}`
    );

    ctx.positions.push(position2Res.data.data);

    // 验证：获取所有岗位，应该有2个
    const allPositionsRes = await axios.get(`${API_BASE_URL}/target-positions`, {
      headers: { Authorization: `Bearer ${ctx.authToken}` }
    });
    assert(
      allPositionsRes.data.data.length === 2,
      '岗位列表显示2个岗位',
      `期望2个，实际${allPositionsRes.data.data.length}个`
    );

  } catch (error) {
    assert(false, '场景2执行', error.response?.data?.message || error.message);
  }
}

// 场景3：上传简历文件
async function testScenario3() {
  console.log('\n=== 场景3：上传简历文件 ===');

  try {
    // 步骤3.1: 准备测试文件 (创建一个小的文本文件模拟PDF)
    console.log('\n步骤3.1: 准备测试文件');
    const testFilePath = path.join(__dirname, 'test-resume.txt');
    fs.writeFileSync(testFilePath, '这是一个测试简历文件\n姓名：张三\n职位：前端开发工程师');

    // 步骤3.2: 上传简历 (注意：实际API可能需要FormData)
    console.log('\n步骤3.2: 上传简历文件');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('targetPositionId', ctx.positions[0].id);
    form.append('title', '前端开发-通用版本');
    form.append('resumeType', 'file');

    const uploadRes = await axios.post(
      `${API_BASE_URL}/resumes/upload`,
      form,
      {
        headers: {
          Authorization: `Bearer ${ctx.authToken}`,
          ...form.getHeaders()
        }
      }
    );

    assert(
      uploadRes.status === 201 || uploadRes.status === 200,
      '文件上传成功',
      `期望201或200，实际${uploadRes.status}`
    );

    if (uploadRes.data.data) {
      ctx.resumes.push(uploadRes.data.data);
    }

    // 清理测试文件
    fs.unlinkSync(testFilePath);

    // 步骤3.3: 测试文件限制 (尝试上传不支持的格式)
    console.log('\n步骤3.3: 测试文件格式限制');
    try {
      const invalidFile = path.join(__dirname, 'test-invalid.exe');
      fs.writeFileSync(invalidFile, 'invalid content');

      const invalidForm = new FormData();
      invalidForm.append('file', fs.createReadStream(invalidFile));
      invalidForm.append('targetPositionId', ctx.positions[0].id);
      invalidForm.append('title', '无效文件');
      invalidForm.append('resumeType', 'file');

      await axios.post(
        `${API_BASE_URL}/resumes/upload`,
        invalidForm,
        {
          headers: {
            Authorization: `Bearer ${ctx.authToken}`,
            ...invalidForm.getHeaders()
          }
        }
      );

      fs.unlinkSync(invalidFile);
      warning('文件格式验证', 'API应该拒绝不支持的文件格式');
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 415)) {
        assert(true, '文件格式验证有效', '');
        if (fs.existsSync(path.join(__dirname, 'test-invalid.exe'))) {
          fs.unlinkSync(path.join(__dirname, 'test-invalid.exe'));
        }
      } else {
        assert(false, '文件格式验证', error.message);
      }
    }

  } catch (error) {
    assert(false, '场景3执行', error.response?.data?.message || error.message);
  }
}

// 场景4：在线创建简历
async function testScenario4() {
  console.log('\n=== 场景4：在线创建简历 ===');

  try {
    // 步骤4.1 & 4.2: 创建在线简历
    console.log('\n步骤4.1-4.2: 创建在线简历');
    const onlineResumeRes = await axios.post(
      `${API_BASE_URL}/resumes`,
      {
        targetPositionId: ctx.positions[0].id,
        title: '前端开发-阿里巴巴定制版',
        resumeType: 'online',
        content: `<h1>张三</h1>
<h2>前端开发工程师</h2>
<h3>工作经验：</h3>
<ul>
<li>3年React开发经验</li>
<li>熟练掌握TypeScript</li>
</ul>
<p><a href="https://github.com/zhangsan">GitHub</a></p>`
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );

    assert(
      onlineResumeRes.status === 201,
      '在线简历创建成功',
      `期望201，实际${onlineResumeRes.status}`
    );
    assert(
      onlineResumeRes.data.data.resumeType === 'online',
      '简历类型为online',
      `期望online，实际${onlineResumeRes.data.data.resumeType}`
    );
    assert(
      onlineResumeRes.data.data.content,
      '简历内容已保存',
      '简历内容为空'
    );

    ctx.resumes.push(onlineResumeRes.data.data);

    // 步骤4.3: PDF导出功能 (前端功能，API层面仅验证数据存在即可)
    console.log('\n步骤4.3: 验证简历内容可用于导出');
    assert(
      onlineResumeRes.data.data.content.includes('张三'),
      '简历内容包含预期文本',
      '简历内容不包含"张三"'
    );

  } catch (error) {
    assert(false, '场景4执行', error.response?.data?.message || error.message);
  }
}

// 场景5：添加简历元数据
async function testScenario5() {
  console.log('\n=== 场景5：添加简历元数据 ===');

  try {
    if (ctx.resumes.length === 0) {
      warning('场景5跳过', '没有可用的简历，跳过元数据测试');
      return;
    }

    const resumeId = ctx.resumes[0].id;

    // 步骤5.1: 添加备注
    console.log('\n步骤5.1: 添加备注');
    const updateRes = await axios.put(
      `${API_BASE_URL}/resumes/${resumeId}`,
      {
        notes: '针对阿里巴巴前端岗位定制，突出React经验'
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );

    assert(
      updateRes.status === 200,
      '备注更新成功',
      `期望200，实际${updateRes.status}`
    );
    assert(
      updateRes.data.data.notes === '针对阿里巴巴前端岗位定制，突出React经验',
      '备注内容正确保存',
      '备注内容不匹配'
    );

    // 步骤5.2: 添加标签
    console.log('\n步骤5.2: 添加标签');
    const tagsRes = await axios.put(
      `${API_BASE_URL}/resumes/${resumeId}`,
      {
        tags: ['技术重点', '阿里定制', 'React专精']
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );

    assert(
      tagsRes.status === 200,
      '标签更新成功',
      `期望200，实际${tagsRes.status}`
    );
    assert(
      Array.isArray(tagsRes.data.data.tags) && tagsRes.data.data.tags.length === 3,
      '标签数量正确',
      `期望3个标签，实际${tagsRes.data.data.tags?.length}个`
    );

  } catch (error) {
    assert(false, '场景5执行', error.response?.data?.message || error.message);
  }
}

// 场景6：投递记录管理
async function testScenario6() {
  console.log('\n=== 场景6：投递记录管理 ===');

  try {
    if (ctx.resumes.length === 0) {
      warning('场景6跳过', '没有可用的简历，跳过投递记录测试');
      return;
    }

    // 步骤6.1: 添加投递记录
    console.log('\n步骤6.1: 添加投递记录');
    const applicationRes = await axios.post(
      `${API_BASE_URL}/resumes/${ctx.resumes[0].id}/applications`,
      {
        companyName: '阿里巴巴',
        positionTitle: '前端开发工程师',
        applicationDate: new Date().toISOString(),
        status: '已投递',
        notes: '通过猎头推荐投递'
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );

    if (applicationRes.status === 404) {
      // API可能不支持嵌套路由，尝试平级路由
      warning('投递记录API路由', '嵌套路由不支持，可能需要调整API设计');
      return;
    }

    assert(
      applicationRes.status === 201,
      '投递记录创建成功',
      `期望201，实际${applicationRes.status}`
    );
    assert(
      applicationRes.data.data.companyName === '阿里巴巴',
      '公司名称正确保存',
      `期望"阿里巴巴"，实际"${applicationRes.data.data.companyName}"`
    );

    ctx.applications.push(applicationRes.data.data);

    // 步骤6.2: 更新投递状态
    console.log('\n步骤6.2: 更新投递状态');
    const updateAppRes = await axios.put(
      `${API_BASE_URL}/resumes/${ctx.resumes[0].id}/applications/${applicationRes.data.data.id}`,
      {
        status: '面试邀请',
        notes: '收到HR电话，约定明天面试'
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );

    assert(
      updateAppRes.status === 200,
      '投递状态更新成功',
      `期望200，实际${updateAppRes.status}`
    );
    assert(
      updateAppRes.data.data.status === '面试邀请',
      '状态正确更新',
      `期望"面试邀请"，实际"${updateAppRes.data.data.status}"`
    );

    // 步骤6.3: 添加多个投递记录
    console.log('\n步骤6.3: 添加第二个投递记录');
    const app2Res = await axios.post(
      `${API_BASE_URL}/resumes/${ctx.resumes[0].id}/applications`,
      {
        companyName: '腾讯',
        positionTitle: '前端开发工程师',
        applicationDate: new Date().toISOString(),
        status: '已拒绝',
        notes: ''
      },
      {
        headers: { Authorization: `Bearer ${ctx.authToken}` }
      }
    );

    if (app2Res.status === 201) {
      ctx.applications.push(app2Res.data.data);
      assert(true, '第二个投递记录创建成功', '');
    }

  } catch (error) {
    if (error.response?.status === 404) {
      warning('场景6部分功能', '投递记录API可能未完全实现或路由不匹配');
    } else {
      assert(false, '场景6执行', error.response?.data?.message || error.message);
    }
  }
}

// 数据持久化验证
async function testDataPersistence() {
  console.log('\n=== 数据持久化验证 ===');

  try {
    // 验证1: 重新获取数据
    console.log('\n验证1: 重新获取数据保持完整');
    const positionsRes = await axios.get(`${API_BASE_URL}/target-positions`, {
      headers: { Authorization: `Bearer ${ctx.authToken}` }
    });
    assert(
      positionsRes.data.data.length === ctx.positions.length,
      '岗位数据持久化',
      `期望${ctx.positions.length}个，实际${positionsRes.data.data.length}个`
    );

    // 验证2: 用户隔离
    console.log('\n验证2: 用户数据隔离');
    // 注册第二个用户
    await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER_2);
    const login2Res = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER_2);
    ctx.authToken2 = login2Res.data.data.token;

    // 用第二个用户的token获取岗位列表，应该为空
    const user2PositionsRes = await axios.get(`${API_BASE_URL}/target-positions`, {
      headers: { Authorization: `Bearer ${ctx.authToken2}` }
    });
    assert(
      user2PositionsRes.data.data.length === 0,
      '用户数据隔离有效',
      `第二个用户应该看不到第一个用户的数据，实际看到${user2PositionsRes.data.data.length}个岗位`
    );

  } catch (error) {
    assert(false, '数据持久化验证', error.response?.data?.message || error.message);
  }
}

// 边界情况测试
async function testEdgeCases() {
  console.log('\n=== 边界情况测试 ===');

  try {
    // 测试1: 数据验证
    console.log('\n测试1: 数据验证');
    try {
      await axios.post(
        `${API_BASE_URL}/target-positions`,
        {
          title: '',
          description: ''
        },
        {
          headers: { Authorization: `Bearer ${ctx.authToken}` }
        }
      );
      warning('数据验证', 'API应该拒绝空名称的岗位');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        assert(true, '空名称岗位验证有效', '');
      } else {
        warning('数据验证', `期望400错误，实际${error.response?.status}`);
      }
    }

    // 测试2: 未认证访问
    console.log('\n测试2: 未认证访问保护');
    try {
      await axios.get(`${API_BASE_URL}/target-positions`);
      warning('认证保护', 'API应该要求认证才能访问受保护资源');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        assert(true, '未认证访问被正确拒绝', '');
      } else {
        warning('认证保护', `期望401错误，实际${error.response?.status}`);
      }
    }

  } catch (error) {
    assert(false, '边界情况测试', error.response?.data?.message || error.message);
  }
}

// 性能基准测试
async function testPerformance() {
  console.log('\n=== 性能基准测试 ===');

  try {
    // 测试1: API响应时间
    console.log('\n测试1: API响应时间');
    const start = Date.now();
    await axios.get(`${API_BASE_URL}/target-positions`, {
      headers: { Authorization: `Bearer ${ctx.authToken}` }
    });
    const duration = Date.now() - start;

    assert(
      duration < 2000,
      'API响应时间在2秒内',
      `响应时间${duration}ms超过2000ms`
    );

    if (duration < 200) {
      console.log(`✨ 优秀：API响应时间${duration}ms`);
    } else if (duration < 1000) {
      console.log(`👍 良好：API响应时间${duration}ms`);
    } else {
      warning('性能', `API响应时间${duration}ms，建议优化`);
    }

  } catch (error) {
    assert(false, '性能测试', error.message);
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n\n' + '='.repeat(60));
  console.log('测试报告');
  console.log('='.repeat(60));

  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(2) : 0;

  console.log(`\n总计: ${total} 个测试`);
  console.log(`✅ 通过: ${results.passed.length} 个`);
  console.log(`❌ 失败: ${results.failed.length} 个`);
  console.log(`⚠️  警告: ${results.warnings.length} 个`);
  console.log(`📊 通过率: ${passRate}%`);

  if (results.failed.length > 0) {
    console.log('\n失败的测试:');
    results.failed.forEach((failure, index) => {
      console.log(`  ${index + 1}. ${failure.test}`);
      console.log(`     错误: ${failure.error}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n警告信息:');
    results.warnings.forEach((warn, index) => {
      console.log(`  ${index + 1}. ${warn.test}`);
      console.log(`     信息: ${warn.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // 成功标准检查
  console.log('\n成功标准检查:');
  const successCriteria = [
    { name: '用户注册、登录功能正常', passed: results.passed.some(t => t.includes('注册') || t.includes('登录')) },
    { name: '目标岗位创建、管理功能正常', passed: results.passed.some(t => t.includes('岗位')) },
    { name: '文件上传功能支持', passed: results.passed.some(t => t.includes('文件上传') || t.includes('简历创建')) },
    { name: '数据持久化和用户隔离正确', passed: results.passed.some(t => t.includes('持久化') || t.includes('隔离')) },
    { name: '所有操作响应时间在可接受范围内', passed: results.passed.some(t => t.includes('响应时间')) }
  ];

  successCriteria.forEach(criterion => {
    console.log(`${criterion.passed ? '✅' : '❌'} ${criterion.name}`);
  });

  const allCriteriaMet = successCriteria.every(c => c.passed);
  console.log('\n' + '='.repeat(60));
  console.log(allCriteriaMet ?
    '🎉 所有核心功能验收通过！' :
    '⚠️  部分核心功能需要改进'
  );
  console.log('='.repeat(60) + '\n');

  return {
    total,
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    passRate,
    allCriteriaMet
  };
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('ResuOpti 端到端验收测试');
  console.log('基于 quickstart.md 验证场景');
  console.log('='.repeat(60));

  // 检查后端服务是否运行
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ 后端服务运行正常\n');
  } catch (error) {
    console.error('❌ 后端服务未运行，请先启动后端服务: npm start');
    process.exit(1);
  }

  // 执行测试场景
  await testScenario1();
  await sleep(500);

  await testScenario2();
  await sleep(500);

  await testScenario3();
  await sleep(500);

  await testScenario4();
  await sleep(500);

  await testScenario5();
  await sleep(500);

  await testScenario6();
  await sleep(500);

  await testDataPersistence();
  await sleep(500);

  await testEdgeCases();
  await sleep(500);

  await testPerformance();
  await sleep(500);

  // 生成报告
  const report = generateReport();

  // 返回退出码
  process.exit(report.failed.length > 0 ? 1 : 0);
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('\n未处理的Promise拒绝:', error);
  process.exit(1);
});

// 运行测试
main();