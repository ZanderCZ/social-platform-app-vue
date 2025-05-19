// import './assets/main.css'

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)

// 先使用插件
app.use(ElementPlus)

// 最后才挂载
app.mount('#app')