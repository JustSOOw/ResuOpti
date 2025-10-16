/**
 * 请求数据验证中间件
 * 提供通用的验证中间件工厂函数和常用验证规则
 *
 * 功能:
 * - 支持验证 req.body, req.params, req.query
 * - 提供常用验证规则（required, email, length, pattern等）
 * - 支持自定义验证函数
 * - 返回详细的中文验证错误信息
 *
 * 使用示例:
 * const userSchema = {
 *   body: {
 *     email: { required: true, email: true },
 *     password: { required: true, minLength: 8, pattern: /^(?=.*[A-Za-z])(?=.*\d)/ }
 *   }
 * };
 * router.post('/register', validate(userSchema), handler);
 */

const validator = require('validator');

/**
 * 验证规则处理器映射表
 * 每个规则对应一个验证函数
 */
const validators = {
  /**
   * 必填字段验证
   * @param {*} value - 待验证的值
   * @param {boolean} rule - 是否必填
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  required: (value, rule, field) => {
    if (!rule) return null;
    if (value === undefined || value === null || value === '') {
      return `${field}是必需字段`;
    }
    // 检查字符串是否为空白
    if (typeof value === 'string' && value.trim() === '') {
      return `${field}不能为空`;
    }
    return null;
  },

  /**
   * 邮箱格式验证
   * @param {string} value - 待验证的值
   * @param {boolean} rule - 是否验证邮箱
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  email: (value, rule, field) => {
    if (!rule) return null;
    if (!value) return null; // 空值由required处理
    if (!validator.isEmail(value)) {
      return `${field}格式无效，请输入有效的邮箱地址`;
    }
    return null;
  },

  /**
   * 最小长度验证
   * @param {string} value - 待验证的值
   * @param {number} rule - 最小长度
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  minLength: (value, rule, field) => {
    if (rule === undefined) return null;
    if (!value) return null; // 空值由required处理
    if (typeof value !== 'string') {
      return `${field}必须是字符串类型`;
    }
    if (value.length < rule) {
      return `${field}长度不能少于${rule}个字符`;
    }
    return null;
  },

  /**
   * 最大长度验证
   * @param {string} value - 待验证的值
   * @param {number} rule - 最大长度
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  maxLength: (value, rule, field) => {
    if (rule === undefined) return null;
    if (!value) return null; // 空值由required处理
    if (typeof value !== 'string') {
      return `${field}必须是字符串类型`;
    }
    if (value.length > rule) {
      return `${field}长度不能超过${rule}个字符`;
    }
    return null;
  },

  /**
   * 精确长度验证
   * @param {string} value - 待验证的值
   * @param {number} rule - 精确长度
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  length: (value, rule, field) => {
    if (rule === undefined) return null;
    if (!value) return null; // 空值由required处理
    if (typeof value !== 'string') {
      return `${field}必须是字符串类型`;
    }
    if (value.length !== rule) {
      return `${field}长度必须为${rule}个字符`;
    }
    return null;
  },

  /**
   * 正则表达式验证
   * @param {string} value - 待验证的值
   * @param {RegExp} rule - 正则表达式
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  pattern: (value, rule, field) => {
    if (!rule) return null;
    if (!value) return null; // 空值由required处理
    if (!(rule instanceof RegExp)) {
      return `${field}的验证规则配置错误`;
    }
    if (!rule.test(value)) {
      return `${field}格式不符合要求`;
    }
    return null;
  },

  /**
   * 枚举值验证
   * @param {*} value - 待验证的值
   * @param {Array} rule - 允许的值数组
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  enum: (value, rule, field) => {
    if (!rule || !Array.isArray(rule)) return null;
    if (!value) return null; // 空值由required处理
    if (!rule.includes(value)) {
      return `${field}必须是以下值之一: ${rule.join(', ')}`;
    }
    return null;
  },

  /**
   * 数值范围验证 - 最小值
   * @param {number} value - 待验证的值
   * @param {number} rule - 最小值
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  min: (value, rule, field) => {
    if (rule === undefined) return null;
    if (!value && value !== 0) return null; // 空值由required处理
    if (typeof value !== 'number') {
      return `${field}必须是数字类型`;
    }
    if (value < rule) {
      return `${field}不能小于${rule}`;
    }
    return null;
  },

  /**
   * 数值范围验证 - 最大值
   * @param {number} value - 待验证的值
   * @param {number} rule - 最大值
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  max: (value, rule, field) => {
    if (rule === undefined) return null;
    if (!value && value !== 0) return null; // 空值由required处理
    if (typeof value !== 'number') {
      return `${field}必须是数字类型`;
    }
    if (value > rule) {
      return `${field}不能大于${rule}`;
    }
    return null;
  },

  /**
   * URL格式验证
   * @param {string} value - 待验证的值
   * @param {boolean} rule - 是否验证URL
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  url: (value, rule, field) => {
    if (!rule) return null;
    if (!value) return null; // 空值由required处理
    if (!validator.isURL(value)) {
      return `${field}必须是有效的URL地址`;
    }
    return null;
  },

  /**
   * UUID格式验证
   * @param {string} value - 待验证的值
   * @param {boolean} rule - 是否验证UUID
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  uuid: (value, rule, field) => {
    if (!rule) return null;
    if (!value) return null; // 空值由required处理
    if (!validator.isUUID(value)) {
      return `${field}必须是有效的UUID格式`;
    }
    return null;
  },

  /**
   * 日期格式验证
   * @param {string} value - 待验证的值
   * @param {boolean} rule - 是否验证日期
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  date: (value, rule, field) => {
    if (!rule) return null;
    if (!value) return null; // 空值由required处理
    if (!validator.isISO8601(value, { strict: true })) {
      return `${field}必须是有效的日期格式(ISO 8601)`;
    }
    return null;
  },

  /**
   * 自定义验证函数
   * @param {*} value - 待验证的值
   * @param {Function} rule - 自定义验证函数
   * @param {string} field - 字段名
   * @param {Object} allData - 所有数据（用于跨字段验证）
   * @returns {string|null} 错误信息或null
   */
  custom: (value, rule, field, allData) => {
    if (typeof rule !== 'function') return null;
    try {
      const result = rule(value, allData, field);
      // 如果返回字符串，视为错误信息
      if (typeof result === 'string') {
        return result;
      }
      // 如果返回false，使用默认错误信息
      if (result === false) {
        return `${field}验证失败`;
      }
      // 返回true或undefined视为验证通过
      return null;
    } catch (error) {
      console.error(`自定义验证函数执行错误 (${field}):`, error);
      return `${field}验证过程发生错误`;
    }
  },

  /**
   * 文件大小验证（字节）
   * @param {number} value - 文件大小（字节）
   * @param {number} rule - 最大文件大小（字节）
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  fileSize: (value, rule, field) => {
    if (rule === undefined) return null;
    if (!value && value !== 0) return null; // 空值由required处理
    if (typeof value !== 'number') {
      return `${field}必须是数字类型`;
    }
    if (value > rule) {
      const maxMB = (rule / (1024 * 1024)).toFixed(2);
      return `${field}不能超过${maxMB}MB`;
    }
    return null;
  },

  /**
   * 文件类型验证（扩展名）
   * @param {string} value - 文件名或扩展名
   * @param {Array} rule - 允许的扩展名数组 ['.pdf', '.docx']
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  fileType: (value, rule, field) => {
    if (!rule || !Array.isArray(rule)) return null;
    if (!value) return null; // 空值由required处理
    if (typeof value !== 'string') {
      return `${field}必须是字符串类型`;
    }
    // 提取文件扩展名
    const ext = value.toLowerCase().match(/\.[^.]+$/);
    if (!ext || !rule.includes(ext[0])) {
      return `${field}类型必须是以下之一: ${rule.join(', ')}`;
    }
    return null;
  },

  /**
   * 数组长度验证
   * @param {Array} value - 待验证的数组
   * @param {Object} rule - 长度配置 { min: number, max: number }
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  arrayLength: (value, rule, field) => {
    if (!rule) return null;
    if (!value) return null; // 空值由required处理
    if (!Array.isArray(value)) {
      return `${field}必须是数组类型`;
    }
    if (rule.min !== undefined && value.length < rule.min) {
      return `${field}至少需要${rule.min}个元素`;
    }
    if (rule.max !== undefined && value.length > rule.max) {
      return `${field}最多只能有${rule.max}个元素`;
    }
    return null;
  },

  /**
   * 密码强度验证（必须包含字母和数字）
   * @param {string} value - 待验证的密码
   * @param {boolean} rule - 是否验证密码强度
   * @param {string} field - 字段名
   * @returns {string|null} 错误信息或null
   */
  password: (value, rule, field) => {
    if (!rule) return null;
    if (!value) return null; // 空值由required处理
    if (typeof value !== 'string') {
      return `${field}必须是字符串类型`;
    }
    // 必须包含至少一个字母和一个数字
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    if (!hasLetter || !hasNumber) {
      return `${field}必须包含字母和数字`;
    }
    return null;
  }
};

