import { defineStore } from "pinia";
import piniaPersistConfig from "../helper/persist";
import System from "@/utils/System";
import { SESSION_LOGOUT_EVENT } from "@/utils/session";

interface PanelEntryAccess {
  enabled: boolean;
  path: string;
}

interface ConfigState {
  userInfo: any;
  menuAccess: Record<string, boolean>;
  scopeAccess: Record<string, Record<string, boolean>>;
  actionAccess: Record<string, boolean>;
  panelEntryAccess: PanelEntryAccess | null;
}

const createState = (): ConfigState => ({
  userInfo: null,
  menuAccess: {},
  scopeAccess: {},
  actionAccess: {},
  panelEntryAccess: null,
});

export const useConfigStore = defineStore("config", {
  state: createState,
  persist: [
    piniaPersistConfig<ConfigState>(
      "oneinstack_config_session",
      sessionStorage,
      ["userInfo", "menuAccess", "scopeAccess", "actionAccess"],
    ),
    piniaPersistConfig<ConfigState>(
      "oneinstack_panel_entry_access",
      localStorage,
      ["panelEntryAccess"],
    ),
  ],
  actions: {
    /** 保存登录用户。 */
    login(info: any) {
      this.userInfo = info;
    },

    setMenuAccess(menu: Record<string, boolean>) {
      this.menuAccess = menu || {};
    },

    setScopeAccess(scopes: Record<string, Record<string, boolean>>) {
      this.scopeAccess = scopes || {};
    },

    setActionAccess(actions: Record<string, boolean>) {
      this.actionAccess = actions || {};
    },

    setAccessMatrix(matrix: any) {
      this.setMenuAccess(matrix?.menu || {});
      this.setScopeAccess(matrix?.scopes || {});
      this.setActionAccess(matrix?.actions || {});
    },

    hasMenuAccess(key?: string) {
      if (!key || this.isAdministrator()) return true;
      return Boolean(this.menuAccess?.[key]);
    },

    hasScopeAccess(scope?: string, action?: string) {
      if (!scope || !action || this.isAdministrator()) return true;
      return Boolean(this.scopeAccess?.[scope]?.[action]);
    },

    hasActionAccess(key?: string) {
      if (!key || this.isAdministrator()) return true;
      return Boolean(this.actionAccess?.[key]);
    },

    setPanelEntryAccess(access: { enabled: boolean; path?: string }) {
      this.panelEntryAccess = {
        enabled: Boolean(access.enabled),
        path: access.path || "",
      };
    },

    /** 清理当前会话状态并按需返回登录页。 */
    logout(toLogin = false) {
      window.dispatchEvent(new Event(SESSION_LOGOUT_EVENT));
      this.userInfo = null;
      this.menuAccess = {};
      this.scopeAccess = {};
      this.actionAccess = {};

      if (toLogin) {
        setTimeout(() => {
          System.router.push("/login");
        }, 300);
      }
    },

    isAdministrator() {
      return Boolean(
        this.userInfo?.user?.isAdmin || this.userInfo?.user?.isSuperAdmin,
      );
    },
  },
});
