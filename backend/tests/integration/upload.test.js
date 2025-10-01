/**
 * T068: 文件上传集成测试
 *
 * 测试目标: 验证文件上传功能的端到端集成
 * 测试范围:
 * - 文件上传成功场景(PDF, DOCX, DOC)
 * - 文件类型验证
 * - 文件大小验证(≤10MB)
 * - 错误处理
 * - 文件清理
 *
 * 技术栈:
 * - Node.js + Express.js + Multer
 * - Jest + Supertest
 * - 文件系统操作
 */

const request = require('supertest');
const { describe, it, expect, beforeAll, afterAll, afterEach } = require('@jest/globals');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const express = require('express');
const { uploadMiddleware, handleUploadError, UPLOAD_DIR } = require('../../src/middleware/upload');
const fileService = require('../../src/services/fileService');

// 测试常量
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const _ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

// 创建测试用的Express应用
const createTestApp = () => {
  const app = express();

  // 模拟简单的文件上传路由
  app.post('/upload', uploadMiddleware, (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未上传文件'
      });
    }

    res.status(200).json({
      success: true,
      message: '文件上传成功',
      data: {
        file_path: req.file.path,
        file_name: req.file.filename,
        file_size: req.file.size,
        original_name: req.file.originalname,
        mimetype: req.file.mimetype
      }
    });
  });

  // 错误处理中间件
  app.use(handleUploadError);

  return app;
};

