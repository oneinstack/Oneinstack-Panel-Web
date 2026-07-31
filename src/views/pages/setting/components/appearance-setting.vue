<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue'
import { ElMessage } from 'element-plus'
import sapp from '@/sstore/sapp'
import {
  DEFAULT_THEME_ACCENT,
  THEME_ACCENT_PRESETS,
  normalizeThemeAccent,
  type PageTheme
} from '@/utils/theme'

const { theme, accentColor } = toRefs(sapp)
const customColor = ref(accentColor.value)

const isCustomColor = computed(
  () => !THEME_ACCENT_PRESETS.some(item => item.color === accentColor.value)
)

watch(accentColor, value => {
  customColor.value = value
})

const changeMode = (value: PageTheme) => {
  if (value !== theme.value) sapp.setTheme(value)
}

const changeAccent = (value: string) => {
  sapp.setAccentColor(value)
}

const changeCustomAccent = (value: string | null) => {
  if (!value) return
  changeAccent(normalizeThemeAccent(value))
}

const resetAppearance = () => {
  sapp.resetAppearance()
  customColor.value = DEFAULT_THEME_ACCENT
  ElMessage.success('已恢复默认外观')
}
</script>

<template>
  <section class="appearance-setting">
    <header class="appearance-setting__header">
      <div>
        <span class="appearance-setting__eyebrow">APPEARANCE</span>
        <h2>外观与主题</h2>
        <p>统一调整整个面板的界面模式和强调色，修改后立即生效并在当前浏览器中保存。</p>
      </div>
      <el-button plain @click="resetAppearance">恢复默认</el-button>
    </header>

    <div class="appearance-setting__content">
      <div class="appearance-option">
        <div class="appearance-option__heading">
          <div>
            <h3>界面模式</h3>
            <p>浅色适合明亮环境，深色适合夜间或低亮度屏幕。</p>
          </div>
          <span>{{ theme === 'dark' ? '当前：深色' : '当前：浅色' }}</span>
        </div>

        <div class="mode-grid">
          <button
            type="button"
            class="mode-card mode-card--light"
            :class="{ active: theme === 'light' }"
            @click="changeMode('light')"
          >
            <span class="mode-card__preview">
              <i></i>
              <b></b>
              <em></em>
            </span>
            <span class="mode-card__copy">
              <strong>浅色模式</strong>
              <small>清晰明亮</small>
            </span>
            <span v-if="theme === 'light'" class="mode-card__check">✓</span>
          </button>

          <button
            type="button"
            class="mode-card mode-card--dark"
            :class="{ active: theme === 'dark' }"
            @click="changeMode('dark')"
          >
            <span class="mode-card__preview">
              <i></i>
              <b></b>
              <em></em>
            </span>
            <span class="mode-card__copy">
              <strong>深色模式</strong>
              <small>沉浸护眼</small>
            </span>
            <span v-if="theme === 'dark'" class="mode-card__check">✓</span>
          </button>
        </div>
      </div>

      <div class="appearance-option">
        <div class="appearance-option__heading">
          <div>
            <h3>主题颜色</h3>
            <p>按钮、导航选中态、链接、分页和表单焦点会同步使用所选颜色。</p>
          </div>
          <span class="current-accent">
            <i :style="{ background: accentColor }"></i>
            {{ accentColor }}
          </span>
        </div>

        <div class="accent-grid">
          <button
            v-for="item in THEME_ACCENT_PRESETS"
            :key="item.color"
            type="button"
            class="accent-card"
            :class="{ active: accentColor === item.color }"
            @click="changeAccent(item.color)"
          >
            <span class="accent-card__color" :style="{ background: item.color }">
              <i v-if="accentColor === item.color">✓</i>
            </span>
            <span>
              <strong>{{ item.name }}</strong>
              <small>{{ item.description }}</small>
            </span>
          </button>

          <div class="accent-card accent-card--custom" :class="{ active: isCustomColor }">
            <el-color-picker
              v-model="customColor"
              color-format="hex"
              :predefine="THEME_ACCENT_PRESETS.map(item => item.color)"
              @change="changeCustomAccent"
            />
            <span>
              <strong>自定义颜色</strong>
              <small>选择任意符合习惯的品牌色</small>
            </span>
          </div>
        </div>
      </div>

      <div class="theme-preview">
        <div class="theme-preview__copy">
          <span>实时预览</span>
          <strong>OneinStack Panel</strong>
          <p>主题色会应用到整个管理面板，不会改变成功、警告和错误等状态颜色。</p>
        </div>
        <div class="theme-preview__actions">
          <button type="button">次要操作</button>
          <button type="button" class="primary">主要操作</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.appearance-setting {
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.appearance-setting__header {
  padding: 24px 26px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid var(--border-subtle);
  background:
    radial-gradient(circle at 100% 0, rgba(var(--primary-color), 0.09), transparent 280px),
    var(--surface-card);

  h2 {
    margin: 4px 0 0;
    color: var(--text-primary);
    font-size: 21px;
    font-weight: 720;
    letter-spacing: -0.02em;
  }

  p {
    margin-top: 8px;
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.appearance-setting__eyebrow {
  color: rgb(var(--primary-color));
  font-size: 10px;
  font-weight: 760;
  letter-spacing: 0.16em;
}

.appearance-setting__content {
  padding: 26px;
  display: grid;
  gap: 28px;
}

.appearance-option {
  display: grid;
  gap: 16px;
}

.appearance-option__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;

  h3 {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 680;
  }

  p {
    margin-top: 5px;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  > span {
    flex: 0 0 auto;
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.mode-card {
  position: relative;
  min-height: 102px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 15px;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: 13px;
  color: var(--text-secondary);
  background: var(--surface-subtle);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    border-color: var(--border-strong);
    transform: translateY(-1px);
  }

  &.active {
    border-color: rgba(var(--primary-color), 0.55);
    box-shadow:
      0 0 0 3px rgba(var(--primary-color), 0.09),
      var(--shadow-sm);
  }
}

.mode-card__preview {
  position: relative;
  width: 96px;
  height: 68px;
  flex: 0 0 96px;
  overflow: hidden;
  border-radius: 9px;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.2);

  i,
  b,
  em {
    position: absolute;
    display: block;
    border-radius: 4px;
  }

  i {
    inset: 0 auto 0 0;
    width: 24px;
    border-radius: 0;
  }

  b {
    top: 11px;
    right: 10px;
    width: 52px;
    height: 9px;
  }

  em {
    right: 10px;
    bottom: 10px;
    width: 52px;
    height: 31px;
  }
}

.mode-card--light .mode-card__preview {
  background: #f8fafc;

  i {
    background: #ffffff;
  }

  b {
    background: v-bind(accentColor);
  }

  em {
    background: #e9edf3;
  }
}

.mode-card--dark .mode-card__preview {
  background: #0b1120;

  i {
    background: #172033;
  }

  b {
    background: v-bind(accentColor);
  }

  em {
    background: #243044;
  }
}

.mode-card__copy {
  display: grid;
  gap: 5px;

  strong {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 660;
  }

  small {
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.mode-card__check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: rgb(var(--primary-color));
  font-size: 12px;
  font-weight: 800;
}

.current-accent {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;

  i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.1);
  }
}

.accent-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.accent-card {
  min-height: 76px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  color: var(--text-secondary);
  background: var(--surface-subtle);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: var(--border-strong);
    background: var(--surface-muted);
  }

  &.active {
    border-color: rgba(var(--primary-color), 0.5);
    background: rgba(var(--primary-color), 0.055);
    box-shadow: 0 0 0 2px rgba(var(--primary-color), 0.07);
  }

  > span:last-child {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
  }

  small {
    overflow: hidden;
    color: var(--text-tertiary);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.accent-card__color {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border: 4px solid var(--surface-card);
  border-radius: 11px;
  color: #ffffff;
  box-shadow: 0 0 0 1px var(--border-default);

  i {
    font-size: 12px;
    font-style: normal;
    font-weight: 800;
  }
}

.accent-card--custom {
  cursor: default;

  :deep(.el-color-picker__trigger) {
    width: 34px;
    height: 34px;
    padding: 3px;
    border-color: var(--border-default);
    border-radius: 11px;
  }
}

.theme-preview {
  padding: 20px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid rgba(var(--primary-color), 0.18);
  border-radius: 14px;
  background:
    linear-gradient(100deg, rgba(var(--primary-color), 0.1), rgba(var(--primary-color), 0.025)),
    var(--surface-subtle);

  span {
    color: rgb(var(--primary-color));
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.13em;
  }

  strong {
    margin-top: 4px;
    display: block;
    color: var(--text-primary);
    font-size: 17px;
  }

  p {
    margin-top: 5px;
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.theme-preview__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;

  button {
    min-height: 38px;
    padding: 0 15px;
    border: 1px solid var(--border-default);
    border-radius: 9px;
    color: var(--text-secondary);
    background: var(--surface-card);
    font-size: 12px;
    font-weight: 620;

    &.primary {
      border-color: rgb(var(--primary-color));
      color: #ffffff;
      background: rgb(var(--primary-color));
      box-shadow: 0 6px 14px rgba(var(--primary-color), 0.2);
    }
  }
}

@media (max-width: 900px) {
  .accent-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .appearance-setting__header,
  .appearance-option__heading,
  .theme-preview {
    align-items: stretch;
    flex-direction: column;
  }

  .appearance-setting__header,
  .appearance-setting__content {
    padding: 20px 16px;
  }

  .mode-grid,
  .accent-grid {
    grid-template-columns: 1fr;
  }

  .appearance-option__heading > span {
    align-self: flex-start;
  }

  .theme-preview__actions {
    width: 100%;

    button {
      flex: 1;
    }
  }
}
</style>
