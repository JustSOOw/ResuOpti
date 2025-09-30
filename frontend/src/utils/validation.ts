/**
 * 表单验证工具函数
 *
 * 提供：
 * - 基础验证函数（邮箱、密码、长度、日期、URL等）
 * - Element Plus表单验证规则
 * - 业务验证函数（岗位、简历、标签、文件等）
 * - 工具函数（格式化、错误消息等）
 */

import type { FormItemRule } from 'element-plus'

/**
 * ======================
 * 基础验证函数
 * ======================
 */

/**
 * 邮箱格式验证（符合RFC 5322标准）
 * @param email 邮箱地址
 * @returns 是否为有效邮箱
 */
export function isEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // RFC 5322 标准的简化正则表达式
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  return emailRegex.test(email)
}

/**
 * 密码强度验证
 * 要求：最少8位，包含字母和数字
 * @param password 密码
 * @returns 是否为有效密码
 */
export function isStrongPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false
  }

  // 长度至少8位
  if (password.length < 8) {
    return false
  }

  // 必须包含字母
  const hasLetter = /[a-zA-Z]/.test(password)

  // 必须包含数字
  const hasNumber = /[0-9]/.test(password)

  return hasLetter && hasNumber
}

/**
 * 字符串长度验证
 * @param text 待验证的文本
 * @param min 最小长度
 * @param max 最大长度
 * @returns 是否在有效长度范围内
 */
export function isValidLength(text: string, min: number, max: number): boolean {
  if (text === null || text === undefined) {
    return false
  }

  const length = String(text).length
  return length >= min && length <= max
}

/**
 * 日期验证选项
 */
interface DateValidationOptions {
  /** 是否允许未来日期 */
  allowFuture?: boolean
  /** 是否允许过去日期 */
  allowPast?: boolean
  /** 最早日期 */
  minDate?: Date
  /** 最晚日期 */
  maxDate?: Date
}

/**
 * 日期验证
 * @param date 待验证的日期
 * @param options 验证选项
 * @returns 是否为有效日期
 */
export function isValidDate(date: Date | string | number, options: DateValidationOptions = {}): boolean {
  const {
    allowFuture = true,
    allowPast = true,
    minDate,
    maxDate
  } = options

  // 转换为Date对象
  const dateObj = date instanceof Date ? date : new Date(date)

  // 检查是否为有效日期
  if (isNaN(dateObj.getTime())) {
    return false
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const checkDate = new Date(dateObj)
  checkDate.setHours(0, 0, 0, 0)

  // 检查未来日期限制
  if (!allowFuture && checkDate > now) {
    return false
  }

  // 检查过去日期限制
  if (!allowPast && checkDate < now) {
    return false
  }

  // 检查最小日期
  if (minDate) {
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    if (checkDate < min) {
      return false
    }
  }

  // 检查最大日期
  if (maxDate) {
    const max = new Date(maxDate)
    max.setHours(0, 0, 0, 0)
    if (checkDate > max) {
      return false
    }
  }

  return true
}

/**
 * URL验证
 * @param url URL地址
 * @returns 是否为有效URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * ======================
 * Element Plus 验证规则
 * ======================
 */

/**
 * 邮箱验证规则（用于el-form）
 */
export const emailRules: FormItemRule[] = [
  {
    required: true,
    message: '请输入邮箱地址',
    trigger: 'blur'
  },
  {
    validator: (_rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      if (!isEmail(value)) {
        callback(new Error('请输入有效的邮箱地址'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }
]

/**
 * 密码验证规则（用于el-form）
 */
export const passwordRules: FormItemRule[] = [
  {
    required: true,
    message: '请输入密码',
    trigger: 'blur'
  },
  {
    validator: (_rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      if (!isStrongPassword(value)) {
        callback(new Error('密码至少8位，且包含字母和数字'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }
]

/**
 * 生成必填验证规则
 * @param message 自定义错误消息
 * @returns FormItemRule
 */
export function requiredRule(message?: string): FormItemRule {
  return {
    required: true,
    message: message || '此字段为必填项',
    trigger: 'blur'
  }
}

/**
 * 生成长度验证规则
 * @param min 最小长度
 * @param max 最大长度
 * @param message 自定义错误消息
 * @returns FormItemRule
 */
export function lengthRule(min: number, max: number, message?: string): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      if (!isValidLength(value, min, max)) {
        callback(new Error(message || `长度应在 ${min} 到 ${max} 个字符之间`))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }
}

/**
 * 生成正则表达式验证规则
 * @param pattern 正则表达式
 * @param message 错误消息
 * @returns FormItemRule
 */
export function patternRule(pattern: RegExp, message: string): FormItemRule {
  return {
    pattern,
    message,
    trigger: 'blur'
  }
}

/**
 * ======================
 * 业务验证函数
 * ======================
 */

/**
 * 岗位名称验证结果
 */
interface ValidationResult {
  valid: boolean
  message?: string
}

/**
 * 岗位名称验证
 * 要求：1-100字符
 * @param name 岗位名称
 * @returns 验证结果
 */
export function validatePositionName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      message: '岗位名称不能为空'
    }
  }

  const trimmedName = name.trim()

  if (trimmedName.length === 0) {
    return {
      valid: false,
      message: '岗位名称不能为空'
    }
  }

  if (!isValidLength(trimmedName, 1, 100)) {
    return {
      valid: false,
      message: '岗位名称长度应在 1 到 100 个字符之间'
    }
  }

  return { valid: true }
}

/**
 * 简历标题验证
 * 要求：1-200字符
 * @param title 简历标题
 * @returns 验证结果
 */
export function validateResumeTitle(title: string): ValidationResult {
  if (!title || typeof title !== 'string') {
    return {
      valid: false,
      message: '简历标题不能为空'
    }
  }

  const trimmedTitle = title.trim()

  if (trimmedTitle.length === 0) {
    return {
      valid: false,
      message: '简历标题不能为空'
    }
  }

  if (!isValidLength(trimmedTitle, 1, 200)) {
    return {
      valid: false,
      message: '简历标题长度应在 1 到 200 个字符之间'
    }
  }

  return { valid: true }
}

/**
 * 标签数组验证
 * 要求：每个标签≤50字符，总数≤20个
 * @param tags 标签数组
 * @returns 验证结果
 */
export function validateTags(tags: string[]): ValidationResult {
  if (!Array.isArray(tags)) {
    return {
      valid: false,
      message: '标签必须是数组格式'
    }
  }

  // 检查标签数量
  if (tags.length > 20) {
    return {
      valid: false,
      message: '标签数量不能超过 20 个'
    }
  }

  // 检查每个标签的长度
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]

    if (!tag || typeof tag !== 'string') {
      return {
        valid: false,
        message: `第 ${i + 1} 个标签格式不正确`
      }
    }

    if (tag.length > 50) {
      return {
        valid: false,
        message: `第 ${i + 1} 个标签长度不能超过 50 个字符`
      }
    }

    if (tag.trim().length === 0) {
      return {
        valid: false,
        message: `第 ${i + 1} 个标签不能为空`
      }
    }
  }

  return { valid: true }
}

/**
 * 文件类型验证
 * @param file 文件对象
 * @param accept 允许的文件类型（如 ['.pdf', '.doc', '.docx']）
 * @returns 验证结果
 */
export function validateFileType(file: File, accept: string[]): ValidationResult {
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      message: '请选择文件'
    }
  }

  // 获取文件扩展名
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))

  // 检查扩展名是否在允许的列表中
  const isAccepted = accept.some(ext => {
    const normalizedExt = ext.toLowerCase()
    return fileExtension === normalizedExt
  })

  if (!isAccepted) {
    return {
      valid: false,
      message: `仅支持 ${accept.join(', ')} 格式的文件`
    }
  }

  return { valid: true }
}