/**
 * 验证单个字段的所有规则
 * @param {*} value - 字段值
 * @param {Object} rules - 验证规则对象
 * @param {string} fieldName - 字段名
 * @param {Object} allData - 所有数据（用于自定义验证）
 * @returns {Array<string>} 错误信息数组
 */
function validateField(value, rules, fieldName, allData) {
  const errors = [];

  // 遍历该字段的所有验证规则
  for (const [ruleName, ruleValue] of Object.entries(rules)) {
    const validatorFunc = validators[ruleName];

    if (!validatorFunc) {
      console.warn(`未知的验证规则: ${ruleName}`);
      continue;
    }

    const error = validatorFunc(value, ruleValue, fieldName, allData);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * 验证中间件工厂函数
 * @param {Object} schema - 验证模式配置
 * @param {Object} schema.body - 请求体验证规则
 * @param {Object} schema.params - 路径参数验证规则
 * @param {Object} schema.query - 查询参数验证规则
 * @returns {Function} Express中间件函数
 *
 * @example
 * // 基本用法
 * const schema = {
 *   body: {
 *     email: { required: true, email: true },
 *     password: { required: true, minLength: 8, password: true }
 *   }
 * };
 * router.post('/register', validate(schema), controller);
 *
 * @example
 * // 使用自定义验证
 * const schema = {
 *   body: {
 *     password: { required: true },
 *     confirmPassword: {
 *       required: true,
 *       custom: (value, allData) => {
 *         if (value !== allData.password) {
 *           return '两次输入的密码不一致';
 *         }
 *         return true;
 *       }
 *     }
 *   }
 * };
 */
function validate(schema) {
  return (req, res, next) => {
    const allErrors = [];

    // 验证各个数据源
    const sources = ['body', 'params', 'query'];

    for (const source of sources) {
      if (!schema[source]) continue;

      const data = req[source];
      const rules = schema[source];

      // 验证该数据源的所有字段
      for (const [fieldName, fieldRules] of Object.entries(rules)) {
        const value = data[fieldName];
        const errors = validateField(value, fieldRules, fieldName, data);

        if (errors.length > 0) {
          allErrors.push(
            ...errors.map((error) => ({
              field: fieldName,
              location: source,
              message: error
            }))
          );
        }
      }
    }

    // 如果有验证错误，返回400响应
    if (allErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: allErrors
      });
    }

    // 验证通过，继续处理
    next();
  };
}

