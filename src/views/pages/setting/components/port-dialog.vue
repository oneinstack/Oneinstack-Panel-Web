<script setup lang="ts">
import { ref, reactive, defineEmits, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'


interface RuleForm {
  port: string
}

const props = defineProps<{
  modelValue: boolean,
  form: {
    port: string
  }
}>()

const emit = defineEmits(['update:modelValue'])
const dialogVisible = ref(false)
const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive<RuleForm>({
  port: props.form.port
})

const t = (key: string, fallback: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback
}

watch(() => props.form.port, (val) => {
  ruleForm.port = val
})

const validatePort = (rule: any, value: string, callback: any) => {
  const portRegex = /^([0-9]{1,5}|[0-9]{1,5}-[0-9]{1,5})$/
  if (!value) {
    callback(new Error(t('setting.port.inputPort', 'Enter a port')))
  } else if (!portRegex.test(value)) {
    callback(new Error(t('setting.port.invalidPortFormat', 'Invalid port format. Enter a port or port range between 1 and 65535.')))
  } else {
    const ports = value.split('-')
    const port1 = parseInt(ports[0])
    const port2 = ports.length > 1 ? parseInt(ports[1]) : port1
    
    if (port1 < 1 || port1 > 65535 || port2 < 1 || port2 > 65535) {
      callback(new Error(t('setting.port.portRangeInvalid', 'Port range must be between 1 and 65535')))
    } else if (port2 < port1) {
      callback(new Error(t('setting.port.endPortLessThanStart', 'End port cannot be smaller than start port')))
    } else {
      callback()
    }
  }
}

const rules = reactive<FormRules>({
  port: [{ validator: validatePort, trigger: 'blur' }]
})

const handleSubmit = async () => {
  if (!ruleFormRef.value) return
  
  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await submitOperation('panel.port_update', { port: ruleForm.port })
        ElMessage.success(t('common.saveSuccess', 'Saved successfully'))
        dialogVisible.value = false
        emit('update:modelValue', false)
      } catch (error) {
        if (isOperationCancelled(error)) return
        ElMessage.error(t('common.operationFailed', 'Operation failed'))
      }
    }
  })
}

const handleClose = () => {
  dialogVisible.value = false
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(() => dialogVisible.value, (val) => {
  emit('update:modelValue', val)
})
</script>

<template>
  <custom-drawer
    :visible="dialogVisible"
    :title="$t('setting.port.modifyPanelPort')"
    size="520px"
    :confirm-text="$t('common.confirm')"
    :on-close="handleClose"
    :on-confirm="handleSubmit"
  >
    <el-form
      ref="ruleFormRef"
      :model="ruleForm"
      :rules="rules"
      class="port-form"
      label-width="120px"
    >
      <el-form-item :label="$t('setting.port.panelPort')" prop="port" label-position="top" required>
        <el-input v-model="ruleForm.port" :placeholder="$t('setting.port.portPlaceholder')" />
      </el-form-item>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.port-form {
  max-width: 420px;
}
</style>
