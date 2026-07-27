<script setup lang="ts">
type FormItemType =
  | 'input'
  | 'select'
  | 'switch'
  | 'time'
  | 'datetime'
  | 'number'
  | 'password'
  | 'file'
  | 'custom'
  | 'none'

interface ActionBtn {
  type?: 'default' | 'primary'
  text: string
  click: () => void
}

export interface FormItem {
  label: string
  prop: string
  value: string | number
  type: FormItemType
  disabled?: boolean
  change?: (value: any) => void
  action?: ActionBtn | ActionBtn[]
  tip?: string
  options?: any[]
}

interface Props {
  data: FormItem[]
}

const props = defineProps<Props>()
</script>

<template>
  <el-form label-width="180px">
    <el-form-item v-for="item in data" :key="item.prop" :label="item.label" label-position="left">
      <div class="mr-2">
        <el-input
          v-if="item.type === 'input' || item.type === 'password'"
          v-model="item.value"
          :type="item.type === 'password' ? 'password' : 'text'"
          clearable
          :disabled="item.disabled"
        />
        <el-switch v-else-if="item.type === 'switch'" v-model="item.value" :disabled="item.disabled" />
        <el-input v-else-if="item.type === 'file'" v-model="item.value" :disabled="item.disabled">
          <template #append>
            <v-s-icon name="folders" />
          </template>
        </el-input>
      </div>
      <!-- 按钮 -->
      <template v-if="item.action">
        <el-button
          v-if="Array.isArray(item.action)"
          v-for="action in item.action"
          :type="action.type || 'default'"
          class="mr-2"
          @click="action.click"
        >
          {{ action.text }}
        </el-button>
        <el-button v-else :type="item.action?.type || 'default'" class="mr-2" @click="item.action.click">
          {{ item.action.text }}
        </el-button>
      </template>
      <!-- 提示 -->
      <template v-if="item.tip">
        <span v-html="item.tip" class="tips-text"></span>
      </template>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="less">
:deep(.el-form) {
  &-item__content {
    flex-wrap: nowrap;
    gap: 8px;
  }
}

:deep(.el-input) {
  width: 297px;

  &.is-disabled {
    .el-input__wrapper,
    .el-input-group__append {
      background: var(--surface-muted) !important;
    }
  }

  &__wrapper {
    background: var(--surface-card) !important;
    box-shadow: 0 0 0 1px var(--border-default) inset !important;

    &.is-focus {
      box-shadow:
        0 0 0 1px rgb(var(--primary-color)) inset,
        0 0 0 4px var(--focus-ring) !important;
    }
  }

  &-group__append {
    border-left: 1px solid var(--border-subtle) !important;
    background: var(--surface-subtle) !important;
    box-shadow: 0 0 0 1px var(--border-default) inset !important;
    border-left: none !important;
  }
}

.tips-text {
  color: var(--text-tertiary);
  font-size: 12px;
}

@media (max-width: 780px) {
  :deep(.el-form-item) {
    align-items: flex-start;
    flex-direction: column;
  }

  :deep(.el-form-item__content) {
    width: 100%;
    flex-wrap: wrap;
  }

  :deep(.el-input) {
    width: min(100%, 360px);
  }
}
</style>
