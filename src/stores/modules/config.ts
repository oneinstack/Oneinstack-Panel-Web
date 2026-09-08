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
}

const normalizeUserInfo = (info: any) => {
  if (!info || typeof info !== "object") return info;
  if (info.user) return info;
  return {
    ...info,
    user: {
      ...info,
    },
  };
};

const createState = (): ConfigState => ({
  userInfo: null,
  menuAccess: {},
  scopeAccess: {},
  actionAccess: {},
  menuTree: [],
  firstAccessibleMenu: "",
  panelEntryAccess: null,
  panelTitle: "",
});

const flattenMenuAccess = (
  nodes: AccessMenuNode[] = [],
  target: Record<string, boolean> = {},
  parentEnabled = true
) => {
  nodes.forEach((node) => {
    if (!node?.key) return;
    const enabled = parentEnabled && node.enabled !== false;
    if (enabled) {
      target[node.key] = true;
    }
    if (node.children?.length) {
      flattenMenuAccess(node.children, target, enabled);
    }
  });
  return target;
};

const findMenuPath = (
  nodes: AccessMenuNode[] = [],
  key: string,
  parents: AccessMenuNode[] = []
): { node: AccessMenuNode; parents: AccessMenuNode[] } | null => {
  for (const node of nodes) {
    if (!node) continue;
    if (node.key === key) return { node, parents };
    if (node.children?.length) {
      const match = findMenuPath(node.children, key, [...parents, node]);
      if (match) return match;
    }
  }
  return null;
};

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
      ["panelEntryAccess", "panelTitle"],
    ),
  ],
  actions: {
    /** 保存登录用户。 */
    login(info: any) {
      this.userInfo = normalizeUserInfo(info);
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

    setUserAccessSnapshot(snapshot: any) {
      const menuTree = Array.isArray(snapshot?.menuTree)
        ? snapshot.menuTree
        : Array.isArray(snapshot?.user?.menuTree)
          ? snapshot.user.menuTree
          : [];
      const scopes = snapshot?.scopes || snapshot?.user?.scopes || {};
      const firstAccessibleMenu = String(
        snapshot?.firstAccessibleMenu || snapshot?.user?.firstAccessibleMenu || "",
      ).trim();
      if (menuTree.length) {
        this.menuTree = menuTree;
        this.setMenuAccess(flattenMenuAccess(menuTree));
      }
      if (firstAccessibleMenu) {
        this.firstAccessibleMenu = firstAccessibleMenu;
      }
      if (Object.keys(scopes).length) {
        this.setScopeAccess(scopes);
      }
    },

    hasMenuAccess(key?: string) {
      if (!key || this.isAdministrator()) return true;
      if (this.menuTree?.length) {
        const match = findMenuPath(this.menuTree, key);
        if (match) {
          return match.node.enabled !== false && match.parents.every((parent) => parent.enabled !== false);
        }
      }
      return Boolean(this.menuAccess?.[key]);
    },

    isMenuEnabled(key?: string) {
      if (!key) return true;
      const match = findMenuPath(this.menuTree, key);
      if (match) {
        return match.node.enabled !== false && match.parents.every((parent) => parent.enabled !== false);
      }
      if (Object.prototype.hasOwnProperty.call(this.menuAccess, key)) {
        return this.menuAccess[key] !== false;
      }
      return true;
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
