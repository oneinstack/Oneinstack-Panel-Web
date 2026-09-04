<script setup lang="ts">
import type { FormInstance, FormRules, FormItemRule } from 'element-plus'
import { computed, onMounted, reactive, useTemplateRef } from 'vue'

interface Options {
  label: string
  value: string
}

export interface FormItem {
  ifShow?: (value: any) => boolean
  label: string
  type: 'input' | 'checkbox-group' | 'checkbox' | 'textarea' | 'file-select' | 'password' | 'select' | 'custom'
  prop: string
  placeholder?: string
  error?: string
  options?: Options[]
  asyncOptions?: () => Promise<Options[]>
  rules?: FormItemRule[]
  change?: (value: any) => void
}

export interface Props {
  data: {
    value: Record<string, any>
    items: FormItem[]
  }
  onInit?: (instance: FormInstance) => void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({
    value: {},
    items: []
  })
})

const conf = reactive({
  instance: useTemplateRef<FormInstance>('ruleFormRef'),
  rules: computed<FormRules>(() =>
    props.data.items.reduce(
      (acc, item) => ({
        ...acc,
        [item.prop]: item.rules || []
      }),
      {}
    )
  ),
  selectFolder: {
    show: false,
    path: '',
    prop: '',
    open: (prop: string) => {
      conf.selectFolder.prop = prop
      conf.selectFolder.show = true
    },
    confirm: () => {
      props.data.value[conf.selectFolder.prop] = conf.selectFolder.path
      conf.selectFolder.show = false
    }
  }
})

onMounted(() => {
  conf.instance && props.onInit?.(conf.instance)
  props.data.items.forEach(async (item) => {
    if (!item.asyncOptions) return
    item.options = await item.asyncOptions?.()
  })
})
</script>

<template>
  <el-form ref="ruleFormRef" :model="data.value" :rules="conf.rules" label-width="auto" class="custom-form">
    <template v-for="(item, index) in data.items">
      <el-form-item v-if="item.ifShow?.(data.value) ?? true" :key="index" :label="item.label" :prop="item.prop" :error="item.error">
        <template v-if="item.type === 'input' || item.type === 'password'">
          <el-input
            v-model="data.value[item.prop]"
            :type="item.type === 'input' ? 'text' : 'password'"
            :show-password="item.type === 'password'"
            :autocomplete="item.type === 'password' ? 'new-password' : undefined"
            :placeholder="item.placeholder"
            clearable
            @input="item.change"
          />
        </template>
        <template v-else-if="item.type === 'select'">
          <el-select v-model="data.value[item.prop]" @change="item.change">
            <el-option v-for="val in item.options" :key="val.value" :label="val.label" :value="val.value" />
          </el-select>
        </template>
        <template v-else-if="item.type === 'checkbox-group'">
          <el-checkbox-group v-model="data.value[item.prop]" @change="item.change">
            <el-checkbox v-for="val in item.options" :key="val.value" :label="val.label" :value="val.value" />
          </el-checkbox-group>
        </template>
        <template v-else-if="item.type === 'checkbox'">
          <el-checkbox v-model="data.value[item.prop]" :label="item.label" @change="item.change" />
        </template>
        <template v-else-if="item.type === 'textarea'">
          <el-input
            v-model="data.value[item.prop]"
            type="textarea"
            :placeholder="item.placeholder"
            @input="item.change"
          />
        </template>
        <template v-else-if="item.type === 'file-select'">
          <el-input v-model="data.value[item.prop]" :placeholder="item.placeholder">
            <template #append>
              <v-s-icon class="cursor-pointer" name="folders" @click="conf.selectFolder.open(item.prop)" />
            </template>
          </el-input>
        </template>
        <template v-else-if="item.type === 'custom'">
          <slot :name="item.prop" :row="item" />
        </template>
      </el-form-item>
    </template>

    <custom-dialog v-model="conf.selectFolder.show" :title="$t('common.selectFolder')">
      <file-panel @select="(path) => (conf.selectFolder.path = path)" />
      <template #footer>
        <el-button type="primary" @click="conf.selectFolder.confirm">{{ $t('common.confirm') }}</el-button>
      </template>
    </custom-dialog>
  </el-form>
</template>

<style scoped lang="less">
.custom-form {
  padding: 4px 2px;

  :deep(.el-form-item__label) {
    min-width: 96px;
    color: var(--text-secondary) !important;
    font-weight: 560;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .custom-form {
    :deep(.el-form-item) {
      align-items: stretch;
      flex-direction: column;
    }

    :deep(.el-form-item__label),
    :deep(.el-form-item__label-wrap) {
      width: 100% !important;
      height: auto;
      min-height: 30px;
      margin-left: 0 !important;
      padding-right: 0;
      justify-content: flex-start;
      line-height: 1.45;
    }

    :deep(.el-form-item__content) {
      width: 100%;
      margin-left: 0 !important;
    }
  }
}
</style>
