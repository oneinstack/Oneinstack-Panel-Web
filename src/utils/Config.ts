import i18n from "@/lang";
import plugins from "@/plugins";
import { initRouter } from "@/router";
import pinia from "@/stores";
import { useAppStore } from "@/stores/modules/app";
import { App } from "vue";
import System from "./System";
import Components from "@/components";
import { clearChunkReloadFlag } from "./chunk-reload";
export default class Config {
  /**
   * 初始化
   */
  static async init(app: App) {
    // 初始化系统参数
    System.init();

    // 注册全局状态管理
    app.use(pinia);

    // 初始化插件
    app.use(plugins);

    // 初始化最后打包版本
    window.v = window.version = "#{version}";

    // 初始化i18n
    app.use(i18n as any);
    await i18n.setLang();

    // 应用持久化恢复后的主题配置
    useAppStore().initializeAppearance();

    // 初始化组件
    app.use(Components);

    // 初始化路由
    const router = initRouter();
    app.use(router);
    router.isReady().then(async () => {
      // 初始化完成
      app.mount("#app");
      clearChunkReloadFlag();
    });
  }
}