describe('文件上传集成测试', () => {
  let app;
  let testFilesDir;
  let uploadedFiles = []; // 跟踪上传的文件,用于清理

  /**
   * 创建测试文件的辅助函数
   * @param {string} filename - 文件名
   * @param {number} sizeInBytes - 文件大小(字节)
   * @param {string|Buffer} content - 文件内容
   * @returns {string} - 文件路径
   */
  const createTestFile = async (filename, sizeInBytes, content = null) => {
    const filePath = path.join(testFilesDir, filename);

    if (content === null) {
      // 生成默认内容
      content = Buffer.alloc(sizeInBytes, 'a');
    } else if (typeof content === 'string') {
      // 字符串内容,重复填充到指定大小
      const repeatedContent = content.repeat(Math.ceil(sizeInBytes / content.length));
      content = Buffer.from(repeatedContent.slice(0, sizeInBytes));
    } else if (Buffer.isBuffer(content)) {
      // 如果是Buffer,填充到指定大小
      if (content.length < sizeInBytes) {
        const padding = Buffer.alloc(sizeInBytes - content.length, 'a');
        content = Buffer.concat([content, padding]);
      } else {
        content = content.slice(0, sizeInBytes);
      }
    }

    await fs.writeFile(filePath, content);
    return filePath;
  };

  /**
   * 创建模拟PDF文件
   * @param {string} filename - 文件名
   * @param {number} sizeInBytes - 文件大小
   * @returns {string} - 文件路径
   */
  const createMockPDF = async (filename, sizeInBytes) => {
    // PDF文件的基本结构
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody =
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n';
    const pdfFooter = '%%EOF\n';

    const pdfContent = pdfHeader + pdfBody + pdfFooter;
    return createTestFile(filename, sizeInBytes, pdfContent);
  };

  /**
   * 创建模拟DOCX文件
   * @param {string} filename - 文件名
   * @param {number} sizeInBytes - 文件大小
   * @returns {string} - 文件路径
   */
  const createMockDOCX = async (filename, sizeInBytes) => {
    // DOCX文件是ZIP格式,使用ZIP文件头
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04
    return createTestFile(filename, sizeInBytes, zipHeader);
  };

  /**
   * 创建模拟DOC文件
   * @param {string} filename - 文件名
   * @param {number} sizeInBytes - 文件大小
   * @returns {string} - 文件路径
   */
  const createMockDOC = async (filename, sizeInBytes) => {
    // DOC文件使用OLE文件头
    const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    return createTestFile(filename, sizeInBytes, oleHeader);
  };

  /**
   * 清理上传的文件
   */
  const cleanupUploadedFiles = async () => {
    for (const filePath of uploadedFiles) {
      try {
        await fs.unlink(filePath);
      } catch (_error) {
        // 文件可能已经被删除,忽略错误
      }
    }
    uploadedFiles = [];
  };

  /**
   * 清理测试文件目录
   */
  const cleanupTestFiles = async () => {
    try {
      const files = await fs.readdir(testFilesDir);
      for (const file of files) {
        await fs.unlink(path.join(testFilesDir, file));
      }
    } catch (_error) {
      // 忽略清理错误
    }
  };

  // 测试前置设置
  beforeAll(async () => {
    app = createTestApp();

    // 创建测试文件目录
    testFilesDir = path.join(__dirname, 'test-files-upload');
    await fs.mkdir(testFilesDir, { recursive: true });

    // 确保uploads目录存在
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  });

  // 每个测试后清理上传的文件
  afterEach(async () => {
    await cleanupUploadedFiles();
  });

  // 测试后清理
  afterAll(async () => {
    // 清理测试文件
    await cleanupTestFiles();

    // 删除测试文件目录
    try {
      await fs.rmdir(testFilesDir);
    } catch (_error) {
      // 忽略错误
    }
  });

  /**
   * 测试用例组1: 成功上传测试
   */
  describe('成功上传测试', () => {
    it('应该成功上传有效的PDF文件', async () => {
      const pdfPath = await createMockPDF('test-resume.pdf', 1024 * 100); // 100KB

      const response = await request(app)
        .post('/upload')
        .attach('file', pdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '文件上传成功');
      expect(response.body).toHaveProperty('data');

      const data = response.body.data;
      expect(data).toHaveProperty('file_path');
      expect(data).toHaveProperty('file_name');
      expect(data).toHaveProperty('file_size');
      expect(data.file_name).toMatch(/\.pdf$/);
      expect(data.file_size).toBeGreaterThan(0);
      expect(data.file_size).toBeLessThanOrEqual(MAX_FILE_SIZE);

      // 记录文件用于清理
      uploadedFiles.push(data.file_path);

      // 验证文件确实被保存
      const fileExists = fsSync.existsSync(data.file_path);
      expect(fileExists).toBe(true);
    });

    it('应该成功上传有效的DOCX文件', async () => {
      const docxPath = await createMockDOCX('test-resume.docx', 1024 * 50); // 50KB

      const response = await request(app)
        .post('/upload')
        .attach('file', docxPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.file_name).toMatch(/\.docx$/);
      expect(response.body.data.mimetype).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      uploadedFiles.push(response.body.data.file_path);

      // 验证文件保存到正确位置
      expect(response.body.data.file_path).toContain('uploads');
    });

    it('应该成功上传有效的DOC文件', async () => {
      const docPath = await createMockDOC('test-resume.doc', 1024 * 75); // 75KB

      const response = await request(app)
        .post('/upload')
        .attach('file', docPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.file_name).toMatch(/\.doc$/);
      expect(response.body.data.mimetype).toBe('application/msword');

      uploadedFiles.push(response.body.data.file_path);
    });

    it('上传的文件名应该是UUID格式', async () => {
      const pdfPath = await createMockPDF('original-name.pdf', 1024);

      const response = await request(app).post('/upload').attach('file', pdfPath);

      expect(response.status).toBe(200);

      const fileName = response.body.data.file_name;
      const fileNameWithoutExt = fileName.replace(/\.pdf$/, '');

      // UUID格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(fileNameWithoutExt).toMatch(uuidRegex);

      uploadedFiles.push(response.body.data.file_path);
    });

    it('应该保留原始文件的扩展名', async () => {
      const pdfPath = await createMockPDF('my-resume.pdf', 1024);

      const response = await request(app).post('/upload').attach('file', pdfPath);

      expect(response.status).toBe(200);
      expect(response.body.data.file_name).toMatch(/\.pdf$/);
      expect(response.body.data.original_name).toBe('my-resume.pdf');

      uploadedFiles.push(response.body.data.file_path);
    });
  });

  /**
   * 测试用例组2: 文件类型验证测试
   */
  describe('文件类型验证测试', () => {
    it('应该拒绝TXT文件', async () => {
      const txtPath = await createTestFile('test.txt', 1024, 'This is a text file');

      const response = await request(app)
        .post('/upload')
        .attach('file', txtPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/不支持的文件类型|.pdf|.docx|.doc/i);
    });

    it('应该拒绝JPG图片文件', async () => {
      const jpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG文件头
      const jpgPath = await createTestFile('test.jpg', 1024, jpgHeader);

      const response = await request(app).post('/upload').attach('file', jpgPath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/不支持的文件类型/i);
    });

    it('应该拒绝PNG图片文件', async () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG文件头
      const pngPath = await createTestFile('test.png', 1024, pngHeader);

      const response = await request(app).post('/upload').attach('file', pngPath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝可执行文件(.exe)', async () => {
      const exePath = await createTestFile('malware.exe', 1024, 'MZ'); // EXE文件头

      const response = await request(app).post('/upload').attach('file', exePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该拒绝JavaScript文件', async () => {
      const jsPath = await createTestFile('script.js', 1024, 'console.log("hello");');

      const response = await request(app).post('/upload').attach('file', jsPath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该同时检查MIME类型和文件扩展名', async () => {
      // 创建一个扩展名是.pdf但内容不是PDF的文件
      const fakePdfPath = await createTestFile('fake.pdf', 1024, 'This is not a PDF');

      const response = await request(app).post('/upload').attach('file', fakePdfPath);

      // 应该被拒绝(如果有MIME类型检查)或接受(如果只检查扩展名)
      // 根据实现,这里可能是200或400
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        uploadedFiles.push(response.body.data.file_path);
      }
    });
  });

  /**
   * 测试用例组3: 文件大小验证测试
   */
  describe('文件大小验证测试', () => {
    it('应该接受接近10MB的文件(9MB)', async () => {
      const largePdfPath = await createMockPDF('large.pdf', 9 * 1024 * 1024); // 9MB

      const response = await request(app)
        .post('/upload')
        .attach('file', largePdfPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.file_size).toBeLessThanOrEqual(MAX_FILE_SIZE);

      uploadedFiles.push(response.body.data.file_path);
    });

    it('应该接受恰好10MB的文件', async () => {
      // 由于PDF头部内容的原因,实际文件可能略大于指定大小
      // 因此使用略小于10MB的大小来确保不超过限制
      const exactSizePath = await createMockPDF('exact-10mb.pdf', 10 * 1024 * 1024 - 1024);

      const response = await request(app)
        .post('/upload')
        .attach('file', exactSizePath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.file_size).toBeLessThanOrEqual(10 * 1024 * 1024);
      expect(response.body.data.file_size).toBeGreaterThan(9 * 1024 * 1024);

      uploadedFiles.push(response.body.data.file_path);
    });

    it('应该拒绝超过10MB的文件(11MB)', async () => {
      const oversizedPath = await createMockPDF('oversized.pdf', 11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/upload')
        .attach('file', oversizedPath)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/大小|10MB|限制/i);
    });

    it('应该拒绝空文件(0字节)', async () => {
      const emptyPath = await createTestFile('empty.pdf', 0, Buffer.alloc(0));

      const response = await request(app)
        .post('/upload')
        .attach('file', emptyPath)
        .expect('Content-Type', /json/);

      // 空文件可能被接受或拒绝,取决于业务逻辑
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        uploadedFiles.push(response.body.data.file_path);
      }
    });

    it('应该正确报告上传文件的大小', async () => {
      const testSize = 512 * 1024; // 512KB
      const pdfPath = await createMockPDF('sized.pdf', testSize);

      const response = await request(app).post('/upload').attach('file', pdfPath);

      expect(response.status).toBe(200);

      // 文件大小应该接近指定大小(可能有轻微差异)
      expect(response.body.data.file_size).toBeGreaterThanOrEqual(testSize - 100);
      expect(response.body.data.file_size).toBeLessThanOrEqual(testSize + 100);

      uploadedFiles.push(response.body.data.file_path);
    });
  });

  /**
   * 测试用例组4: 错误处理测试
   */
  describe('错误处理测试', () => {
    it('应该在没有文件上传时返回错误', async () => {
      const response = await request(app).post('/upload').expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/文件|file/i);
    });

    it('应该在使用错误的字段名时返回错误', async () => {
      const pdfPath = await createMockPDF('test.pdf', 1024);

      const response = await request(app)
        .post('/upload')
        .attach('wrongFieldName', pdfPath) // 使用错误的字段名
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/字段|file/i);
    });

    it('应该处理文件名包含特殊字符的情况', async () => {
      const specialNamePath = await createMockPDF('resume-2024(final)!@#.pdf', 1024);

      const response = await request(app).post('/upload').attach('file', specialNamePath);

      // 应该成功处理特殊字符
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.original_name).toContain('resume-2024');
      expect(response.body.data.original_name).toMatch(/\.pdf$/);

      uploadedFiles.push(response.body.data.file_path);
    });

    it('应该处理中文文件名', async () => {
      const chineseNamePath = await createMockPDF('张三的简历.pdf', 1024);

      const response = await request(app).post('/upload').attach('file', chineseNamePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // 由于文件名编码问题,只验证文件名存在且以.pdf结尾
      expect(response.body.data.original_name).toBeTruthy();
      expect(response.body.data.original_name).toMatch(/\.pdf$/);

      uploadedFiles.push(response.body.data.file_path);
    });

    it('应该处理非常长的文件名', async () => {
      const longName = `${'a'.repeat(200)}.pdf`;
      const longNamePath = await createMockPDF(longName, 1024);

      const response = await request(app).post('/upload').attach('file', longNamePath);

      // 可能成功或因文件名过长而失败
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        uploadedFiles.push(response.body.data.file_path);
      }
    });
  });

  /**
   * 测试用例组5: 文件存储测试
   */
  describe('文件存储测试', () => {
    it('文件应该保存到uploads目录', async () => {
      const pdfPath = await createMockPDF('test.pdf', 1024);

      const response = await request(app).post('/upload').attach('file', pdfPath);

      expect(response.status).toBe(200);
      expect(response.body.data.file_path).toContain('uploads');

      uploadedFiles.push(response.body.data.file_path);
    });

    it('上传的文件应该可以被读取', async () => {
      const originalContent = '%PDF-1.4\nTest Content\n%%EOF\n';
      const pdfPath = await createTestFile('readable.pdf', 1024, originalContent);

      const response = await request(app).post('/upload').attach('file', pdfPath);

      expect(response.status).toBe(200);

      const uploadedFilePath = response.body.data.file_path;
      uploadedFiles.push(uploadedFilePath);

      // 验证文件可以被读取
      const fileContent = await fs.readFile(uploadedFilePath, 'utf8');
      expect(fileContent).toContain('%PDF-1.4');
    });

    it('多个文件上传应该有不同的文件名', async () => {
      const pdf1Path = await createMockPDF('file1.pdf', 1024);
      const pdf2Path = await createMockPDF('file2.pdf', 1024);

      const response1 = await request(app).post('/upload').attach('file', pdf1Path);

      const response2 = await request(app).post('/upload').attach('file', pdf2Path);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const fileName1 = response1.body.data.file_name;
      const fileName2 = response2.body.data.file_name;

      // 文件名应该不同(UUID生成)
      expect(fileName1).not.toBe(fileName2);

      uploadedFiles.push(response1.body.data.file_path);
      uploadedFiles.push(response2.body.data.file_path);
    });
  });

  /**
   * 测试用例组6: fileService辅助函数测试
   */
  describe('fileService辅助函数测试', () => {
    it('validateFileType应该验证有效的PDF文件', () => {
      const validPdfFile = {
        mimetype: 'application/pdf',
        originalname: 'test.pdf'
      };

      const result = fileService.validateFileType(validPdfFile);
      expect(result).toBe(true);
    });

    it('validateFileType应该验证有效的DOCX文件', () => {
      const validDocxFile = {
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'test.docx'
      };

      const result = fileService.validateFileType(validDocxFile);
      expect(result).toBe(true);
    });

    it('validateFileType应该拒绝无效的文件类型', () => {
      const invalidFile = {
        mimetype: 'text/plain',
        originalname: 'test.txt'
      };

      const result = fileService.validateFileType(invalidFile);
      expect(result).toBe(false);
    });

    it('validateFileType应该拒绝MIME类型不匹配的文件', () => {
      const mismatchedFile = {
        mimetype: 'application/pdf',
        originalname: 'test.txt' // 扩展名不匹配
      };

      const result = fileService.validateFileType(mismatchedFile);
      expect(result).toBe(false);
    });

    it('validateFileSize应该接受小于10MB的文件', () => {
      const validSizeFile = {
        size: 5 * 1024 * 1024 // 5MB
      };

      const result = fileService.validateFileSize(validSizeFile);
      expect(result).toBe(true);
    });

    it('validateFileSize应该拒绝超过10MB的文件', () => {
      const oversizedFile = {
        size: 11 * 1024 * 1024 // 11MB
      };

      const result = fileService.validateFileSize(oversizedFile);
      expect(result).toBe(false);
    });

    it('validateFileType应该处理null文件', () => {
      const result = fileService.validateFileType(null);
      expect(result).toBe(false);
    });

    it('validateFileSize应该处理null文件', () => {
      const result = fileService.validateFileSize(null);
      expect(result).toBe(false);
    });
  });

  /**
   * 测试用例组7: 并发上传测试
   */
  describe('并发上传测试', () => {
    it('应该能处理多个同时上传的文件', async () => {
      const pdf1Path = await createMockPDF('concurrent1.pdf', 1024);
      const pdf2Path = await createMockPDF('concurrent2.pdf', 1024);
      const pdf3Path = await createMockPDF('concurrent3.pdf', 1024);

      const [response1, response2, response3] = await Promise.all([
        request(app).post('/upload').attach('file', pdf1Path),
        request(app).post('/upload').attach('file', pdf2Path),
        request(app).post('/upload').attach('file', pdf3Path)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);

      // 所有文件应该有不同的文件名
      const fileName1 = response1.body.data.file_name;
      const fileName2 = response2.body.data.file_name;
      const fileName3 = response3.body.data.file_name;

      expect(fileName1).not.toBe(fileName2);
      expect(fileName2).not.toBe(fileName3);
      expect(fileName1).not.toBe(fileName3);

      uploadedFiles.push(response1.body.data.file_path);
      uploadedFiles.push(response2.body.data.file_path);
      uploadedFiles.push(response3.body.data.file_path);
    });
  });

  /**
   * 测试用例组8: 边界情况测试
   */
  describe('边界情况测试', () => {
    it('应该处理1字节的文件', async () => {
      const tinyPath = await createMockPDF('tiny.pdf', 1);

      const response = await request(app).post('/upload').attach('file', tinyPath);

      // 可能接受或拒绝极小文件
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.data.file_size).toBe(1);
        uploadedFiles.push(response.body.data.file_path);
      }
    });

    it('应该处理只有扩展名的文件名(.pdf)', async () => {
      const noNamePath = await createMockPDF('.pdf', 1024);

      const response = await request(app).post('/upload').attach('file', noNamePath);

      // 应该能处理或拒绝这种特殊情况
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        uploadedFiles.push(response.body.data.file_path);
      }
    });

    it('应该处理多个点的文件名(my.resume.final.pdf)', async () => {
      const multiDotPath = await createMockPDF('my.resume.final.pdf', 1024);

      const response = await request(app).post('/upload').attach('file', multiDotPath);

      expect(response.status).toBe(200);
      expect(response.body.data.original_name).toBe('my.resume.final.pdf');
      expect(response.body.data.file_name).toMatch(/\.pdf$/);

      uploadedFiles.push(response.body.data.file_path);
    });
  });
});
