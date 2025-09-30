/**
 * 应用入口文件
 * 配置Vue实例和全局插件
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import router from './router'
import App from './App.vue'
import './styles/theme.scss'
import './styles/global.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
