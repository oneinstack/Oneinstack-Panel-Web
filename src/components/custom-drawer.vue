<script setup lang="ts">
import { Back } from '@element-plus/icons-vue'

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
  cancelText: '取消',
  confirmText: '确认',
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  confirmDisabled: false,
  confirmType: 'primary',
  destroyOnClose: false,
  closeOnClickModal: true,
  direction: 'rtl'
})
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
          <span>返回</span>
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
        <el-button v-if="showCancel" @click="onClose">{{ cancelText }}</el-button>
        <el-button
          v-if="showConfirm"
          :loading="loading"
          :disabled="confirmDisabled"
          :type="confirmType"
          @click="onConfirm"
        >
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.drawerHeader {
  min-height: 88px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid color-mix(in srgb, var(--border-subtle) 88%, transparent);
  background: var(--surface-card);

  .back {
    margin-right: 24px;
    padding: 10px 20px 10px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    border-right: 1px solid var(--border-subtle);
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    transition: color 0.18s ease;

    &:hover {
      color: rgb(var(--primary-color));
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
  min-height: 100%;
  padding: 38px 36px 32px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.drawerFooter {
  min-height: 84px;
  padding: 18px 36px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-card);

  :deep(.el-button) {
    min-width: 88px;
    height: 44px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
  }
}

:global(.custom-drawer-shell) {
  display: flex;
  flex-direction: column;
}

:global(.custom-drawer-shell .el-drawer__header),
:global(.custom-drawer-shell .el-drawer__body),
:global(.custom-drawer-shell .el-drawer__footer) {
  margin: 0;
  padding: 0;
}

:global(.custom-drawer-shell .el-drawer__body) {
  flex: 1;
  overflow: auto;
}

@media (max-width: 768px) {
  .drawerHeader {
    min-height: 76px;
    padding: 0 20px;

    .back {
      margin-right: 16px;
      padding-right: 14px;
    }
  }

  .drawerBody {
    padding: 24px 18px 28px;
  }

  .drawerFooter {
    padding: 14px 18px;
  }
}
</style>
