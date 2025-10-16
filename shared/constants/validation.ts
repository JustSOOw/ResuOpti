/**
 * 验证规则常量
 *
 * 定义前后端共享的验证约束常量
 */

/**
 * 用户验证规则
 */
export const USER_VALIDATION = {
  /** 邮箱最大长度 */
  EMAIL_MAX_LENGTH: 255,
  /** 密码最小长度 */
  PASSWORD_MIN_LENGTH: 8,
  /** 密码正则表达式：至少8位，包含字母和数字 */
  PASSWORD_PATTERN: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
} as const

/**
 * 岗位验证规则
 */
export const POSITION_VALIDATION = {
  /** 岗位名称最小长度 */
  NAME_MIN_LENGTH: 1,
  /** 岗位名称最大长度 */
  NAME_MAX_LENGTH: 100,
  /** 描述最大长度 */
  DESCRIPTION_MAX_LENGTH: 2000,
} as const

/**
 * 简历验证规则
 */
export const RESUME_VALIDATION = {
  /** 简历标题最小长度 */
  TITLE_MIN_LENGTH: 1,
  /** 简历标题最大长度 */
  TITLE_MAX_LENGTH: 200,
  /** 文件路径最大长度 */
  FILE_PATH_MAX_LENGTH: 500,
  /** 文件名最大长度 */
  FILE_NAME_MAX_LENGTH: 255,
  /** 文件大小最大值（10MB） */
  FILE_SIZE_MAX: 10 * 1024 * 1024, // 10485760 字节
  /** 允许的文件扩展名 */
  ALLOWED_FILE_EXTENSIONS: ['.pdf', '.docx', '.doc'] as const,
  /** 允许的文件MIME类型 */
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ] as const,
} as const

/**
 * 元数据验证规则
 */
export const METADATA_VALIDATION = {
  /** 备注最大长度 */
  NOTES_MAX_LENGTH: 2000,
  /** 标签最大数量 */
  TAGS_MAX_COUNT: 20,
  /** 单个标签最大长度 */
  TAG_MAX_LENGTH: 50,
} as const

/**
 * 投递记录验证规则
 */
export const APPLICATION_VALIDATION = {
  /** 公司名称最小长度 */
  COMPANY_NAME_MIN_LENGTH: 1,
  /** 公司名称最大长度 */
  COMPANY_NAME_MAX_LENGTH: 200,
  /** 职位名称最大长度 */
  POSITION_TITLE_MAX_LENGTH: 200,
  /** 备注最大长度 */
  NOTES_MAX_LENGTH: 2000,
} as const

/**
 * 分页默认值
 */
export const PAGINATION_DEFAULTS = {
  /** 默认页码 */
  DEFAULT_PAGE: 1,
  /** 默认每页数量 */
  DEFAULT_PAGE_SIZE: 10,
  /** 最大每页数量 */
  MAX_PAGE_SIZE: 100,
} as const