import 'tools-css/index.css'
import 'tools-javascript'
import { createApp } from 'vue'
import App from './App.vue'
import './styles/index.less'
import Config from './utils/Config'
import Components from './components'

const app = createApp(App).use(Components)

Config.init(app)
