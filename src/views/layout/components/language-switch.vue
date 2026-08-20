<script setup lang="ts">
import { computed, ref } from 'vue'
import i18n from '@/lang'

type SupportedLocale = 'zh-CN' | 'en-US'

const currentLanguage = ref<SupportedLocale>(i18n.locale === 'en-US' ? 'en-US' : 'zh-CN')
const languageOptions = computed<Array<{ label: string; value: SupportedLocale; mark: string }>>(() => [
  { label: '中文', value: 'zh-CN', mark: '中' },
  { label: 'English', value: 'en-US', mark: 'EN' }
])
const activeLanguage = computed(
  () => languageOptions.value.find((item) => item.value === currentLanguage.value) || languageOptions.value[0]
)

const setLanguage = async (lang: SupportedLocale) => {
  if (lang === currentLanguage.value) return
  currentLanguage.value = lang
  await i18n.setLang(lang)
}

const handleLanguageCommand = (command: string | number | object) => {
  void setLanguage(command as SupportedLocale)
}
</script>

<template>
  <el-dropdown placement="bottom-end" trigger="click" @command="handleLanguageCommand">
    <button class="language-switch" type="button" :aria-label="$t('common.switchLanguage')">
      <span class="language-switch__mark">{{ activeLanguage.mark }}</span>
      <span class="language-switch__text">{{ activeLanguage.label }}</span>
      <span class="language-switch__chevron">⌄</span>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in languageOptions"
          :key="item.value"
          :command="item.value"
          :class="{ 'is-active-language': item.value === currentLanguage }"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="less">
.language-switch {
  min-width: 112px;
  height: 38px;
  padding: 0 9px 0 7px;
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

  &__mark {
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

  &__text {
    white-space: nowrap;
  }

  &__chevron {
    color: var(--text-placeholder);
    font-size: 14px;
    line-height: 1;
  }
}

@media (max-width: 760px) {
  .language-switch {
    min-width: 42px;
    width: 42px;
    padding: 0;

    &__text,
    &__chevron {
      display: none;
    }
  }
}
</style>
