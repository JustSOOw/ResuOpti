/**
 * 日志工具模块
 * 提供统一的日志记录接口，支持Winston或Console fallback
 *
 * 功能特性：
 * - 多级别日志（error, warn, info, debug）
 * - 开发/生产环境差异化配置
 * - 控制台和文件输出
 * - Express中间件集成
 * - 自动格式化（时间戳、级别、元数据）
 */

const fs = require('fs');
const path = require('path');

// 尝试加载winston，如果不存在则使用fallback
let winston;
let useWinston = false;

try {
  winston = require('winston');
  useWinston = true;
} catch (_error) {
  console.warn('⚠️  Winston未安装，使用Console fallback。建议安装：npm install winston');
}

// 日志级别定义
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// ANSI颜色代码（用于console输出）
const COLORS = {
  error: '\x1b[31m', // 红色
  warn: '\x1b[33m', // 黄色
  info: '\x1b[36m', // 青色
  debug: '\x1b[35m', // 紫色
  reset: '\x1b[0m'
};

/**
 * 获取当前时间戳字符串
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * 格式化日志消息（用于console fallback）
 */
function formatConsoleMessage(level, message, meta = {}) {
  const timestamp = getTimestamp();
  const color = COLORS[level] || COLORS.reset;
  const levelUpper = level.toUpperCase().padEnd(5);

  let logMessage = `${color}[${timestamp}] ${levelUpper}${COLORS.reset} ${message}`;

  // 如果有元数据，添加到消息中
  if (Object.keys(meta).length > 0) {
    logMessage += ` ${JSON.stringify(meta)}`;
  }

  return logMessage;
}

/**
 * Console Fallback Logger
 * 当Winston不可用时使用的简单日志记录器
 */
class ConsoleFallbackLogger {
  constructor() {
    this.level =
      process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.maxLevel = LOG_LEVELS[this.level];
  }

  /**
   * 判断是否应该记录该级别的日志
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= this.maxLevel;
  }

  /**
   * 记录错误日志
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(formatConsoleMessage('error', message, meta));
    }
  }

  /**
   * 记录警告日志
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(formatConsoleMessage('warn', message, meta));
    }
  }

  /**
   * 记录信息日志
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.info(formatConsoleMessage('info', message, meta));
    }
  }

  /**
   * 记录调试日志
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.debug(formatConsoleMessage('debug', message, meta));
    }
  }
}

/**
 * 创建Winston Logger
 * 生产级别的日志记录器配置
 */
function createWinstonLogger() {
  const { combine, timestamp, printf, colorize, json, errors } = winston.format;

  // 确保日志目录存在
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // 开发环境日志格式（彩色、易读）
  const devFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp, level, message, ...meta }) => {
      let log = `[${timestamp}] ${level}: ${message}`;

      // 如果有额外的元数据，添加到日志中
      const metaKeys = Object.keys(meta);
      if (metaKeys.length > 0) {
        // 过滤掉内部字段
        const filteredMeta = Object.fromEntries(
          Object.entries(meta).filter(([key]) => !['level', 'timestamp', 'message'].includes(key))
        );
        if (Object.keys(filteredMeta).length > 0) {
          log += ` ${JSON.stringify(filteredMeta)}`;
        }
      }

      return log;
    })
  );

  // 生产环境日志格式（JSON、结构化）
  const prodFormat = combine(timestamp(), errors({ stack: true }), json());

  // 根据环境选择格式
  const isProduction = process.env.NODE_ENV === 'production';
  const logFormat = isProduction ? prodFormat : devFormat;

  // 日志传输目标配置
  const transports = [
    // 控制台输出（所有环境）
    new winston.transports.Console({
      format: logFormat
    })
  ];

  // 生产环境添加文件输出
  if (isProduction) {
    transports.push(
      // 错误日志文件
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // 综合日志文件
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  // 创建logger实例
  return winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    levels: LOG_LEVELS,
    format: logFormat,
    transports,
    // 处理未捕获的异常
    exceptionHandlers: isProduction
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
          })
        ]
      : [],
    // 处理未处理的Promise拒绝
    rejectionHandlers: isProduction
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
          })
        ]
      : []
  });
}

/**
 * 创建日志记录器实例
 */
const logger = useWinston ? createWinstonLogger() : new ConsoleFallbackLogger();

/**
 * Express中间件：请求日志记录器
 * 记录每个HTTP请求的详细信息
 *
 * @example
 * app.use(requestLogger);
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.url}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.url}`, logData);
    } else {
      logger.info(`${req.method} ${req.url}`, logData);
    }
  });

  next();
}

/**
 * Express中间件：错误日志记录器
 * 记录应用程序错误
 *
 * 注意：这个中间件应该在所有其他中间件之后注册
 *
 * @example
 * app.use(errorLogger);
 */
function errorLogger(err, req, res, next) {
  logger.error('应用错误', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress
  });

  next(err);
}

/**
 * 创建子日志记录器
 * 用于为特定模块或功能创建带标签的日志记录器
 *
 * @param {string} label - 日志标签（如：'Database', 'Auth', 'Upload'）
 * @returns {Object} 带标签的日志记录器
 *
 * @example
 * const dbLogger = createChildLogger('Database');
 * dbLogger.info('连接成功', { host: 'localhost' });
 */
function createChildLogger(label) {
  if (useWinston && winston.createLogger) {
    return logger.child({ service: label });
  }

  // Fallback实现
  return {
    error: (message, meta) => logger.error(`[${label}] ${message}`, meta),
    warn: (message, meta) => logger.warn(`[${label}] ${message}`, meta),
    info: (message, meta) => logger.info(`[${label}] ${message}`, meta),
    debug: (message, meta) => logger.debug(`[${label}] ${message}`, meta)
  };
}

// 导出日志记录器和中间件
module.exports = {
  logger,
  requestLogger,
  errorLogger,
  createChildLogger,

  // 便捷方法
  error: (message, meta) => logger.error(message, meta),
  warn: (message, meta) => logger.warn(message, meta),
  info: (message, meta) => logger.info(message, meta),
  debug: (message, meta) => logger.debug(message, meta)
};
