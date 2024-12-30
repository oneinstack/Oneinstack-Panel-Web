import 'tools-css/index.css'
import 'tools-javascript'
import 'tools-websocket'
import { createApp } from 'vue'
import App from './App.vue'
import './styles/index.less'
import Config from './utils/Config'

Config.init(createApp(App))