/**
 * 文件大小验证
 * @param file 文件对象
 * @param maxSize 最大文件大小（字节）
 * @returns 验证结果
 */
export function validateFileSize(file: File, maxSize: number): ValidationResult {
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      message: '请选择文件'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `文件大小不能超过 ${formatBytes(maxSize)}`
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      message: '文件不能为空'
    }
  }

  return { valid: true }
}

/**
 * 备注长度验证
 * 要求：≤2000字符
 * @param notes 备注内容
 * @returns 验证结果
 */
export function validateNotes(notes: string): ValidationResult {
  if (!notes) {
    return { valid: true } // 备注可以为空
  }

  if (typeof notes !== 'string') {
    return {
      valid: false,
      message: '备注格式不正确'
    }
  }

  if (notes.length > 2000) {
    return {
      valid: false,
      message: '备注长度不能超过 2000 个字符'
    }
  }

  return { valid: true }
}

/**
 * 公司名称验证
 * 要求：1-200字符
 * @param companyName 公司名称
 * @returns 验证结果
 */
export function validateCompanyName(companyName: string): ValidationResult {
  if (!companyName || typeof companyName !== 'string') {
    return {
      valid: false,
      message: '公司名称不能为空'
    }
  }

  const trimmedName = companyName.trim()

  if (trimmedName.length === 0) {
    return {
      valid: false,
      message: '公司名称不能为空'
    }
  }

  if (!isValidLength(trimmedName, 1, 200)) {
    return {
      valid: false,
      message: '公司名称长度应在 1 到 200 个字符之间'
    }
  }

  return { valid: true }
}

/**
 * 投递日期验证
 * 要求：不能为未来日期
 * @param date 投递日期
 * @returns 验证结果
 */
export function validateApplyDate(date: Date | string | number): ValidationResult {
  if (!isValidDate(date, { allowFuture: false })) {
    return {
      valid: false,
      message: '投递日期不能为未来日期'
    }
  }

  return { valid: true }
}

/**
 * ======================
 * 工具函数
 * ======================
 */

/**
 * 格式化字节大小为人类可读格式
 * @param bytes 字节数
 * @param decimals 小数位数（默认2位）
 * @returns 格式化后的字符串（如 "1.5 MB"）
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 错误字段名称映射
 */
