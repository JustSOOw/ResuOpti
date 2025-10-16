/**
 * 文件处理工具函数
 * 提供文件大小格式化、类型检查、读取、下载等功能
 */

// ============ 常量定义 ============

/**
 * 文件大小限制常量（字节）
 */
export const FILE_SIZE_LIMITS = {
  /** 10MB - 简历文件默认限制 */
  RESUME: 10 * 1024 * 1024,
  /** 5MB - 图片文件限制 */
  IMAGE: 5 * 1024 * 1024,
  /** 20MB - 大文件限制 */
  LARGE_FILE: 20 * 1024 * 1024,
  /** 1MB - 小文件限制 */
  SMALL_FILE: 1 * 1024 * 1024
} as const

/**
 * 常见文件MIME类型映射
 */
export const MIME_TYPES = {
  // 文档类型
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // 文本类型
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',

  // 图片类型
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',

  // 其他类型
  zip: 'application/zip',
  xml: 'application/xml'
} as const

/**
 * 简历文件接受的类型
 */
export const ACCEPTED_RESUME_TYPES = {
  /** 扩展名数组 */
  extensions: ['.pdf', '.doc', '.docx'],
  /** MIME类型数组 */
  mimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  /** accept属性字符串（用于input元素） */
  acceptString: '.pdf,.doc,.docx'
} as const

// ============ 文件大小处理 ============

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的文件大小字符串（B/KB/MB/GB）
 * @example
 * formatFileSize(1024) // '1.00 KB'
 * formatFileSize(1048576) // '1.00 MB'
 * formatFileSize(1073741824) // '1.00 GB'
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '无效大小'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

  return `${size} ${sizes[i]}`
}

/**
 * 解析文件大小字符串为字节数
 * @param sizeString 文件大小字符串（如 '10MB', '5.5 KB'）
 * @returns 字节数，解析失败返回null
 * @example
 * parseFileSize('10MB') // 10485760
 * parseFileSize('5.5 KB') // 5632
 * parseFileSize('1 GB') // 1073741824
 */
export function parseFileSize(sizeString: string): number | null {
  if (!sizeString || typeof sizeString !== 'string') return null

  // 移除空格并转为大写
  const normalized = sizeString.trim().toUpperCase()

  // 匹配数字和单位
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/)
  if (!match) return null

  const value = parseFloat(match[1])
  const unit = match[2] || 'B'

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024
  }

  return Math.floor(value * multipliers[unit])
}

// ============ 文件类型检查 ============

/**
 * 获取文件扩展名（含点号）
 * @param filename 文件名
 * @returns 扩展名（小写，含点号），无扩展名返回空字符串
 * @example
 * getFileExtension('resume.pdf') // '.pdf'
 * getFileExtension('document.tar.gz') // '.gz'
 * getFileExtension('noextension') // ''
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''

  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) return ''

  return filename.slice(lastDotIndex).toLowerCase()
}

/**
 * 获取文件MIME类型
 * @param file 文件对象
 * @returns MIME类型字符串（小写），无法获取返回空字符串
 */
export function getFileMimeType(file: File): string {
  if (!file || !(file instanceof File)) return ''
  return file.type.toLowerCase()
}

/**
 * 验证文件类型是否在接受范围内
 * @param file 文件对象
 * @param accept 接受的类型（MIME类型或扩展名，逗号分隔）
 * @returns 是否通过验证
 * @example
 * isValidFileType(file, '.pdf,.doc,.docx')
 * isValidFileType(file, 'application/pdf,application/msword')
 * isValidFileType(file, '.pdf,application/msword')
 */
export function isValidFileType(file: File, accept: string): boolean {
  if (!file || !(file instanceof File)) return false
  if (!accept || typeof accept !== 'string') return true

  // 解析accept属性中的MIME类型和扩展名
  const acceptTypes = accept.split(',').map((t) => t.trim().toLowerCase())
  if (acceptTypes.length === 0) return true

  const fileName = file.name.toLowerCase()
  const fileMimeType = file.type.toLowerCase()

  // 检查是否匹配任一接受类型
  return acceptTypes.some((type) => {
    // 检查扩展名匹配
    if (type.startsWith('.')) {
      return fileName.endsWith(type)
    }

    // 检查MIME类型匹配（支持通配符，如 image/*）
    if (type.includes('/')) {
      if (type.endsWith('/*')) {
        // 通配符匹配（如 image/* 匹配 image/jpeg）
        const prefix = type.slice(0, -2)
        return fileMimeType.startsWith(prefix)
      } else {
        // 精确匹配
        return fileMimeType === type
      }
    }

    return false
  })
}

