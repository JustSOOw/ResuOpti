/**
 * 请求数据验证中间件单元测试
 * 测试所有验证规则和边界情况
 */

const { validate, validators, schemas } = require('../../../src/middleware/validation');

describe('Validation Middleware - validators', () => {
  describe('required validator', () => {
    it('应该验证必填字段为空', () => {
      const error = validators.required(undefined, true, '字段名');
      expect(error).toBe('字段名是必需字段');
    });

    it('应该验证必填字段为null', () => {
      const error = validators.required(null, true, '字段名');
      expect(error).toBe('字段名是必需字段');
    });

    it('应该验证必填字段为空字符串', () => {
      const error = validators.required('', true, '字段名');
      expect(error).toBe('字段名是必需字段');
    });

    it('应该验证必填字段为空白字符串', () => {
      const error = validators.required('   ', true, '字段名');
      expect(error).toBe('字段名不能为空');
    });

    it('应该验证必填字段通过', () => {
      const error = validators.required('value', true, '字段名');
      expect(error).toBeNull();
    });

    it('当规则为false时应该跳过验证', () => {
      const error = validators.required(undefined, false, '字段名');
      expect(error).toBeNull();
    });
  });

  describe('email validator', () => {
    it('应该拒绝无效的邮箱格式', () => {
      const error = validators.email('invalid-email', true, '邮箱');
      expect(error).toBe('邮箱格式无效，请输入有效的邮箱地址');
    });

    it('应该拒绝缺少@符号的邮箱', () => {
      const error = validators.email('testemail.com', true, '邮箱');
      expect(error).toBe('邮箱格式无效，请输入有效的邮箱地址');
    });

    it('应该接受有效的邮箱格式', () => {
      const error = validators.email('test@example.com', true, '邮箱');
      expect(error).toBeNull();
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.email('', true, '邮箱');
      expect(error).toBeNull();
    });

    it('当规则为false时应该跳过验证', () => {
      const error = validators.email('invalid', false, '邮箱');
      expect(error).toBeNull();
    });
  });

  describe('minLength validator', () => {
    it('应该拒绝长度不足的字符串', () => {
      const error = validators.minLength('abc', 5, '密码');
      expect(error).toBe('密码长度不能少于5个字符');
    });

    it('应该接受符合最小长度的字符串', () => {
      const error = validators.minLength('abcde', 5, '密码');
      expect(error).toBeNull();
    });

    it('应该接受超过最小长度的字符串', () => {
      const error = validators.minLength('abcdefgh', 5, '密码');
      expect(error).toBeNull();
    });

    it('应该拒绝非字符串类型', () => {
      const error = validators.minLength(12345, 5, '密码');
      expect(error).toBe('密码必须是字符串类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.minLength('', 5, '密码');
      expect(error).toBeNull();
    });

    it('当规则为undefined时应该跳过验证', () => {
      const error = validators.minLength('abc', undefined, '密码');
      expect(error).toBeNull();
    });
  });

  describe('maxLength validator', () => {
    it('应该拒绝超长的字符串', () => {
      const error = validators.maxLength('abcdefgh', 5, '标题');
      expect(error).toBe('标题长度不能超过5个字符');
    });

    it('应该接受符合最大长度的字符串', () => {
      const error = validators.maxLength('abcde', 5, '标题');
      expect(error).toBeNull();
    });

    it('应该接受短于最大长度的字符串', () => {
      const error = validators.maxLength('abc', 5, '标题');
      expect(error).toBeNull();
    });

    it('应该拒绝非字符串类型', () => {
      const error = validators.maxLength(12345, 5, '标题');
      expect(error).toBe('标题必须是字符串类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.maxLength('', 5, '标题');
      expect(error).toBeNull();
    });

    it('当规则为undefined时应该跳过验证', () => {
      const error = validators.maxLength('abcdefgh', undefined, '标题');
      expect(error).toBeNull();
    });
  });

  describe('length validator', () => {
    it('应该拒绝长度不匹配的字符串', () => {
      const error = validators.length('abc', 5, '验证码');
      expect(error).toBe('验证码长度必须为5个字符');
    });

    it('应该接受精确长度的字符串', () => {
      const error = validators.length('abcde', 5, '验证码');
      expect(error).toBeNull();
    });

    it('应该拒绝非字符串类型', () => {
      const error = validators.length(12345, 5, '验证码');
      expect(error).toBe('验证码必须是字符串类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.length('', 5, '验证码');
      expect(error).toBeNull();
    });

    it('当规则为undefined时应该跳过验证', () => {
      const error = validators.length('abc', undefined, '验证码');
      expect(error).toBeNull();
    });
  });

  describe('pattern validator', () => {
    it('应该拒绝不匹配正则的值', () => {
      const pattern = /^[0-9]+$/;
      const error = validators.pattern('abc', pattern, '手机号');
      expect(error).toBe('手机号格式不符合要求');
    });

    it('应该接受匹配正则的值', () => {
      const pattern = /^[0-9]+$/;
      const error = validators.pattern('123456', pattern, '手机号');
      expect(error).toBeNull();
    });

    it('应该接受空值(由required处理)', () => {
      const pattern = /^[0-9]+$/;
      const error = validators.pattern('', pattern, '手机号');
      expect(error).toBeNull();
    });

    it('应该处理无效的规则配置', () => {
      const error = validators.pattern('abc', 'not-a-regex', '手机号');
      expect(error).toBe('手机号的验证规则配置错误');
    });

    it('当规则为null时应该跳过验证', () => {
      const error = validators.pattern('abc', null, '手机号');
      expect(error).toBeNull();
    });
  });

  describe('enum validator', () => {
    it('应该拒绝不在枚举列表中的值', () => {
      const error = validators.enum('pending', ['active', 'inactive'], '状态');
      expect(error).toBe('状态必须是以下值之一: active, inactive');
    });

    it('应该接受在枚举列表中的值', () => {
      const error = validators.enum('active', ['active', 'inactive'], '状态');
      expect(error).toBeNull();
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.enum('', ['active', 'inactive'], '状态');
      expect(error).toBeNull();
    });

    it('当规则不是数组时应该跳过验证', () => {
      const error = validators.enum('value', null, '状态');
      expect(error).toBeNull();
    });

    it('当规则为空数组时应该拒绝任何值', () => {
      const error = validators.enum('value', [], '状态');
      expect(error).toBe('状态必须是以下值之一: ');
    });
  });

  describe('min validator', () => {
    it('应该拒绝小于最小值的数字', () => {
      const error = validators.min(5, 10, '年龄');
      expect(error).toBe('年龄不能小于10');
    });

    it('应该接受等于最小值的数字', () => {
      const error = validators.min(10, 10, '年龄');
      expect(error).toBeNull();
    });

    it('应该接受大于最小值的数字', () => {
      const error = validators.min(15, 10, '年龄');
      expect(error).toBeNull();
    });

    it('应该接受0值', () => {
      const error = validators.min(0, 0, '数量');
      expect(error).toBeNull();
    });

    it('应该拒绝非数字类型', () => {
      const error = validators.min('10', 10, '年龄');
      expect(error).toBe('年龄必须是数字类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.min(null, 10, '年龄');
      expect(error).toBeNull();
    });

    it('当规则为undefined时应该跳过验证', () => {
      const error = validators.min(5, undefined, '年龄');
      expect(error).toBeNull();
    });
  });

  describe('max validator', () => {
    it('应该拒绝大于最大值的数字', () => {
      const error = validators.max(150, 100, '金额');
      expect(error).toBe('金额不能大于100');
    });

    it('应该接受等于最大值的数字', () => {
      const error = validators.max(100, 100, '金额');
      expect(error).toBeNull();
    });

    it('应该接受小于最大值的数字', () => {
      const error = validators.max(50, 100, '金额');
      expect(error).toBeNull();
    });

    it('应该接受0值', () => {
      const error = validators.max(0, 10, '数量');
      expect(error).toBeNull();
    });

    it('应该拒绝非数字类型', () => {
      const error = validators.max('100', 100, '金额');
      expect(error).toBe('金额必须是数字类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.max(null, 100, '金额');
      expect(error).toBeNull();
    });

    it('当规则为undefined时应该跳过验证', () => {
      const error = validators.max(150, undefined, '金额');
      expect(error).toBeNull();
    });
  });

  describe('url validator', () => {
    it('应该拒绝无效的URL', () => {
      const error = validators.url('not-a-url', true, '网址');
      expect(error).toBe('网址必须是有效的URL地址');
    });

    it('应该接受有效的HTTP URL', () => {
      const error = validators.url('http://example.com', true, '网址');
      expect(error).toBeNull();
    });

    it('应该接受有效的HTTPS URL', () => {
      const error = validators.url('https://example.com', true, '网址');
      expect(error).toBeNull();
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.url('', true, '网址');
      expect(error).toBeNull();
    });

    it('当规则为false时应该跳过验证', () => {
      const error = validators.url('not-a-url', false, '网址');
      expect(error).toBeNull();
    });
  });

  describe('uuid validator', () => {
    it('应该拒绝无效的UUID', () => {
      const error = validators.uuid('not-a-uuid', true, 'ID');
      expect(error).toBe('ID必须是有效的UUID格式');
    });

    it('应该接受有效的UUIDv4', () => {
      const error = validators.uuid('123e4567-e89b-12d3-a456-426614174000', true, 'ID');
      expect(error).toBeNull();
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.uuid('', true, 'ID');
      expect(error).toBeNull();
    });

    it('当规则为false时应该跳过验证', () => {
      const error = validators.uuid('not-a-uuid', false, 'ID');
      expect(error).toBeNull();
    });
  });

  describe('date validator', () => {
    it('应该拒绝无效的日期格式', () => {
      const error = validators.date('2023-13-01', true, '日期');
      expect(error).toBe('日期必须是有效的日期格式(ISO 8601)');
    });

    it('应该接受有效的ISO 8601日期', () => {
      const error = validators.date('2023-12-01', true, '日期');
      expect(error).toBeNull();
    });

    it('应该接受ISO 8601日期时间格式', () => {
      const error = validators.date('2023-12-01T10:30:00Z', true, '日期');
      expect(error).toBeNull();
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.date('', true, '日期');
      expect(error).toBeNull();
    });

    it('当规则为false时应该跳过验证', () => {
      const error = validators.date('invalid', false, '日期');
      expect(error).toBeNull();
    });
  });

  describe('custom validator', () => {
    it('应该执行自定义验证函数并返回错误信息', () => {
      const customFn = () => '自定义错误信息';
      const error = validators.custom('value', customFn, '字段');
      expect(error).toBe('自定义错误信息');
    });

    it('应该执行自定义验证函数并返回null(验证通过)', () => {
      const customFn = () => true;
      const error = validators.custom('value', customFn, '字段');
      expect(error).toBeNull();
    });

    it('应该处理返回false的自定义函数', () => {
      const customFn = () => false;
      const error = validators.custom('value', customFn, '字段');
      expect(error).toBe('字段验证失败');
    });

    it('应该传递所有数据给自定义函数', () => {
      const allData = { field1: 'value1', field2: 'value2' };
      const customFn = jest.fn(() => true);
      validators.custom('value', customFn, '字段', allData);
      expect(customFn).toHaveBeenCalledWith('value', allData, '字段');
    });

    it('应该处理自定义函数抛出的错误', () => {
      const customFn = () => {
        throw new Error('自定义函数错误');
      };
      const error = validators.custom('value', customFn, '字段');
      expect(error).toBe('字段验证过程发生错误');
    });

    it('当规则不是函数时应该跳过验证', () => {
      const error = validators.custom('value', 'not-a-function', '字段');
      expect(error).toBeNull();
    });
  });

  describe('fileSize validator', () => {
    it('应该拒绝超过限制的文件大小', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSize = 10 * 1024 * 1024; // 10MB
      const error = validators.fileSize(fileSize, maxSize, '文件');
      expect(error).toBe('文件不能超过5.00MB');
    });

    it('应该接受符合限制的文件大小', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const fileSize = 5 * 1024 * 1024; // 5MB
      const error = validators.fileSize(fileSize, maxSize, '文件');
      expect(error).toBeNull();
    });

    it('应该接受等于限制的文件大小', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSize = 5 * 1024 * 1024; // 5MB
      const error = validators.fileSize(fileSize, maxSize, '文件');
      expect(error).toBeNull();
    });

    it('应该接受0字节文件', () => {
      const error = validators.fileSize(0, 1024, '文件');
      expect(error).toBeNull();
    });

    it('应该拒绝非数字类型', () => {
      const error = validators.fileSize('10485760', 5242880, '文件');
      expect(error).toBe('文件必须是数字类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.fileSize(null, 1024, '文件');
      expect(error).toBeNull();
    });

    it('当规则为undefined时应该跳过验证', () => {
      const error = validators.fileSize(10485760, undefined, '文件');
      expect(error).toBeNull();
    });
  });

  describe('fileType validator', () => {
    it('应该拒绝不支持的文件类型', () => {
      const error = validators.fileType('document.txt', ['.pdf', '.docx'], '文件');
      expect(error).toBe('文件类型必须是以下之一: .pdf, .docx');
    });

    it('应该接受支持的文件类型(小写)', () => {
      const error = validators.fileType('document.pdf', ['.pdf', '.docx'], '文件');
      expect(error).toBeNull();
    });

    it('应该接受支持的文件类型(大写扩展名)', () => {
      const error = validators.fileType('document.PDF', ['.pdf', '.docx'], '文件');
      expect(error).toBeNull();
    });

    it('应该处理文件名中的多个点', () => {
      const error = validators.fileType('my.document.pdf', ['.pdf', '.docx'], '文件');
      expect(error).toBeNull();
    });

    it('应该拒绝没有扩展名的文件', () => {
      const error = validators.fileType('document', ['.pdf', '.docx'], '文件');
      expect(error).toBe('文件类型必须是以下之一: .pdf, .docx');
    });

    it('应该拒绝非字符串类型', () => {
      const error = validators.fileType(123, ['.pdf'], '文件');
      expect(error).toBe('文件必须是字符串类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.fileType('', ['.pdf'], '文件');
      expect(error).toBeNull();
    });

    it('当规则不是数组时应该跳过验证', () => {
      const error = validators.fileType('document.txt', null, '文件');
      expect(error).toBeNull();
    });
  });

  describe('arrayLength validator', () => {
    it('应该拒绝元素不足的数组', () => {
      const error = validators.arrayLength(['a', 'b'], { min: 3 }, '标签');
      expect(error).toBe('标签至少需要3个元素');
    });

    it('应该拒绝元素过多的数组', () => {
      const error = validators.arrayLength(['a', 'b', 'c', 'd'], { max: 3 }, '标签');
      expect(error).toBe('标签最多只能有3个元素');
    });

    it('应该接受符合长度限制的数组', () => {
      const error = validators.arrayLength(['a', 'b', 'c'], { min: 2, max: 5 }, '标签');
      expect(error).toBeNull();
    });

    it('应该接受空数组(如果最小值为0)', () => {
      const error = validators.arrayLength([], { min: 0, max: 5 }, '标签');
      expect(error).toBeNull();
    });

    it('应该拒绝非数组类型', () => {
      const error = validators.arrayLength('not-an-array', { min: 1 }, '标签');
      expect(error).toBe('标签必须是数组类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.arrayLength(null, { min: 1 }, '标签');
      expect(error).toBeNull();
    });

    it('当规则为null时应该跳过验证', () => {
      const error = validators.arrayLength(['a'], null, '标签');
      expect(error).toBeNull();
    });
  });

  describe('password validator', () => {
    it('应该拒绝只有字母的密码', () => {
      const error = validators.password('abcdefgh', true, '密码');
      expect(error).toBe('密码必须包含字母和数字');
    });

    it('应该拒绝只有数字的密码', () => {
      const error = validators.password('12345678', true, '密码');
      expect(error).toBe('密码必须包含字母和数字');
    });

    it('应该接受包含字母和数字的密码', () => {
      const error = validators.password('abc12345', true, '密码');
      expect(error).toBeNull();
    });

    it('应该接受包含大小写字母和数字的密码', () => {
      const error = validators.password('Abc12345', true, '密码');
      expect(error).toBeNull();
    });

    it('应该拒绝非字符串类型', () => {
      const error = validators.password(12345678, true, '密码');
      expect(error).toBe('密码必须是字符串类型');
    });

    it('应该接受空值(由required处理)', () => {
      const error = validators.password('', true, '密码');
      expect(error).toBeNull();
    });

    it('当规则为false时应该跳过验证', () => {
      const error = validators.password('onlyletters', false, '密码');
      expect(error).toBeNull();
    });
  });
});

describe('Validation Middleware - validate function', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('body validation', () => {
    it('应该验证body中的必填字段', () => {
      const schema = {
        body: {
          email: { required: true }
        }
      };
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求参数验证失败',
        errors: [
          {
            field: 'email',
            location: 'body',
            message: 'email是必需字段'
          }
        ]
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该验证通过并调用next', () => {
      const schema = {
        body: {
          email: { required: true, email: true }
        }
      };
      req.body.email = 'test@example.com';

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('应该收集多个字段的验证错误', () => {
      const schema = {
        body: {
          email: { required: true, email: true },
          password: { required: true, minLength: 8 }
        }
      };
      req.body.email = 'invalid-email';
      req.body.password = 'short';

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求参数验证失败',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            location: 'body'
          }),
          expect.objectContaining({
            field: 'password',
            location: 'body'
          })
        ])
      });
    });
  });

  describe('params validation', () => {
    it('应该验证params中的UUID', () => {
      const schema = {
        params: {
          id: { required: true, uuid: true }
        }
      };
      req.params.id = 'not-a-uuid';

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求参数验证失败',
        errors: [
          {
            field: 'id',
            location: 'params',
            message: 'id必须是有效的UUID格式'
          }
        ]
      });
    });

    it('应该验证通过有效的UUID', () => {
      const schema = {
        params: {
          id: { required: true, uuid: true }
        }
      };
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('query validation', () => {
    it('应该验证query中的枚举值', () => {
      const schema = {
        query: {
          status: { enum: ['active', 'inactive'] }
        }
      };
      req.query.status = 'pending';

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求参数验证失败',
        errors: [
          {
            field: 'status',
            location: 'query',
            message: 'status必须是以下值之一: active, inactive'
          }
        ]
      });
    });
  });

  describe('multiple sources validation', () => {
    it('应该同时验证body, params和query', () => {
      const schema = {
        body: {
          name: { required: true }
        },
        params: {
          id: { required: true, uuid: true }
        },
        query: {
          page: { required: true }
        }
      };

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求参数验证失败',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'name', location: 'body' }),
          expect.objectContaining({ field: 'id', location: 'params' }),
          expect.objectContaining({ field: 'page', location: 'query' })
        ])
      });
    });
  });

  describe('custom validation with cross-field dependencies', () => {
    it('应该验证密码确认字段', () => {
      const schema = {
        body: {
          password: { required: true },
          confirmPassword: {
            required: true,
            custom: (value, allData) => {
              if (value !== allData.password) {
                return '两次输入的密码不一致';
              }
              return true;
            }
          }
        }
      };
      req.body.password = 'password123';
      req.body.confirmPassword = 'password456';

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请求参数验证失败',
        errors: [
          {
            field: 'confirmPassword',
            location: 'body',
            message: '两次输入的密码不一致'
          }
        ]
      });
    });
  });
});

