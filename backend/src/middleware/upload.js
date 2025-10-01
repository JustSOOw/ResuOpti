/**
 * 文件上传中间件
 * 使用Multer处理简历文件上传，支持.pdf, .docx, .doc格式
 *
 * 功能:
 * - 文件大小限制：≤10MB
 * - 文件类型限制：.pdf, .docx, .doc
 * - 文件命名：UUID + 原始扩展名
 * - 存储位置：backend/uploads/
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// 配置常量
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB = 10,485,760 字节
const ALLOWED_MIME_TYPES = [
  'application/pdf', // .pdf
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword' // .doc
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

/**
 * 确保上传目录存在
 */
const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

// 初始化时创建目录
ensureUploadDir();

/**
 * Multer存储配置
 * 使用diskStorage将文件保存到本地文件系统
 */
const storage = multer.diskStorage({
  /**
   * 指定文件存储目录
   * @param {Object} req - Express请求对象
   * @param {Object} file - 上传的文件对象
   * @param {Function} cb - 回调函数 cb(error, destination)
   */
  destination: function (req, file, cb) {
    ensureUploadDir(); // 确保目录存在
    cb(null, UPLOAD_DIR);
  },

  /**
   * 指定文件名称
   * 格式：UUID + 原始文件扩展名
   * @param {Object} req - Express请求对象
   * @param {Object} file - 上传的文件对象
   * @param {Function} cb - 回调函数 cb(error, filename)
   */
  filename: function (req, file, cb) {
    // 获取原始文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();

    // 生成唯一文件名：UUID + 扩展名
    const uniqueFilename = `${uuidv4()}${ext}`;

    cb(null, uniqueFilename);
  }
});

/**
 * 文件过滤器
 * 验证上传文件的类型和扩展名
 * @param {Object} req - Express请求对象
 * @param {Object} file - 上传的文件对象
 * @param {Function} cb - 回调函数 cb(error, acceptFile)
 */
const fileFilter = function (req, file, cb) {
  // 获取文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();

  // 验证MIME类型
  const isValidMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);

  // 验证文件扩展名
  const isValidExtension = ALLOWED_EXTENSIONS.includes(ext);

  if (isValidMimeType && isValidExtension) {
    // 文件类型有效，接受上传
    cb(null, true);
  } else {
    // 文件类型无效，拒绝上传
    cb(new Error(`不支持的文件类型。仅支持 ${ALLOWED_EXTENSIONS.join(', ')} 格式`), false);
  }
};

/**
 * Multer配置实例
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE // 限制文件大小为10MB
  }
});

/**
 * 上传中间件
 * 处理单个文件上传，字段名为'file'
 */
const uploadMiddleware = upload.single('file');

/**
 * 错误处理中间件
 * 专门处理Multer上传错误
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
const handleUploadError = (err, req, res, next) => {
  // 如果不是错误，继续下一个中间件
  if (!err) {
    return next();
  }

  // 处理Multer特定错误
  if (err instanceof multer.MulterError) {
    // 文件大小超限
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `文件大小超过限制，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }

    // 文件数量超限
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '上传文件数量超过限制'
      });
    }

    // 意外的字段名
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '上传字段名错误，请使用"file"字段上传文件'
      });
    }

    // 其他Multer错误
    return res.status(400).json({
      success: false,
      message: `文件上传错误: ${err.message}`
    });
  }

  // 处理自定义文件类型错误（从fileFilter抛出）
  if (err.message && err.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // 处理其他未知错误
  console.error('文件上传错误:', err);
  return res.status(500).json({
    success: false,
    message: '文件上传失败，请稍后重试',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// 导出中间件和配置常量
module.exports = {
  uploadMiddleware,
  handleUploadError,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES
};