/**
 * 检查是否为PDF文件
 * @param file 文件对象
 * @returns 是否为PDF文件
 */
export function isPDF(file: File): boolean {
  if (!file || !(file instanceof File)) return false

  const extension = getFileExtension(file.name)
  const mimeType = getFileMimeType(file)

  return extension === '.pdf' || mimeType === 'application/pdf'
}

/**
 * 检查是否为Word文档
 * @param file 文件对象
 * @returns 是否为Word文档（.doc或.docx）
 */
export function isWord(file: File): boolean {
  if (!file || !(file instanceof File)) return false

  const extension = getFileExtension(file.name)
  const mimeType = getFileMimeType(file)

  return (
    extension === '.doc' ||
    extension === '.docx' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}

/**
 * 检查是否为文档文件（PDF或Word）
 * @param file 文件对象
 * @returns 是否为文档文件
 */
export function isDocument(file: File): boolean {
  return isPDF(file) || isWord(file)
}

/**
 * 检查是否为图片文件
 * @param file 文件对象
 * @returns 是否为图片文件
 */
export function isImage(file: File): boolean {
  if (!file || !(file instanceof File)) return false

  const mimeType = getFileMimeType(file)
  return mimeType.startsWith('image/')
}

// ============ 文件大小检查 ============

/**
 * 验证文件大小是否在限制内
 * @param file 文件对象
 * @param maxSize 最大文件大小（字节）
 * @returns 是否通过验证
 */
export function isValidFileSize(file: File, maxSize: number): boolean {
  if (!file || !(file instanceof File)) return false
  if (typeof maxSize !== 'number' || maxSize <= 0) return true

  return file.size <= maxSize
}

/**
 * 检查文件是否在大小限制内
 * @param file 文件对象
 * @param maxBytes 最大字节数
 * @returns 是否在限制内
 */
export function isWithinSizeLimit(file: File, maxBytes: number): boolean {
  return isValidFileSize(file, maxBytes)
}

// ============ 文件读取 ============

/**
 * 读取文件为文本
 * @param file 文件对象
 * @param encoding 字符编码，默认UTF-8
 * @returns Promise，解析为文本内容
 */
export function readFileAsText(file: File, encoding: string = 'UTF-8'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error('无效的文件对象'))
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string)
      } else {
        reject(new Error('文件读取失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取出错'))
    }

    reader.readAsText(file, encoding)
  })
}

/**
 * 读取文件为DataURL
 * @param file 文件对象
 * @returns Promise，解析为DataURL字符串（Base64编码）
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error('无效的文件对象'))
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string)
      } else {
        reject(new Error('文件读取失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取出错'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 读取文件为ArrayBuffer
 * @param file 文件对象
 * @returns Promise，解析为ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error('无效的文件对象'))
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as ArrayBuffer)
      } else {
        reject(new Error('文件读取失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取出错'))
    }

    reader.readAsArrayBuffer(file)
  })
}

// ============ 文件下载 ============

/**
 * 下载Blob对象为文件
 * @param blob Blob对象
 * @param filename 文件名
 * @throws 如果浏览器不支持下载功能
 */
export function downloadFile(blob: Blob, filename: string): void {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('无效的Blob对象')
  }

  if (!filename || typeof filename !== 'string') {
    throw new Error('无效的文件名')
  }

  // 创建临时URL
  const url = URL.createObjectURL(blob)

  try {
    // 创建隐藏的a标签触发下载
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    // 释放URL对象
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }
}

/**
 * 从URL下载文件
 * @param url 文件URL
 * @param filename 可选的文件名，不提供则从URL提取
 * @returns Promise，下载完成后解析
 */
