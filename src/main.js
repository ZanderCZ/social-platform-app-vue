import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from '@/components/router/index'
import App from './App.vue'

import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

// 先使用插件
app.use(ElementPlus)
app.use(pinia)
app.use(router)

// 最后才挂载
app.mount('#app')