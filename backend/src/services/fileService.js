/**
 * 文件上传处理服务
 * 负责处理简历文件的上传、验证、存储和删除
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// 常量定义
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];
const UPLOAD_BASE_DIR = path.join(__dirname, '../../uploads');

/**
 * 验证文件类型
 * @param {Object} file - Multer文件对象
 * @returns {boolean} - 文件类型是否有效
 */
const validateFileType = (file) => {
  if (!file) {
    return false;
  }

  // 检查MIME类型
  const mimeTypeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);

  // 检查文件扩展名
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const extensionValid = ALLOWED_EXTENSIONS.includes(fileExtension);

  return mimeTypeValid && extensionValid;
};

/**
 * 验证文件大小
 * @param {Object} file - Multer文件对象
 * @returns {boolean} - 文件大小是否有效
 */
const validateFileSize = (file) => {
  if (!file) {
    return false;
  }

  return file.size <= MAX_FILE_SIZE;
};

/**
 * 生成文件存储路径
 * @param {number} userId - 用户ID
 * @param {number} targetPositionId - 目标职位ID
 * @param {string} filename - 文件名
 * @returns {Promise<string>} - 完整的文件存储路径
 */
const generateFilePath = async (userId, targetPositionId, filename) => {
  try {
    // 构建目录路径：uploads/{userId}/{targetPositionId}/
    const dirPath = path.join(UPLOAD_BASE_DIR, String(userId), String(targetPositionId));

    // 确保目录存在，不存在则递归创建
    await fs.mkdir(dirPath, { recursive: true });

    // 返回完整的文件路径
    const filePath = path.join(dirPath, filename);
    return filePath;
  } catch (error) {
    throw new Error(`创建文件存储目录失败: ${error.message}`);
  }
};

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 删除是否成功
 */
const deleteFile = async (filePath) => {
  try {
    // 检查文件是否存在
    await fs.access(filePath);

    // 删除文件
    await fs.unlink(filePath);

    console.log(`文件已删除: ${filePath}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 文件不存在，视为删除成功
      console.log(`文件不存在，跳过删除: ${filePath}`);
      return true;
    }

    // 其他错误
    throw new Error(`删除文件失败: ${error.message}`);
  }
};

/**
 * 获取Multer配置
 * @param {number} userId - 用户ID
 * @param {number|string} [targetPositionId] - 可选的目标职位ID
 * @returns {Object} - 配置好的multer实例
 */
const getMulterConfig = (userId, targetPositionId) => {
  // 配置存储引擎
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const effectiveTargetId =
          targetPositionId ||
          req.body?.targetPositionId ||
          req.body?.target_position_id ||
          req.query?.targetPositionId;

        const dirName = effectiveTargetId ? String(effectiveTargetId) : 'tmp';

        // 构建目录路径
        const dirPath = path.join(UPLOAD_BASE_DIR, String(userId), dirName);

        // 确保目录存在
        await fs.mkdir(dirPath, { recursive: true });

        cb(null, dirPath);
      } catch (error) {
        cb(new Error(`创建上传目录失败: ${error.message}`));
      }
    },
    filename: (req, file, cb) => {
      try {
        // 获取原始文件扩展名
        const fileExtension = path.extname(file.originalname);

        // 生成唯一文件名：UUID + 原始扩展名
        const uniqueFilename = `${uuidv4()}${fileExtension}`;

        cb(null, uniqueFilename);
      } catch (error) {
        cb(new Error(`生成文件名失败: ${error.message}`));
      }
    }
  });

  // 文件过滤器
  const fileFilter = (req, file, cb) => {
    if (!validateFileType(file)) {
      const error = new Error(`不支持的文件类型。仅允许: ${ALLOWED_EXTENSIONS.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    cb(null, true);
  };

  // 创建并返回multer实例
  return multer({
    storage: storage,
    limits: {
      fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
  });
};

/**
 * 清理用户的所有上传文件（可选功能，用于用户删除账户时）
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>} - 清理是否成功
 */
const cleanupUserFiles = async (userId) => {
  try {
    const userDirPath = path.join(UPLOAD_BASE_DIR, String(userId));

    // 检查目录是否存在
    try {
      await fs.access(userDirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 目录不存在，无需清理
        console.log(`用户目录不存在，无需清理: ${userDirPath}`);
        return true;
      }
      throw error;
    }

    // 递归删除目录及其内容
    await fs.rm(userDirPath, { recursive: true, force: true });

    console.log(`已清理用户文件: ${userDirPath}`);
    return true;
  } catch (error) {
    throw new Error(`清理用户文件失败: ${error.message}`);
  }
};

/**
 * 清理指定职位的所有上传文件（可选功能，用于删除目标职位时）
 * @param {number} userId - 用户ID
 * @param {number} targetPositionId - 目标职位ID
 * @returns {Promise<boolean>} - 清理是否成功
 */
const cleanupPositionFiles = async (userId, targetPositionId) => {
  try {
    const positionDirPath = path.join(UPLOAD_BASE_DIR, String(userId), String(targetPositionId));

    // 检查目录是否存在
    try {
      await fs.access(positionDirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 目录不存在，无需清理
        console.log(`职位目录不存在，无需清理: ${positionDirPath}`);
        return true;
      }
      throw error;
    }

    // 递归删除目录及其内容
    await fs.rm(positionDirPath, { recursive: true, force: true });

    console.log(`已清理职位文件: ${positionDirPath}`);
    return true;
  } catch (error) {
    throw new Error(`清理职位文件失败: ${error.message}`);
  }
};

// 导出服务函数
module.exports = {
  validateFileType,
  validateFileSize,
  generateFilePath,
  deleteFile,
  getMulterConfig,
  cleanupUserFiles,
  cleanupPositionFiles,
  // 导出常量供其他模块使用
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  UPLOAD_BASE_DIR
};
