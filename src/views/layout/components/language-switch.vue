<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import i18n from '@/lang'

type SupportedLocale = 'zh-CN' | 'en-US'

const rootRef = ref<HTMLElement | null>(null)
const visible = ref(false)

const currentLanguage = computed<SupportedLocale>(() => i18n.locale === 'en-US' ? 'en-US' : 'zh-CN')
const languageOptions = computed<Array<{ label: string; value: SupportedLocale; mark: string }>>(() => [
  { label: '中文', value: 'zh-CN', mark: '中' },
  { label: 'English', value: 'en-US', mark: 'EN' }
])
const activeLanguage = computed(
  () => languageOptions.value.find((item) => item.value === currentLanguage.value) || languageOptions.value[0]
)

const closeMenu = () => {
  visible.value = false
}

const toggleMenu = () => {
  visible.value = !visible.value
}

const setLanguage = async (lang: SupportedLocale) => {
  closeMenu()
  if (lang === currentLanguage.value) return
  await i18n.setLang(lang)
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  const target = event.target as Node | null
  if (!target || !rootRef.value?.contains(target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <div ref="rootRef" class="language-switch-root">
    <button
      class="language-switch"
      type="button"
      :aria-label="$t('common.switchLanguage')"
      :aria-expanded="visible"
      @click.stop="toggleMenu"
    >
      <span class="language-switch__mark">{{ activeLanguage.mark }}</span>
      <span class="language-switch__text">{{ activeLanguage.label }}</span>
      <span class="language-switch__chevron">⌄</span>
    </button>

    <transition name="language-switch-fade">
      <div v-if="visible" class="language-switch__panel" role="menu" @click.stop>
        <button
          v-for="item in languageOptions"
          :key="item.value"
          type="button"
          class="language-switch__menu-item"
          :class="{ 'is-active-language': item.value === currentLanguage }"
          @click="setLanguage(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="less">
.language-switch-root {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
}

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

.language-switch__panel {
  min-width: 156px;
  margin-top: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
    var(--surface-raised);
  box-shadow:
    0 20px 40px rgba(4, 10, 20, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.language-switch__menu-item {
  min-width: 156px;
  min-height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border: 0;
  border-radius: 12px;
  color: var(--text-secondary);
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    color: var(--text-primary);
    background: rgba(var(--primary-color), 0.12);
  }

  &.is-active-language {
    color: rgb(var(--primary-color));
    background: linear-gradient(90deg, rgba(var(--primary-color), 0.16), rgba(var(--primary-color), 0.05));
    box-shadow: inset 3px 0 0 rgb(var(--primary-color));
  }
}

.language-switch-fade-enter-active,
.language-switch-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
  transform-origin: top right;
}

.language-switch-fade-enter-from,
.language-switch-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
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

  .language-switch__panel {
    min-width: 120px;
  }

  .language-switch__menu-item {
    min-width: 120px;
  }
}
</style>