/**
 * 预定义的验证模式 - 用户注册
 * 符合data-model.md的用户验证规则
 */
const userRegisterSchema = {
  body: {
    email: {
      required: true,
      email: true,
      maxLength: 255
    },
    password: {
      required: true,
      minLength: 8,
      password: true // 必须包含字母和数字
    }
  }
};

/**
 * 预定义的验证模式 - 用户登录
 */
const userLoginSchema = {
  body: {
    email: {
      required: true,
      email: true
    },
    password: {
      required: true
    }
  }
};

/**
 * 预定义的验证模式 - 创建目标岗位
 * 符合data-model.md的目标岗位验证规则
 */
const positionCreateSchema = {
  body: {
    name: {
      required: true,
      minLength: 1,
      maxLength: 100
    },
    description: {
      maxLength: 2000
    }
  }
};

/**
 * 预定义的验证模式 - 创建简历版本
 * 符合data-model.md的简历版本验证规则
 */
const resumeCreateSchema = {
  body: {
    target_position_id: {
      required: true,
      uuid: true
    },
    type: {
      required: true,
      enum: ['file', 'online']
    },
    title: {
      required: true,
      minLength: 1,
      maxLength: 200
    },
    file_path: {
      custom: (value, allData) => {
        // file类型必须有file_path
        if (allData.type === 'file' && !value) {
          return '文件类型简历必须提供文件路径';
        }
        return true;
      }
    },
    file_name: {
      custom: (value, allData) => {
        if (allData.type === 'file' && value) {
          // 验证文件类型
          const ext = value.toLowerCase().match(/\.[^.]+$/);
          if (!ext || !['.pdf', '.docx', '.doc'].includes(ext[0])) {
            return '文件类型必须是 .pdf, .docx 或 .doc';
          }
        }
        return true;
      }
    },
    file_size: {
      custom: (value, allData) => {
        if (allData.type === 'file' && value) {
          // 文件大小限制 10MB
          const maxSize = 10 * 1024 * 1024;
          if (value > maxSize) {
            return '文件大小不能超过10MB';
          }
        }
        return true;
      }
    },
    content: {
      custom: (value, allData) => {
        // online类型必须提供content字段（允许空字符串，用户可以在编辑器中填充）
        if (allData.type === 'online' && (value === undefined || value === null)) {
          return '在线简历必须提供content字段';
        }
        return true;
      }
    }
  }
};

/**
 * 预定义的验证模式 - 创建投递记录
 * 符合data-model.md的投递记录验证规则
 */
const applicationCreateSchema = {
  body: {
    resume_id: {
      required: true,
      uuid: true
    },
    company_name: {
      required: true,
      minLength: 1,
      maxLength: 200
    },
    position_title: {
      maxLength: 200
    },
    apply_date: {
      required: true,
      date: true,
      custom: (value) => {
        // 投递日期不能为未来日期
        const applyDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // 设置为今天的结束时间
        if (applyDate > today) {
          return '投递日期不能为未来日期';
        }
        return true;
      }
    },
    status: {
      enum: ['已投递', '面试邀请', '已拒绝', '已录用']
    },
    notes: {
      maxLength: 2000
    }
  }
};

/**
 * 预定义的验证模式 - UUID参数
 * 用于验证路径参数中的UUID
 */
const uuidParamSchema = {
  params: {
    id: {
      required: true,
      uuid: true
    }
  }
};

// 导出验证中间件和预定义模式
module.exports = {
  validate,
  validators,
  // 预定义的验证模式
  schemas: {
    userRegister: userRegisterSchema,
    userLogin: userLoginSchema,
    positionCreate: positionCreateSchema,
    resumeCreate: resumeCreateSchema,
    applicationCreate: applicationCreateSchema,
    uuidParam: uuidParamSchema
  }
};
