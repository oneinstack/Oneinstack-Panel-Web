<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'

interface FirewallRuleForm {
  id?: number
  direction: 'in' | 'out'
  protocol: 'tcp' | 'udp' | 'icmp'
  strategy: 'allow' | 'deny'
  ips: string
  ports: string
  state: number
  remark: string
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  type?: boolean
  formData?: Partial<FirewallRuleForm>
  panelPort?: number
}>(), {
  type: true,
  formData: () => ({}),
  panelPort: 8089
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: [value: boolean]
  saved: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const sourceMode = ref<'all' | 'custom'>('all')
const customIPs = ref('')
const form = reactive<FirewallRuleForm>({
  direction: 'in',
  protocol: 'tcp',
  strategy: 'allow',
  ips: '',
  ports: '',
  state: 1,
  remark: ''
})

const visible = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    if (!value) emit('close', false)
  }
})

const isIPv4 = (value: string) => {
  const octets = value.split('.')
  return octets.length === 4 && octets.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false
    const number = Number(part)
    return number >= 0 && number <= 255 && String(number) === String(Number(part))
  })
}

const validateIPs = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
  if (sourceMode.value === 'all') {
    callback()
    return
  }
  const values = customIPs.value.split(',').map((item) => item.trim()).filter(Boolean)
  if (!values.length) {
    callback(new Error('请输入 IPv4 地址或 CIDR 网段'))
    return
  }
  for (const value of values) {
    const [ip, prefix, extra] = value.split('/')
    if (extra !== undefined || !isIPv4(ip) || (prefix !== undefined && (!/^\d{1,2}$/.test(prefix) || Number(prefix) > 32))) {
      callback(new Error(`IP 格式不正确：${value}`))
      return
    }
  }
  callback()
}

const parsePortRange = (value: string) => {
  const parts = value.split('-')
  if (parts.length > 2 || parts.some((part) => !/^\d+$/.test(part))) return false
  const start = Number(parts[0])
  const end = parts.length === 2 ? Number(parts[1]) : start
  return start >= 1 && end <= 65535 && start <= end
}

const portsContain = (raw: string, port: number) => {
  if (!raw.trim()) return true
  return raw.split(',').some((item) => {
    const [startText, endText] = item.trim().split('-')
    const start = Number(startText)
    const end = endText ? Number(endText) : start
    return port >= start && port <= end
  })
}

const validatePorts = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (form.protocol === 'icmp') {
    callback()
    return
  }
  const values = String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
  if (values.some((item) => !parsePortRange(item))) {
    callback(new Error('端口格式应为 80,443,8000-8100，范围为 1-65535'))
    return
  }
  if (
    form.direction === 'in' &&
    form.strategy === 'deny' &&
    portsContain(String(value || ''), props.panelPort)
  ) {
    callback(new Error(`不能拒绝面板端口 ${props.panelPort}`))
    return
  }
  callback()
}

const rules: FormRules = {
  protocol: [{ required: true, message: '请选择协议', trigger: 'change' }],
  direction: [{ required: true, message: '请选择方向', trigger: 'change' }],
  strategy: [{ required: true, message: '请选择策略', trigger: 'change' }],
  ports: [{ validator: validatePorts, trigger: ['blur', 'change'] }],
  ips: [{ validator: validateIPs, trigger: ['blur', 'change'] }],
  remark: [{ max: 200, message: '备注不能超过 200 个字符', trigger: 'blur' }]
}

const resetFromProps = () => {
  const source = props.formData || {}
  form.id = source.id
  form.direction = source.direction || 'in'
  form.protocol = source.protocol || 'tcp'
  form.strategy = source.strategy || 'allow'
  form.ports = source.protocol === 'icmp' ? '' : (source.ports || '')
  form.state = 1
  form.remark = source.remark || ''
  const sourceIPs = source.ips || ''
  if (sourceIPs && sourceIPs !== '0.0.0.0/0') {
    sourceMode.value = 'custom'
    customIPs.value = sourceIPs
  } else {
    sourceMode.value = 'all'
    customIPs.value = ''
  }
}

watch(() => props.formData, resetFromProps, { immediate: true, deep: true })
watch(() => form.protocol, (protocol) => {
  if (protocol === 'icmp') form.ports = ''
  formRef.value?.validateField('ports')
})
watch([() => form.direction, () => form.strategy], () => formRef.value?.validateField('ports'))

const close = () => {
  visible.value = false
}

const submit = async () => {
  if (!formRef.value || submitting.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = {
      id: props.type ? undefined : form.id,
      direction: form.direction,
      protocol: form.protocol,
      strategy: form.strategy,
      ips: sourceMode.value === 'custom' ? customIPs.value.trim() : '',
      ports: form.protocol === 'icmp' ? '' : form.ports.trim(),
      state: 1,
      remark: form.remark.trim()
    }
    try {
      await submitOperation('firewall.rule_change', {
        action: props.type ? 'create' : 'update',
        rule: payload
      })
    } catch (error) {
      if (isOperationCancelled(error)) return
      throw error
    }
    ElMessage.success(props.type ? '规则已添加' : '规则已更新')
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <custom-drawer
    :visible="visible"
    size="640px"
    :title="props.type ? '添加防火墙规则' : '编辑防火墙规则'"
    :confirm-text="props.type ? '添加规则' : '保存修改'"
    :loading="submitting"
    :confirm-disabled="submitting"
    :on-close="close"
    :on-confirm="submit"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="88px" status-icon>
      <el-form-item label="协议" prop="protocol">
        <el-select v-model="form.protocol" class="full-width">
          <el-option label="TCP" value="tcp" />
          <el-option label="UDP" value="udp" />
          <el-option label="ICMP" value="icmp" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.protocol !== 'icmp'" label="端口" prop="ports">
        <el-input v-model="form.ports" placeholder="留空表示全部端口，例如 80,443,8000-8100" />
      </el-form-item>

      <el-form-item label="IP 范围" prop="ips">
        <div class="source-field">
          <el-radio-group v-model="sourceMode" @change="formRef?.validateField('ips')">
            <el-radio value="all">全部 IPv4</el-radio>
            <el-radio value="custom">指定 IPv4/CIDR</el-radio>
          </el-radio-group>
          <el-input
            v-if="sourceMode === 'custom'"
            v-model="customIPs"
            placeholder="例如 192.168.1.10,10.0.0.0/24"
            @blur="formRef?.validateField('ips')"
          />
        </div>
      </el-form-item>

      <el-form-item label="策略" prop="strategy">
        <el-radio-group v-model="form.strategy">
          <el-radio-button value="allow">放行</el-radio-button>
          <el-radio-button value="deny">拒绝</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="方向" prop="direction">
        <el-radio-group v-model="form.direction">
          <el-radio-button value="in">入站</el-radio-button>
          <el-radio-button value="out">出站</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" maxlength="200" show-word-limit placeholder="可选" />
      </el-form-item>

      <el-alert
        v-if="form.direction === 'in' && form.strategy === 'deny'"
        :title="`为防止失联，入站拒绝规则不能包含面板端口 ${props.panelPort}`"
        type="warning"
        :closable="false"
        show-icon
      />
    </el-form>
  </custom-drawer>
</template>

<style scoped>
.full-width,
.source-field {
  width: 100%;
}

.source-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
