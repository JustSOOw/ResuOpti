/**
 * 枚举类型定义
 * 定义应用中使用的所有枚举类型
 */

/**
 * 简历类型
 * - file: 文件简历（上传的PDF、Word等文档）
 * - online: 在线简历（富文本编辑器编辑）
 */
export type ResumeType = 'file' | 'online'

/**
 * 投递记录状态
 * - 已投递: 已提交申请，等待反馈
 * - 面试邀请: 收到面试邀请
 * - 已拒绝: 申请被拒绝
 * - 已录用: 申请成功，已被录用
 */
export type ApplicationStatus = '已投递' | '面试邀请' | '已拒绝' | '已录用'

/**
 * 主题模式
 * - light: 亮色模式
 * - dark: 暗黑模式
 * - auto: 自动跟随系统主题
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 排序方向
 * - asc: 升序
 * - desc: 降序
 */
export type SortOrder = 'asc' | 'desc'
