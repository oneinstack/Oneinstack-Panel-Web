import 'tools-javascript'
import '@/styles/css/main.css'
import 'element-plus/dist/index.css'; // 确保引入样式文件

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from '@/locales'
import ElementPlus from 'element-plus';

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus); // 使用 Element Plus
app.mount('#app')
