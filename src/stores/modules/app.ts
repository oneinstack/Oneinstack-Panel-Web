import { defineStore } from "pinia";
import piniaPersistConfig from "../helper/persist";
import {
  applyThemeAppearance,
  DEFAULT_THEME_ACCENT,
  normalizeThemeAccent,
  type PageTheme,
} from "@/utils/theme";

interface AppState {
  theme: PageTheme;
  accentColor: string;
}

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    theme: "light",
    accentColor: DEFAULT_THEME_ACCENT,
  }),
  persist: piniaPersistConfig<AppState>("oneinstack_app", localStorage, [
    "theme",
    "accentColor",
  ]),
  actions: {
    /** 应用插件恢复后的页面主题。 */
    initializeAppearance() {
      this.theme = this.theme === "dark" ? "dark" : "light";
      this.accentColor = normalizeThemeAccent(this.accentColor);
      applyThemeAppearance(this.theme, this.accentColor);
    },

    setTheme(theme: PageTheme) {
      this.theme = theme;
      applyThemeAppearance(theme, this.accentColor);
    },

    setAccentColor(color: string) {
      this.accentColor = normalizeThemeAccent(color);
      applyThemeAppearance(this.theme, this.accentColor);
    },

    resetAppearance() {
      this.theme = "light";
      this.accentColor = DEFAULT_THEME_ACCENT;
      applyThemeAppearance(this.theme, this.accentColor);
    },
  },
});
