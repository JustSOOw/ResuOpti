// ESLint 9+ 扁平化配置 (Flat Config) - Vue 3 + TypeScript
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  // 推荐的基础规则
  js.configs.recommended,

  // Vue 推荐规则
  ...vuePlugin.configs['flat/recommended'],

  // 全局配置
  {
    files: ['**/*.{js,ts,vue}'],
    ignores: ['node_modules', 'dist', 'build', '.vscode', 'public', 'cypress.config.ts'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: false
        }
      },
      globals: {
        // 浏览器全局变量
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Vite 全局变量
        import: 'readonly'
      }
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      vue: vuePlugin,
      prettier
    },

    rules: {
      // Prettier 集成
      'prettier/prettier': 'error',

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // 注意：以下规则需要类型信息，暂时禁用
      // '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      // '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false
        }
      ],

      // Vue 特定规则
      'vue/multi-word-component-names': 'off', // 允许单词组件名
      'vue/no-v-html': 'warn', // 警告使用 v-html (XSS 风险)
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/custom-event-name-casing': ['error', 'camelCase'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/no-unused-components': 'error',
      'vue/no-unused-vars': 'error',
      // 注意：vue/no-setup-props-destructure 在某些版本中可能不可用
      // 'vue/no-setup-props-destructure': 'error', // 防止 props 解构丢失响应性
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style']
        }
      ],
      'vue/padding-line-between-blocks': ['error', 'always'],

      // 通用代码质量规则
      'no-console': 'warn', // 前端警告 console.log
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-undef': 'error',

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
      'require-await': 'warn',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // 数组和对象
      'no-sparse-arrays': 'error',
      'no-array-constructor': 'error',
      'array-callback-return': 'error',

      // 复杂度控制
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 3],
      'max-params': ['warn', 5],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }]
    }
  },

  // TypeScript 文件特定规则
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-undef': 'off' // TypeScript 会处理未定义变量
    }
  },

  // 测试文件特殊规则
  {
    files: ['tests/**/*.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}', 'cypress/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        it: 'readonly',
        cy: 'readonly',
        Cypress: 'readonly'
      }
    },
    rules: {
      'no-unused-expressions': 'off',
      'max-nested-callbacks': 'off',
      'max-params': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // Prettier 配置必须放在最后
  prettierConfig
]