export async function downloadFromUrl(url: string, filename?: string): Promise<void> {
  if (!url || typeof url !== 'string') {
    throw new Error('无效的URL')
  }

  try {
    // 获取文件数据
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`)
    }

    // 获取Blob数据
    const blob = await response.blob()

    // 确定文件名
    let finalFilename = filename
    if (!finalFilename) {
      // 尝试从Content-Disposition头获取文件名
      const contentDisposition = response.headers.get('Content-Disposition')
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          finalFilename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // 如果仍然没有文件名，从URL提取
      if (!finalFilename) {
        const urlPath = new URL(url, window.location.origin).pathname
        finalFilename = urlPath.split('/').pop() || 'download'
      }
    }

    // 下载文件
    downloadFile(blob, finalFilename)
  } catch (error) {
    throw new Error(`文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// ============ 文件验证组合函数 ============

/**
 * 文件验证结果接口
 */
export interface FileValidationResult {
  /** 是否通过验证 */
  valid: boolean
  /** 错误信息（验证失败时） */
  error?: string
}

/**
 * 验证简历文件（类型和大小）
 * @param file 文件对象
 * @param maxSize 最大文件大小（字节），默认10MB
 * @returns 验证结果
 */
export function validateResumeFile(
  file: File,
  maxSize: number = FILE_SIZE_LIMITS.RESUME
): FileValidationResult {
  // 检查文件对象是否有效
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      error: '无效的文件对象'
    }
  }

  // 验证文件类型
  if (!isDocument(file)) {
    return {
      valid: false,
      error: '只支持PDF和Word文档（.pdf, .doc, .docx）'
    }
  }

  // 验证文件大小
  if (!isValidFileSize(file, maxSize)) {
    return {
      valid: false,
      error: `文件大小不能超过 ${formatFileSize(maxSize)}`
    }
  }

  return {
    valid: true
  }
}

/**
 * 批量验证文件
 * @param files 文件数组
 * @param accept 接受的文件类型
 * @param maxSize 最大文件大小（字节）
 * @returns 验证结果数组
 */
export function validateFiles(
  files: File[],
  accept: string,
  maxSize: number
): FileValidationResult[] {
  if (!Array.isArray(files)) {
    return []
  }

  return files.map((file) => {
    // 验证文件类型
    if (!isValidFileType(file, accept)) {
      return {
        valid: false,
        error: `文件类型不符合要求：${file.name}`
      }
    }

    // 验证文件大小
    if (!isValidFileSize(file, maxSize)) {
      return {
        valid: false,
        error: `文件大小超过限制：${file.name}（${formatFileSize(file.size)}）`
      }
    }

    return {
      valid: true
    }
  })
}

// ============ 工具函数 ============

/**
 * 获取文件名（不含扩展名）
 * @param filename 文件名
 * @returns 不含扩展名的文件名
 * @example
 * getFileNameWithoutExtension('resume.pdf') // 'resume'
 * getFileNameWithoutExtension('document.tar.gz') // 'document.tar'
 */
export function getFileNameWithoutExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''

  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) return filename

  return filename.slice(0, lastDotIndex)
}

/**
 * 生成唯一文件名
 * @param originalFilename 原始文件名
 * @param prefix 可选的前缀
 * @returns 唯一文件名（添加时间戳）
 * @example
 * generateUniqueFilename('resume.pdf') // 'resume_1234567890123.pdf'
 * generateUniqueFilename('resume.pdf', 'user') // 'user_resume_1234567890123.pdf'
 */
export function generateUniqueFilename(originalFilename: string, prefix?: string): string {
  const extension = getFileExtension(originalFilename)
  const nameWithoutExt = getFileNameWithoutExtension(originalFilename)
  const timestamp = Date.now()

  if (prefix) {
    return `${prefix}_${nameWithoutExt}_${timestamp}${extension}`
  }

  return `${nameWithoutExt}_${timestamp}${extension}`
}

/**
 * 检查文件是否为空
 * @param file 文件对象
 * @returns 是否为空文件
 */
export function isEmptyFile(file: File): boolean {
  return file && file instanceof File && file.size === 0
}