describe('Validation Middleware - predefined schemas', () => {
  describe('userRegisterSchema', () => {
    it('应该包含必需的邮箱和密码验证', () => {
      expect(schemas.userRegister.body.email).toEqual({
        required: true,
        email: true,
        maxLength: 255
      });
      expect(schemas.userRegister.body.password).toEqual({
        required: true,
        minLength: 8,
        password: true
      });
    });
  });

  describe('userLoginSchema', () => {
    it('应该包含邮箱和密码验证', () => {
      expect(schemas.userLogin.body.email).toEqual({
        required: true,
        email: true
      });
      expect(schemas.userLogin.body.password).toEqual({
        required: true
      });
    });
  });

  describe('positionCreateSchema', () => {
    it('应该包含岗位名称和描述验证', () => {
      expect(schemas.positionCreate.body.name).toEqual({
        required: true,
        minLength: 1,
        maxLength: 100
      });
      expect(schemas.positionCreate.body.description).toEqual({
        maxLength: 2000
      });
    });
  });

  describe('resumeCreateSchema', () => {
    it('应该包含简历版本基础字段验证', () => {
      expect(schemas.resumeCreate.body.target_position_id).toEqual({
        required: true,
        uuid: true
      });
      expect(schemas.resumeCreate.body.type).toEqual({
        required: true,
        enum: ['file', 'online']
      });
      expect(schemas.resumeCreate.body.title).toEqual({
        required: true,
        minLength: 1,
        maxLength: 200
      });
    });

    it('应该包含文件类型的自定义验证', () => {
      expect(schemas.resumeCreate.body.file_path.custom).toBeDefined();
      expect(schemas.resumeCreate.body.file_name.custom).toBeDefined();
      expect(schemas.resumeCreate.body.file_size.custom).toBeDefined();
      expect(schemas.resumeCreate.body.content.custom).toBeDefined();
    });
  });

  describe('applicationCreateSchema', () => {
    it('应该包含投递记录字段验证', () => {
      expect(schemas.applicationCreate.body.resume_id).toEqual({
        required: true,
        uuid: true
      });
      expect(schemas.applicationCreate.body.company_name).toEqual({
        required: true,
        minLength: 1,
        maxLength: 200
      });
      expect(schemas.applicationCreate.body.apply_date).toMatchObject({
        required: true,
        date: true
      });
      expect(schemas.applicationCreate.body.status).toEqual({
        enum: ['已投递', '面试邀请', '已拒绝', '已录用']
      });
    });
  });

  describe('uuidParamSchema', () => {
    it('应该包含UUID参数验证', () => {
      expect(schemas.uuidParam.params.id).toEqual({
        required: true,
        uuid: true
      });
    });
  });
});
