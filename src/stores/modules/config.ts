import { defineStore } from "pinia";
import piniaPersistConfig from "../helper/persist";
import System from "@/utils/System";
import { SESSION_LOGOUT_EVENT } from "@/utils/session";

interface PanelEntryAccess {
  enabled: boolean;
  path: string;
}

interface AccessMenuNode {
  key: string;
  type?: string;
  enabled?: boolean;
  children?: AccessMenuNode[];
}

interface ConfigState {
  userInfo: any;
  menuAccess: Record<string, boolean>;
  scopeAccess: Record<string, Record<string, boolean>>;
  actionAccess: Record<string, boolean>;
  menuTree: AccessMenuNode[];
  firstAccessibleMenu: string;
  panelEntryAccess: PanelEntryAccess | null;
  panelTitle: string;
  hiddenMenuPathsByUser: Record<string, string[]>;
}

const getUserKey = (info: any) =>
  String(info?.user?.username || info?.username || "").trim();

const createState = (): ConfigState => ({
  userInfo: null,
  menuAccess: {},
  scopeAccess: {},
  actionAccess: {},
  menuTree: [],
  firstAccessibleMenu: "",
  panelEntryAccess: null,
  panelTitle: "",
  hiddenMenuPathsByUser: {},
});

const flattenMenuAccess = (nodes: AccessMenuNode[] = [], target: Record<string, boolean> = {}) => {
  nodes.forEach((node) => {
    if (!node?.key) return;
    if (node.enabled !== false) {
      target[node.key] = true;
    }
    if (node.children?.length) {
      flattenMenuAccess(node.children, target);
    }
  });
  return target;
};

export const useConfigStore = defineStore("config", {
  state: createState,
  getters: {
    hiddenMenuPaths: (state) => {
      const userKey = getUserKey(state.userInfo);
      return userKey ? state.hiddenMenuPathsByUser[userKey] || [] : [];
    },
  },
  persist: [
    piniaPersistConfig<ConfigState>(
      "oneinstack_config_session",
      sessionStorage,
      ["userInfo", "menuAccess", "scopeAccess", "actionAccess"],
    ),
    piniaPersistConfig<ConfigState>(
      "oneinstack_panel_entry_access",
      localStorage,
      ["panelEntryAccess", "panelTitle", "hiddenMenuPathsByUser"],
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
      const menuTree = Array.isArray(matrix?.menuTree) ? matrix.menuTree : [];
      this.menuTree = menuTree;
      this.firstAccessibleMenu = String(matrix?.firstAccessibleMenu || "").trim();
      this.setMenuAccess(Object.keys(matrix?.menu || {}).length ? matrix.menu : flattenMenuAccess(menuTree));
      this.setScopeAccess(matrix?.scopes || {});
      this.setActionAccess(matrix?.actions || {});
    },

    hasMenuAccess(key?: string) {
      if (!key || this.isAdministrator()) return true;
      if (Boolean(this.menuAccess?.[key])) return true;
      const stack = [...(this.menuTree || [])];
      while (stack.length) {
        const node = stack.shift();
        if (!node) continue;
        if (node.key === key) return node.enabled !== false;
        if (node.children?.length) stack.unshift(...node.children);
      }
      return false;
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

    setPanelTitle(title?: string | null) {
      this.panelTitle = String(title || "").trim();
    },

    isMenuHidden(path?: string) {
      return Boolean(path && this.hiddenMenuPaths.includes(path));
    },

    setMenuHidden(path: string, hidden: boolean) {
      const userKey = getUserKey(this.userInfo);
      if (!path || !userKey) return;
      const paths = new Set(this.hiddenMenuPaths);
      if (hidden) paths.add(path);
      else paths.delete(path);
      this.hiddenMenuPathsByUser = {
        ...this.hiddenMenuPathsByUser,
        [userKey]: Array.from(paths),
      };
    },

    clearHiddenMenus() {
      const userKey = getUserKey(this.userInfo);
      if (!userKey) return;
      const pathsByUser = { ...this.hiddenMenuPathsByUser };
      delete pathsByUser[userKey];
      this.hiddenMenuPathsByUser = pathsByUser;
    },

    /** 清理当前会话状态并按需返回登录页。 */
    logout(toLogin = false) {
      window.dispatchEvent(new Event(SESSION_LOGOUT_EVENT));
      this.userInfo = null;
      this.menuAccess = {};
      this.scopeAccess = {};
      this.actionAccess = {};
      this.menuTree = [];
      this.firstAccessibleMenu = "";

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
