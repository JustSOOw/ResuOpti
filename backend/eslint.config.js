// ESLint 9+ 扁平化配置 (Flat Config)
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // 推荐的基础规则
  js.configs.recommended,

  // 全局配置
  {
    files: ['**/*.js'],
    ignores: ['node_modules', 'dist', 'build', 'coverage', 'uploads/*', '!uploads/.gitkeep'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js 全局变量
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        global: 'readonly',
        // Jest 测试全局变量
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        it: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly'
      }
    },

    plugins: {
      prettier
    },

    rules: {
      // Prettier 集成
      'prettier/prettier': 'error',

      // 代码质量规则
      'no-console': 'off', // 后端允许使用 console (使用 logger 更好)
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-var': 'error', // 禁止使用 var
      'prefer-const': 'error', // 优先使用 const
      'no-undef': 'error', // 禁止使用未定义的变量
      'no-use-before-define': ['error', { functions: false, classes: true }],

      // 代码风格规则
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',

      // 最佳实践
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-return-await': 'error',
      'require-await': 'warn',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // 错误处理
      'no-ex-assign': 'error',
      'no-unsafe-finally': 'error',

      // Node.js 特定规则
      'no-path-concat': 'error', // 禁止使用 __dirname + '/file' 这种拼接方式
      'handle-callback-err': 'error',

      // 数组和对象
      'no-sparse-arrays': 'error',
      'no-array-constructor': 'error',
      'array-callback-return': 'error',

      // 复杂度控制
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 3],
      'max-params': ['warn', 5]
    }
  },

  // 测试文件特殊规则
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-unused-expressions': 'off', // 测试中常用的断言表达式
      'max-nested-callbacks': 'off', // 测试中的嵌套回调很常见
      'max-params': 'off' // 测试函数可以有更多参数
    }
  },

  // Prettier 配置必须放在最后，禁用冲突的规则
  prettierConfig
];
