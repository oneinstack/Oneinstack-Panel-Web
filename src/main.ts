import 'tools-css/index.css'
import 'tools-javascript'
import 'tools-websocket'
import { createApp } from 'vue'

import App from './App.vue'
import './styles/index.less'
import Config from './utils/Config'


const app = createApp(App)
//#ifvar-dev
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createTerminal } from 'vue-web-terminal'
app.use(ElementPlus)
// 全局注册 Terminal 组件
app.use(createTerminal());

//#endvar
Config.init(app)

