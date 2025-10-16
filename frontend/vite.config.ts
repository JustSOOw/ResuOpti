import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  build: {
    // 代码分割优化配置
    rollupOptions: {
      output: {
        // 手动配置代码分割策略
        manualChunks: {
          // Vue 核心库单独打包
          'vue-vendor': ['vue', 'vue-router', 'pinia'],

          // Element Plus UI库单独打包
          'element-plus': ['element-plus', '@element-plus/icons-vue'],

          // Tiptap 编辑器相关库单独打包（体积较大）
          'tiptap-editor': ['@tiptap/vue-3', '@tiptap/core', '@tiptap/starter-kit', '@tiptap/pm'],

          // 其他第三方库
          vendor: []
        },

        // 分块文件命名规则
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // 代码分割阈值（KB）
    chunkSizeWarningLimit: 1000,

    // 启用CSS代码分割
    cssCodeSplit: true,

    // 构建目标
    target: 'es2015',

    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        // 生产环境移除 console
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'element-plus', '@element-plus/icons-vue'],
    // 排除较大的可选依赖，让它们按需加载
    exclude: ['html2pdf.js']
  },

  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: false,
    open: false
  }
})
