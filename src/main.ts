import "tools-css/index.css";
import "tools-javascript";
import "tools-websocket";
import { createApp } from "vue";

import App from "./App.vue";
import "./styles/index.less";
import Config from "./utils/Config";
import i18n from "@/lang/index";
import directives from "@/directives/index";
const app = createApp(App);
//#ifvar-dev
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as Icons from "@element-plus/icons-vue";
import { createTerminal } from "vue-web-terminal";
Object.keys(Icons).forEach((key) => {
  app.component(key, Icons[key as keyof typeof Icons]);
});
app.use(ElementPlus);
app.use(directives);
// 全局注册 Terminal 组件
app.use(createTerminal());
app.use(i18n);
//#endvar
Config.init(app);
