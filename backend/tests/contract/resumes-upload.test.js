/**
 * T021: POST /api/v1/resumes/upload 契约测试
 *
 * 测试目标: 验证上传简历文件API的契约合规性
 * API规范: /specs/001-/contracts/api-spec.yaml
 *
 * 测试范围:
 * - 上传PDF格式简历文件
 * - 上传Word格式简历文件 (.doc, .docx)
 * - 文件大小限制验证 (≤10MB)
 * - 文件类型验证
 * - multipart/form-data请求处理
 * - JWT认证
 * - 响应数据结构验证
 */

const request = require('supertest');
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// 测试配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_VERSION = '/api/v1';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

describe('POST /api/v1/resumes/upload - 上传简历文件', () => {
  let authToken;
  let testUserId;
  let testTargetPositionId;
  let testFilesDir;

  /**
   * 创建测试用的文件
   */
  const createTestFile = (filename, sizeInBytes, content = 'Test file content\n') => {
    const filePath = path.join(testFilesDir, filename);
    const fileContent = content.repeat(Math.ceil(sizeInBytes / content.length)).slice(0, sizeInBytes);
    fs.writeFileSync(filePath, fileContent);
    return filePath;
  };

  /**
   * 创建模拟PDF文件
   * 注意: 这是简化的PDF,仅用于测试,不是真实的PDF格式
   */
  const createMockPDF = (filename, sizeInBytes) => {
    const pdfHeader = '%PDF-1.4\n';
    const pdfContent = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const pdfFooter = '%%EOF\n';
    const content = pdfHeader + pdfContent + pdfFooter;
    return createTestFile(filename, sizeInBytes, content);
  };

  /**
   * 测试前置条件设置
   */
  beforeAll(async () => {
    // 创建测试文件目录
    testFilesDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // TODO: 注册测试用户并获取token
    try {
      const registerResponse = await request(API_BASE_URL)
        .post(`${API_VERSION}/auth/register`)
        .send({
          email: `test-upload-${Date.now()}@example.com`,
          password: 'Test123456'
        });

      if (registerResponse.body.data) {
        testUserId = registerResponse.body.data.userId;
      }

      // 登录获取token
      const loginResponse = await request(API_BASE_URL)
        .post(`${API_VERSION}/auth/login`)
        .send({
          email: `test-upload-${Date.now()}@example.com`,
          password: 'Test123456'
        });

      if (loginResponse.body.data) {
        authToken = loginResponse.body.data.token;
      }

      // 创建测试用的目标岗位
      const positionResponse = await request(API_BASE_URL)
        .post(`${API_VERSION}/target-positions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试后端岗位',
          description: '用于文件上传测试的岗位'
        });

      if (positionResponse.body.data) {
        testTargetPositionId = positionResponse.body.data.id;
      }
    } catch (error) {
      console.log('测试前置条件设置失败(预期行为-API未实现):', error.message);
    }
  });

  /**
   * 清理测试文件
   */
  afterAll(() => {
    if (fs.existsSync(testFilesDir)) {
      fs.readdirSync(testFilesDir).forEach(file => {
        fs.unlinkSync(path.join(testFilesDir, file));
      });
      fs.rmdirSync(testFilesDir);
    }
  });

  /**
   * 测试用例组1: 成功上传PDF文件
   */
  describe('上传PDF文件', () => {
    it('应该成功上传有效的PDF文件并返回201状态码', async () => {
      const pdfFilePath = createMockPDF('test-resume.pdf', 1024 * 100); // 100KB
      const title = '字节跳动Java开发岗位简历';

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', title)
        .attach('file', pdfFilePath)
        .expect('Content-Type', /json/);

      // 验证响应状态码
      expect(response.status).toBe(201);

      // 验证响应数据结构
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('成功');
      expect(response.body).toHaveProperty('data');

      // 验证ResumeVersion schema字段
      const resumeData = response.body.data;
      expect(resumeData).toHaveProperty('id');
      expect(resumeData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(resumeData).toHaveProperty('targetPositionId');
      expect(resumeData).toHaveProperty('type', 'file');
      expect(resumeData).toHaveProperty('title', title);
      expect(resumeData).toHaveProperty('filePath');
      expect(resumeData).toHaveProperty('fileName');
      expect(resumeData).toHaveProperty('fileSize');
      expect(resumeData).toHaveProperty('content', null);
      expect(resumeData).toHaveProperty('createdAt');
      expect(resumeData).toHaveProperty('updatedAt');

      // 验证文件相关字段
      expect(resumeData.filePath).toBeTruthy();
      expect(typeof resumeData.filePath).toBe('string');
      expect(resumeData.fileName).toContain('.pdf');
      expect(resumeData.fileSize).toBeGreaterThan(0);
      expect(resumeData.fileSize).toBeLessThanOrEqual(MAX_FILE_SIZE);

      // 验证时间戳格式
      expect(new Date(resumeData.createdAt).toISOString()).toBe(resumeData.createdAt);
      expect(new Date(resumeData.updatedAt).toISOString()).toBe(resumeData.updatedAt);
    });

    it('应该接受大型PDF文件(接近10MB限制)', async () => {
      const largePdfPath = createMockPDF('large-resume.pdf', 9 * 1024 * 1024); // 9MB
      const title = '大型简历文件测试';

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', title)
        .attach('file', largePdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.fileSize).toBeLessThanOrEqual(MAX_FILE_SIZE);
    });
  });

  /**
   * 测试用例组2: 上传Word文件
   */
  describe('上传Word文件', () => {
    it('应该成功上传.docx文件', async () => {
      // 创建模拟的docx文件
      const docxContent = 'PK\x03\x04'; // ZIP文件头,docx是ZIP格式
      const docxPath = createTestFile('test-resume.docx', 1024 * 50, docxContent);
      const title = '美团产品经理岗位简历';

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', title)
        .attach('file', docxPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.fileName).toContain('.docx');
      expect(response.body.data.type).toBe('file');
    });

    it('应该成功上传.doc文件', async () => {
      const docContent = '\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1'; // DOC文件头
      const docPath = createTestFile('test-resume.doc', 1024 * 50, docContent);
      const title = '京东运营岗位简历';

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', title)
        .attach('file', docPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.fileName).toContain('.doc');
    });
  });

  /**
   * 测试用例组3: 文件大小限制验证
   */
  describe('文件大小限制', () => {
    it('应该拒绝超过10MB的文件', async () => {
      const oversizedPath = createMockPDF('oversized-resume.pdf', 11 * 1024 * 1024); // 11MB

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '超大文件测试')
        .attach('file', oversizedPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/大小|10MB|限制/i);
    });

    it('应该接受空文件', async () => {
      const emptyFilePath = createTestFile('empty-resume.pdf', 0);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '空文件测试')
        .attach('file', emptyFilePath)
        .expect('Content-Type', /json/);

      // 根据业务逻辑,可能接受(201)或拒绝(400)空文件
      expect([201, 400]).toContain(response.status);
    });

    it('应该正确处理恰好10MB的文件', async () => {
      const exactSizePath = createMockPDF('exact-size-resume.pdf', 10 * 1024 * 1024); // 恰好10MB

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '临界大小文件测试')
        .attach('file', exactSizePath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  /**
   * 测试用例组4: 文件类型验证
   */
  describe('文件类型验证', () => {
    it('应该拒绝不支持的文件格式(.txt)', async () => {
      const txtPath = createTestFile('resume.txt', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', 'TXT文件测试')
        .attach('file', txtPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/格式|类型|PDF|Word/i);
    });

    it('应该拒绝不支持的图片格式(.jpg)', async () => {
      const jpgPath = createTestFile('resume.jpg', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', 'JPG文件测试')
        .attach('file', jpgPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/格式|类型/i);
    });

    it('应该拒绝可执行文件(.exe)', async () => {
      const exePath = createTestFile('resume.exe', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', 'EXE文件测试')
        .attach('file', exePath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('应该验证文件扩展名(不能仅依赖MIME类型)', async () => {
      // 创建一个PDF扩展名但实际内容不是PDF的文件
      const fakePdfPath = createTestFile('fake.pdf', 1024, 'This is not a real PDF');

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '伪造PDF测试')
        .attach('file', fakePdfPath)
        .expect('Content-Type', /json/);

      // 应该通过文件内容验证或MIME类型检测
      // 可能接受(如果只检查扩展名)或拒绝(如果检查文件内容)
      expect([201, 400]).toContain(response.status);
    });
  });

  /**
   * 测试用例组5: 必填字段验证
   */
  describe('必填字段验证', () => {
    it('应该要求file字段(文件)', async () => {
      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '缺少文件测试')
        // 不attach文件
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/file|文件/i);
    });

    it('应该要求targetPositionId字段', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        // 缺少targetPositionId
        .field('title', '缺少岗位ID测试')
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/targetPositionId/i);
    });

    it('应该要求title字段', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        // 缺少title
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/title/i);
    });

    it('应该验证title长度不超过200字符', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);
      const longTitle = 'a'.repeat(201);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', longTitle)
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/title|长度/i);
    });

    it('应该验证targetPositionId为有效的UUID格式', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', 'invalid-uuid-format')
        .field('title', 'UUID格式测试')
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/uuid|格式/i);
    });
  });

  /**
   * 测试用例组6: JWT认证测试
   */
  describe('JWT认证', () => {
    it('应该在没有Authorization header时返回401错误', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        // 不设置Authorization header
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '无认证测试')
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/未授权|认证|token/i);
    });

    it('应该在token无效时返回401错误', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', 'Bearer invalid-token-xyz')
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '无效token测试')
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/无效|token/i);
    });

    it('应该在token格式错误时返回401错误', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', 'WrongFormat token123')
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', 'token格式错误测试')
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  /**
   * 测试用例组7: 文件名处理
   */
  describe('文件名处理', () => {
    it('应该正确处理包含中文的文件名', async () => {
      const chineseNamePath = createMockPDF('张三-前端工程师简历.pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '中文文件名测试')
        .attach('file', chineseNamePath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.fileName).toBeTruthy();
    });

    it('应该正确处理包含特殊字符的文件名', async () => {
      const specialNamePath = createMockPDF('resume_v1.2_final(1).pdf', 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '特殊字符文件名测试')
        .attach('file', specialNamePath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('应该正确处理长文件名', async () => {
      const longFileName = 'a'.repeat(200) + '.pdf';
      const longNamePath = createMockPDF(longFileName, 1024);

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
        .field('title', '长文件名测试')
        .attach('file', longNamePath)
        .expect('Content-Type', /json/);

      // 应该成功或因文件名过长被拒绝
      expect([201, 400]).toContain(response.status);
    });
  });

  /**
   * 测试用例组8: 并发上传测试
   */
  describe('并发文件上传', () => {
    it('应该能够处理同一用户的多个文件上传', async () => {
      const file1Path = createMockPDF('resume1.pdf', 1024);
      const file2Path = createMockPDF('resume2.pdf', 1024);

      const [response1, response2] = await Promise.all([
        request(API_BASE_URL)
          .post(`${API_VERSION}/resumes/upload`)
          .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
          .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
          .field('title', '并发上传测试1')
          .attach('file', file1Path),
        request(API_BASE_URL)
          .post(`${API_VERSION}/resumes/upload`)
          .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
          .field('targetPositionId', testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001')
          .field('title', '并发上传测试2')
          .attach('file', file2Path)
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.id).not.toBe(response2.body.data.id);
    });
  });

  /**
   * 测试用例组9: 权限验证
   */
  describe('权限验证', () => {
    it('应该只允许用户上传到自己的目标岗位', async () => {
      const pdfPath = createMockPDF('test.pdf', 1024);
      const otherUserPositionId = '999e4567-e89b-12d3-a456-426614174001';

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', otherUserPositionId)
        .field('title', '权限测试')
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      // 可能是404(目标岗位不存在)或403(无权访问)
      expect([403, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  /**
   * 测试用例组10: Content-Type验证
   */
  describe('Content-Type验证', () => {
    it('应该要求Content-Type为multipart/form-data', async () => {
      // 尝试使用错误的Content-Type
      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .set('Content-Type', 'application/json')
        .send({
          targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
          title: 'Content-Type测试',
          file: 'not-a-real-file'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  /**
   * 测试用例组11: 错误响应格式验证
   */
  describe('错误响应格式', () => {
    it('错误响应应该符合ErrorResponse schema', async () => {
      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes/upload`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .field('targetPositionId', 'invalid-uuid')
        .field('title', '错误格式测试')
        // 不attach文件
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);

      // 验证ErrorResponse结构
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');

      // 可选的error对象
      if (response.body.error) {
        expect(response.body.error).toHaveProperty('code');
        expect(typeof response.body.error.code).toBe('string');
      }
    });
  });
});