<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'

interface Props {
  title?: string
  width?: string
  showClose?: boolean
  onClose?: () => void
}

withDefaults(defineProps<Props>(), {
  title: 'title',
  width: '624px',
  showClose: false
})

const show = defineModel<boolean>('show')
</script>

<template>
  <el-dialog
    v-model="show"
    :title="title"
    :width="width"
    :show-close="showClose"
    class="custom-dialog"
    @close="onClose && onClose()"
  >
    <template #header="{ close, titleId }">
      <div class="custom-dialog__header">
        <h4 :id="titleId">{{ title }}</h4>
        <button class="close-button" type="button" aria-label="关闭" @click="close">
          <el-icon size="17"><Close /></el-icon>
        </button>
      </div>
    </template>
    <template #default>
      <div class="custom-dialog__body">
        <slot />
      </div>
    </template>
    <template #footer>
      <div class="custom-dialog__footer">
        <slot name="footer" />
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
:global(.el-dialog.custom-dialog) {
  --el-dialog-bg-color: var(--surface-raised);
  --el-dialog-padding-primary: 0;

  &__header {
    overflow: hidden;
    margin: 0;
  }
}

.custom-dialog {
  &__header {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-primary);

    h4 {
      font-size: 16px;
      font-weight: 680;
    }

    .close-button {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 9px;
      color: var(--text-tertiary);
      background: var(--surface-subtle);
      transition: all 0.18s ease;

      &:hover {
        color: rgb(var(--error-color));
        background: rgba(var(--error-color), 0.08);
      }
    }
  }

  &__body {
    padding: 22px 24px 0;
  }

  &__footer {
    padding: 20px 24px 24px;
  }
}
</style>
