<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import i18n from '@/lang'

type SupportedLocale = 'zh-CN' | 'en-US'

const currentLanguage = computed<SupportedLocale>(() => i18n.locale === 'en-US' ? 'en-US' : 'zh-CN')

const languageOptions = computed<Array<{ label: string; value: SupportedLocale; mark: string }>>(() => [
  { label: '中文', value: 'zh-CN', mark: '中' },
  { label: 'English', value: 'en-US', mark: 'EN' }
])

const activeLanguage = computed(
  () => languageOptions.value.find((item) => item.value === currentLanguage.value) || languageOptions.value[0]
)

const setLanguage = async (lang: SupportedLocale) => {
  if (lang === currentLanguage.value) return
  await i18n.setLang(lang)
}

const handleCommand = async (command: string | number | object) => {
  await setLanguage(command as SupportedLocale)
}
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    popper-class="language-switch-popper"
    @command="handleCommand"
  >
    <button
      class="language-switch"
      type="button"
      :aria-label="$t('common.switchLanguage')"
    >
      <span class="language-switch__mark">{{ activeLanguage.mark }}</span>
      <span class="language-switch__text">{{ activeLanguage.label }}</span>
      <el-icon class="language-switch__chevron"><ArrowDown /></el-icon>
    </button>

    <template #dropdown>
      <el-dropdown-menu class="language-switch__menu">
        <el-dropdown-item
          v-for="item in languageOptions"
          :key="item.value"
          :command="item.value"
          class="language-switch__menu-item"
          :class="{ 'is-active-language': item.value === currentLanguage }"
        >
          <span class="language-switch__menu-label">{{ item.label }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="less">
.language-switch {
  min-width: 112px;
  height: 38px;
  padding: 0 10px 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 11px;
  color: var(--text-secondary);
  background: var(--surface-subtle);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: rgba(var(--primary-color), 0.35);
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.07);
  }
}

.language-switch__mark {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(145deg, var(--primary-color-light), var(--primary-gradient-end));
  font-size: 11px;
  font-weight: 760;
  line-height: 1;
  box-shadow: 0 5px 12px rgba(var(--primary-color), 0.18);
}

.language-switch__text {
  white-space: nowrap;
}

.language-switch__chevron {
  color: var(--text-placeholder);
  font-size: 14px;
}

@media (max-width: 760px) {
  .language-switch {
    min-width: 42px;
    width: 42px;
    padding: 0;
  }

  .language-switch__text,
  .language-switch__chevron {
    display: none;
  }
}
</style>

<style lang="less">
.language-switch-popper {
  padding: 8px !important;
  border: 1px solid var(--border-subtle) !important;
  border-radius: 18px !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
    var(--surface-raised) !important;
  box-shadow:
    0 20px 40px rgba(4, 10, 20, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
}

.language-switch-popper .el-popper__arrow::before {
  border-color: var(--border-subtle) !important;
  background: var(--surface-raised) !important;
}

.language-switch__menu {
  min-width: 156px;
  border: 0 !important;
  background: transparent !important;
}

.language-switch__menu .el-dropdown-menu__item {
  margin: 0;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  transition: all 0.18s ease;
}

.language-switch__menu .el-dropdown-menu__item:focus-visible {
  outline: none;
}

.language-switch__menu .el-dropdown-menu__item:not(.is-disabled):hover,
.language-switch__menu .el-dropdown-menu__item:not(.is-disabled):focus {
  color: var(--text-primary);
  background: rgba(var(--primary-color), 0.12);
}

.language-switch__menu .el-dropdown-menu__item.is-active-language {
  color: rgb(var(--primary-color));
  background: linear-gradient(90deg, rgba(var(--primary-color), 0.16), rgba(var(--primary-color), 0.05));
  box-shadow: inset 3px 0 0 rgb(var(--primary-color));
}

.language-switch__menu-label {
  display: block;
  width: 100%;
}

@media (max-width: 760px) {
  .language-switch__menu {
    min-width: 120px;
  }
}
</style>