const fieldNameMap: Record<string, string> = {
  email: '邮箱',
  password: '密码',
  name: '名称',
  title: '标题',
  description: '描述',
  notes: '备注',
  tags: '标签',
  companyName: '公司名称',
  positionTitle: '职位名称',
  applyDate: '投递日期',
  file: '文件'
}

/**
 * 验证规则类型映射
 */
const ruleTypeMap: Record<string, string> = {
  required: '不能为空',
  email: '格式不正确',
  password: '强度不够',
  length: '长度不符合要求',
  fileType: '文件类型不支持',
  fileSize: '文件大小超出限制',
  date: '日期格式不正确'
}

/**
 * 获取格式化的错误消息
 * @param field 字段名
 * @param rule 规则类型
 * @param customMessage 自定义消息
 * @returns 错误消息字符串
 */
export function getErrorMessage(
  field: string,
  rule: string,
  customMessage?: string
): string {
  if (customMessage) {
    return customMessage
  }

  const fieldName = fieldNameMap[field] || field
  const ruleMessage = ruleTypeMap[rule] || '验证失败'

  return `${fieldName}${ruleMessage}`
}

/**
 * ======================
 * 常量定义
 * ======================
 */

/**
 * 文件验证常量
 */
export const FILE_VALIDATION = {
  /** 允许的简历文件类型 */
  ALLOWED_RESUME_TYPES: ['.pdf', '.doc', '.docx'],
  /** 最大文件大小（10MB） */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10,485,760 字节
  /** 最大文件大小（人类可读） */
  MAX_FILE_SIZE_READABLE: '10 MB'
} as const

/**
 * 长度验证常量
 */
export const LENGTH_VALIDATION = {
  /** 岗位名称 */
  POSITION_NAME: { min: 1, max: 100 },
  /** 简历标题 */
  RESUME_TITLE: { min: 1, max: 200 },
  /** 备注 */
  NOTES: { min: 0, max: 2000 },
  /** 单个标签 */
  TAG: { min: 1, max: 50 },
  /** 标签数量 */
  TAG_COUNT: { min: 0, max: 20 },
  /** 公司名称 */
  COMPANY_NAME: { min: 1, max: 200 },
  /** 职位名称 */
  POSITION_TITLE: { min: 1, max: 200 },
  /** 岗位描述 */
  DESCRIPTION: { min: 0, max: 1000 }
} as const

/**
 * 密码验证常量
 */
export const PASSWORD_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 8,
  /** 要求 */
  REQUIREMENTS: '至少8位，且包含字母和数字'
} as const

/**
 * ======================
 * 组合验证规则生成器
 * ======================
 */

/**
 * 生成岗位名称验证规则
 */
export function getPositionNameRules(): FormItemRule[] {
  return [
    requiredRule('请输入岗位名称'),
    lengthRule(
      LENGTH_VALIDATION.POSITION_NAME.min,
      LENGTH_VALIDATION.POSITION_NAME.max,
      `岗位名称长度应在 ${LENGTH_VALIDATION.POSITION_NAME.min} 到 ${LENGTH_VALIDATION.POSITION_NAME.max} 个字符之间`
    )
  ]
}

/**
 * 生成简历标题验证规则
 */
export function getResumeTitleRules(): FormItemRule[] {
  return [
    requiredRule('请输入简历标题'),
    lengthRule(
      LENGTH_VALIDATION.RESUME_TITLE.min,
      LENGTH_VALIDATION.RESUME_TITLE.max,
      `简历标题长度应在 ${LENGTH_VALIDATION.RESUME_TITLE.min} 到 ${LENGTH_VALIDATION.RESUME_TITLE.max} 个字符之间`
    )
  ]
}

/**
 * 生成公司名称验证规则
 */
export function getCompanyNameRules(): FormItemRule[] {
  return [
    requiredRule('请输入公司名称'),
    lengthRule(
      LENGTH_VALIDATION.COMPANY_NAME.min,
      LENGTH_VALIDATION.COMPANY_NAME.max,
      `公司名称长度应在 ${LENGTH_VALIDATION.COMPANY_NAME.min} 到 ${LENGTH_VALIDATION.COMPANY_NAME.max} 个字符之间`
    )
  ]
}

/**
 * 生成投递日期验证规则
 */
export function getApplyDateRules(): FormItemRule[] {
  return [
    requiredRule('请选择投递日期'),
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        const result = validateApplyDate(value)
        if (!result.valid) {
          callback(new Error(result.message))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

/**
 * 生成备注验证规则
 */
export function getNotesRules(): FormItemRule[] {
  return [
    lengthRule(
      LENGTH_VALIDATION.NOTES.min,
      LENGTH_VALIDATION.NOTES.max,
      `备注长度不能超过 ${LENGTH_VALIDATION.NOTES.max} 个字符`
    )
  ]
}

/**
 * ======================
 * 类型导出
 * ======================
 */

export type { ValidationResult, DateValidationOptions }