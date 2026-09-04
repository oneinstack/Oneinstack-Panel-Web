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
  loading?: boolean
  disabled?: boolean
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
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})
</script>

<template>
  <el-form label-width="180px">
    <el-form-item v-for="item in data" :key="item.prop" :label="item.label" label-position="left">
      <div class="setting-form-item">
        <div class="setting-form-item__controls">
          <div class="setting-form-item__field">
            <el-input
              v-if="item.type === 'input' || item.type === 'password'"
              v-model="item.value"
              :type="item.type === 'password' ? 'password' : 'text'"
              clearable
              :disabled="props.readonly || item.disabled"
            />
            <el-switch v-else-if="item.type === 'switch'" v-model="item.value" :disabled="props.readonly || item.disabled" />
            <el-input v-else-if="item.type === 'file'" v-model="item.value" :disabled="props.readonly || item.disabled">
              <template #append>
                <v-s-icon name="folders" />
              </template>
            </el-input>
          </div>
          <template v-if="item.action">
            <el-button
              v-if="Array.isArray(item.action)"
              v-for="action in item.action"
              :type="action.type || 'default'"
              :loading="action.loading"
              :disabled="props.readonly || action.disabled"
              class="setting-form-item__button"
              @click="action.click"
            >
              {{ action.text }}
            </el-button>
            <el-button
              v-else
              :type="item.action?.type || 'default'"
              :loading="item.action?.loading"
              :disabled="props.readonly || item.action?.disabled"
              class="setting-form-item__button"
              @click="item.action.click"
            >
              {{ item.action.text }}
            </el-button>
          </template>
        </div>
        <span v-if="item.tip" v-html="item.tip" class="tips-text"></span>
      </div>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="less">
:deep(.el-form) {
  &-item__content {
    width: 100%;
  }

  &-item__label {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;
  }
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

.setting-form-item {
  width: 100%;
}

.setting-form-item__controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-form-item__field {
  flex: 0 1 297px;
  min-width: 0;
}

:root:root.dark .setting-form-item {
  :deep(.el-form-item__label) {
    color: #e5e7eb;
  }
}

.setting-form-item__button {
  flex-shrink: 0;
}

:deep(.el-input) {
  width: 100%;

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
  display: block;
  margin-top: 10px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-word;
}

@media (max-width: 780px) {
  :deep(.el-form-item) {
    align-items: flex-start;
    flex-direction: column;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 10px;
  }

  .setting-form-item__controls {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .setting-form-item__field {
    flex-basis: 100%;
  }

  .setting-form-item__button {
    margin-left: 0 !important;
  }

  :deep(.el-button) {
    width: 100%;
  }

  .tips-text {
    margin-top: 8px;
  }
}
</style>
