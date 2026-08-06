<script setup lang="ts">
import { Back } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  title: string
  cancelText?: string
  confirmText?: string
  loading?: boolean
  size?: string | number
  onClose?: () => void
  onConfirm?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  loading: false,
  size: '520px',
  cancelText: '取消',
  confirmText: '确认'
})
</script>

<template>
  <el-drawer :model-value="visible" direction="rtl" :size="size" :show-close="false" @close="onClose">
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
    <template #footer>
      <div class="drawerFooter">
        <el-button @click="onClose">{{ cancelText }}</el-button>
        <el-button :loading="loading" type="primary" @click="onConfirm">{{ confirmText }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.drawerHeader {
  min-height: 68px;
  padding: 0 22px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-raised);

  .back {
    margin-right: 16px;
    padding: 7px 13px 7px 0;
    display: flex;
    align-items: center;
    gap: 5px;
    border-right: 1px solid var(--border-subtle);
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 12px;
    transition: color 0.18s ease;

    &:hover {
      color: rgb(var(--primary-color));
    }
  }

  .title {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 680;
  }
}

.drawerBody {
  min-height: 100%;
  padding: 22px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.drawerFooter {
  padding: 16px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-raised);
}

:global(.el-drawer__header),
:global(.el-drawer__body),
:global(.el-drawer__footer) {
  margin: 0;
  padding: 0;
}
</style>
