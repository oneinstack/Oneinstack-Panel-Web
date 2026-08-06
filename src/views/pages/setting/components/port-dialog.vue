<script setup lang="ts">
import { ref, reactive, defineEmits, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'


interface RuleForm {
  port: string
}

// 将 defineProps 移到最前面
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

// 监听父组件传入的form变化
watch(() => props.form.port, (val) => {
  ruleForm.port = val
})

// 端口范围校验规则
const validatePort = (rule: any, value: string, callback: any) => {
  const portRegex = /^([0-9]{1,5}|[0-9]{1,5}-[0-9]{1,5})$/
  if (!value) {
    callback(new Error('请输入端口'))
  } else if (!portRegex.test(value)) {
    callback(new Error('端口格式不正确,请输入1-65535之间的端口或端口范围'))
  } else {
    const ports = value.split('-')
    const port1 = parseInt(ports[0])
    const port2 = ports.length > 1 ? parseInt(ports[1]) : port1
    
    if (port1 < 1 || port1 > 65535 || port2 < 1 || port2 > 65535) {
      callback(new Error('端口范围必须在1-65535之间'))
    } else if (port2 < port1) {
      callback(new Error('结束端口不能小于起始端口'))
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
        ElMessage.success('修改成功')
        dialogVisible.value = false
        emit('update:modelValue', false)
      } catch (error) {
        if (isOperationCancelled(error)) return
        ElMessage.error('修改失败')
      }
    }
  })
}

const handleClose = () => {
  dialogVisible.value = false
  emit('update:modelValue', false)
}

// 监听 modelValue 变化
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
    title="修改面板端口"
    size="520px"
    confirm-text="确定"
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
      <el-form-item label="面板端口" prop="port" label-position="top" required>
        <el-input v-model="ruleForm.port" placeholder="请输入端口号" />
      </el-form-item>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.port-form {
  max-width: 420px;
}
</style>
