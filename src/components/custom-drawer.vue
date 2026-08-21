<script setup lang="ts">
import { Back } from '@element-plus/icons-vue'
import { computed } from 'vue'
import i18n from '@/lang'

interface Props {
  visible: boolean
  title: string
  cancelText?: string
  confirmText?: string
  loading?: boolean
  size?: string | number
  showFooter?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  confirmDisabled?: boolean
  confirmType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | ''
  destroyOnClose?: boolean
  closeOnClickModal?: boolean
  direction?: 'rtl' | 'ltr' | 'ttb' | 'btt'
  onClose?: () => void
  onConfirm?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  loading: false,
  size: '520px',
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  confirmDisabled: false,
  confirmType: 'primary',
  destroyOnClose: false,
  closeOnClickModal: true,
  direction: 'rtl'
})

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const cancelLabel = computed(() => props.cancelText || t('common.cancel', 'Cancel'))
const confirmLabel = computed(() => props.confirmText || t('common.confirm', 'Confirm'))
</script>

<template>
  <el-drawer
    class="custom-drawer-shell"
    :model-value="visible"
    :direction="direction"
    :size="size"
    :show-close="false"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
    @close="onClose"
  >
    <template #header>
      <div class="drawerHeader">
        <div class="back" @click="onClose">
          <el-icon><Back /></el-icon>
          <span>{{ $t('common.back') }}</span>
        </div>
        <span class="title">{{ props.title }}</span>
      </div>
    </template>
    <template #default>
      <div class="drawerBody">
        <slot />
      </div>
    </template>
    <template v-if="showFooter" #footer>
      <div class="drawerFooter">
        <el-button v-if="showCancel" @click="onClose">{{ cancelLabel }}</el-button>
        <el-button
          v-if="showConfirm"
          :loading="loading"
          :disabled="confirmDisabled"
          :type="confirmType"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.drawerHeader {
  min-height: 92px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--border-subtle) 88%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 94%, white 6%) 0%, var(--surface-card) 100%);
  box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--border-subtle) 55%, transparent);

  .back {
    margin-right: 4px;
    padding: 12px 18px 12px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-right: 1px solid color-mix(in srgb, var(--border-subtle) 90%, transparent);
    border-radius: 14px;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    transition:
      color 0.18s ease,
      background-color 0.18s ease,
      border-color 0.18s ease;

    &:hover {
      color: rgb(var(--primary-color));
      background: color-mix(in srgb, rgb(var(--primary-color)) 10%, transparent);
      border-color: color-mix(in srgb, rgb(var(--primary-color)) 24%, transparent);
    }

    .el-icon {
      font-size: 18px;
    }
  }

  .title {
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 760;
    line-height: 1.2;
  }
}

.drawerBody {
  height: 100%;
  padding: 38px 36px 32px;
  box-sizing: border-box;
 background: linear-gradient(180deg, 
color-mix(in srgb, var(--surface-card) 96%, transparent) 0%, var(--surface-card) 100%);
  // background:
  //   radial-gradient(circle at top right, color-mix(in srgb, rgb(var(--primary-color)) 8%, transparent) 0%, transparent 28%),
  //   linear-gradient(180deg, color-mix(in srgb, var(--surface-page) 86%, var(--surface-card) 14%) 0%, var(--surface-page) 100%);
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.drawerFooter {
  min-height: 84px;
  padding: 18px 36px calc(18px + env(safe-area-inset-bottom, 0px));
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  border-top: 1px solid color-mix(in srgb, var(--border-subtle) 92%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 96%, transparent) 0%, var(--surface-card) 100%);
  // box-shadow:
  //   0 -12px 28px color-mix(in srgb, #000 14%, transparent),
  //   inset 0 1px 0 color-mix(in srgb, #fff 4%, transparent);

  :deep(.el-button) {
    min-width: 96px;
    height: 46px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
  }
}

:global(.custom-drawer-shell) {
  display: flex;
  flex-direction: column;
}

:global(.custom-drawer-shell .el-drawer) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid color-mix(in srgb, var(--border-subtle) 88%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 92%, #0b1120 8%) 0%, var(--surface-page) 100%);
  box-shadow:
    -24px 0 48px color-mix(in srgb, #000 24%, transparent),
    inset 1px 0 0 color-mix(in srgb, #fff 4%, transparent);
}

:global(.custom-drawer-shell .el-drawer__header),
:global(.custom-drawer-shell .el-drawer__body),
:global(.custom-drawer-shell .el-drawer__footer) {
  margin: 0;
  padding: 0;
}

:global(.custom-drawer-shell .el-drawer__header),
:global(.custom-drawer-shell .el-drawer__footer) {
  flex-shrink: 0;
}

:global(.custom-drawer-shell .el-drawer__body) {
  flex: 1;
  overflow: auto;
}

:global(.custom-drawer-shell .el-drawer__body::-webkit-scrollbar) {
  width: 10px;
}

:global(.custom-drawer-shell .el-drawer__body::-webkit-scrollbar-thumb) {
  border: 2px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-quaternary) 70%, transparent);
  background-clip: padding-box;
}

:global(.custom-drawer-shell .el-drawer__body::-webkit-scrollbar-track) {
  background: transparent;
}

@media (max-width: 768px) {
  .drawerHeader {
    min-height: 76px;
    padding: 0 20px;
    gap: 12px;

    .back {
      margin-right: 0;
      padding: 10px 14px 10px 10px;
    }
  }

  .drawerBody {
    padding: 28px 20px 24px;
  }

  .drawerFooter {
    padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
