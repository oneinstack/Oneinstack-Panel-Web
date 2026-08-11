import 'tools-css/index.css'
import 'tools-javascript'
// 程序式组件不会出现在模板中，生产构建无法通过按需扫描自动补齐样式。
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import { createApp } from 'vue'

import App from './App.vue'
import './styles/index.less'
import Config from './utils/Config'

const app = createApp(App)
//#ifvar-dev
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
app.use(ElementPlus)

//#endvar
Config.init(app)
