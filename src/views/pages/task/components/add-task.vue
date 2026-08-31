<template>
  <custom-drawer
    :visible="drawer"
    :title="i18n.t(type ? 'task.editor.addTitle' : 'task.editor.editTitle')"
    size="760px"
    :confirm-text="i18n.t('task.editor.confirm')"
    :on-close="handleClose"
    :on-confirm="handleSubmit"
  >
    <el-form
      ref="ruleFormRef"
      :model="ruleForm"
      :rules="rules"
      label-position="top"
      class="task-drawer-form"
    >
      <!-- <el-form-item label="任务类型" prop="cron_type" required>
        <el-select v-model="ruleForm.cron_type" placeholder="请选择任务类型">
          <el-option label="Shell脚本" value="shell" />
        </el-select>
      </el-form-item> -->

      <el-form-item :label="i18n.t('task.editor.taskName')" prop="name" required>
        <el-input v-model="ruleForm.name" :placeholder="i18n.t('task.editor.taskNamePlaceholder')" />
      </el-form-item>

      <el-form-item :label="i18n.t('task.editor.taskType')" required>
        <el-radio-group v-model="ruleForm.task_type">
          <el-radio-button value="template">{{ i18n.t('task.editor.templateType') }}</el-radio-button>
          <el-radio-button value="shell">{{ i18n.t('task.editor.shellType') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="ruleForm.task_type === 'template'">
        <el-alert
          type="success"
          :closable="false"
          show-icon
          :title="i18n.t('task.editor.templateSafetyTip')"
          style="margin-bottom: 18px"
        />
        <el-form-item :label="i18n.t('task.editor.taskTemplate')" required>
          <el-select v-model="ruleForm.template_id" style="width: 100%" :placeholder="i18n.t('task.editor.templatePlaceholder')">
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            >
              <span>{{ template.name }}</span>
              <span class="option-description">{{ template.description }}</span>
            </el-option>
          </el-select>
          <div v-if="selectedTemplate" class="template-description">
            {{ selectedTemplate.description }}
          </div>
        </el-form-item>
        <el-form-item
          v-for="parameter in selectedTemplateParameters"
          :key="parameter.name"
          :label="parameter.label"
          :required="parameter.required"
        >
          <el-select
            v-if="parameter.type === 'select'"
            v-model="ruleForm.template_params[parameter.name]"
            style="width: 100%"
            :placeholder="parameter.placeholder || (i18n.t as any)('task.editor.selectParameter', { name: parameter.label })"
          >
            <el-option v-for="option in parameter.options" :key="option" :label="option" :value="option" />
          </el-select>
          <el-input
            v-else
            v-model="ruleForm.template_params[parameter.name]"
            :placeholder="parameter.placeholder || (i18n.t as any)('task.editor.inputParameter', { name: parameter.label })"
          />
          <span v-if="parameter.description" class="tip-text">{{ parameter.description }}</span>
        </el-form-item>
      </template>

      <template v-else>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          :title="i18n.t('task.editor.shellRiskTip')"
          style="margin-bottom: 18px"
        />
      <el-form-item :label="i18n.t('task.editor.scriptContent')" prop="command" >
        <div class="code-editor-wrapper">
          <pre
            class="code-editor"
            contenteditable="true"
            spellcheck="false"
            @input="handleScriptInput"
            ref="codeEditorRef"
          >{{ copy_content }}</pre>
        </div>
      </el-form-item>
        <el-form-item>
          <el-checkbox v-model="confirmUnsafeShell">
            {{ i18n.t('task.editor.shellRiskConfirm') }}
          </el-checkbox>
        </el-form-item>
      </template>

      <el-form-item :label="i18n.t('task.editor.timeout')">
        <el-input-number
          v-model="ruleForm.timeout_seconds"
          :min="1"
          :max="86400"
          controls-position="right"
        />
        <span class="tip-text">{{ i18n.t('task.editor.timeoutTip') }}</span>
      </el-form-item>

      <el-form-item :label="i18n.t('task.editor.concurrencyPolicy')">
        <el-select v-model="ruleForm.concurrency_policy" style="width: 240px">
          <el-option :label="i18n.t('task.editor.forbidOverlap')" value="forbid" />
        </el-select>
        <span class="tip-text">{{ i18n.t('task.editor.concurrencyTip') }}</span>
      </el-form-item>

      <el-form-item :label="i18n.t('task.editor.failureNotify')">
        <el-switch v-model="ruleForm.notify_on_failure" />
        <span class="tip-text">{{ i18n.t('task.editor.failureNotifyTip') }}</span>
      </el-form-item>

      <el-form-item :label="i18n.t('task.editor.schedule')" required>
        <div class="schedule-editor">
          <div v-for="(cycle, index) in ruleForm.cycles" :key="index" class="cycle-row">
            <el-select
              v-model="cycle.type"
              class="cycle-type-select"
              @change="(val:string) => handleCycleChange(val, index)"
              :placeholder="i18n.t('task.editor.schedulePlaceholder')"
            >
              <el-option
                v-for="option in cycleTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <div class="cycle-inputs" :class="cycle.type">
              <template v-if="cycle.type === 'month'">
                <div class="time-row">
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.monthTimes[0].day"
                    :min="1"
                    :max="31"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.dayUnit') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.monthTimes[0].hour"
                    :min="0"
                    :max="23"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.hourUnit') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.monthTimes[0].minute"
                    :min="0"
                    :max="59"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.minuteUnit') }}</span>
                </div>
              </template>

              <template v-if="cycle.type === 'week'">
                <div class="time-row">
                  <el-select v-model="cycle.weekTimes[0].day" :placeholder="i18n.t('task.editor.inputPlaceholder')">
                    <el-option v-for="i in weekDays" :key="i.value" :label="i.day" :value="i.value" />
                  </el-select>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.weekTimes[0].hour"
                    :min="0"
                    :max="23"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.hourUnit') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.weekTimes[0].minute"
                    :min="0"
                    :max="59"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.minuteUnit') }}</span>
                </div>
              </template>

              <template v-if="cycle.type === 'day'">
                <div class="time-row">
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.dayHour"
                    :min="0"
                    :max="23"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.hourUnit') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.dayMinute"
                    :min="0"
                    :max="59"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.minuteUnit') }}</span>
                </div>
              </template>

              <template v-if="cycle.type === 'hour'">
                <div class="time-row">
                  <span class="inline-prefix">{{ i18n.t('task.editor.everyHourPrefix') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.hourMinute"
                    :min="0"
                    :max="59"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.minuteUnit') }}</span>
                </div>
              </template>

              <template v-if="cycle.type === 'n_day'">
                <div class="time-row">
                  <span class="inline-prefix">{{ i18n.t('task.editor.everyNPrefix') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.n_day"
                    :min="1"
                    :placeholder="i18n.t('task.editor.nValuePlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.dayUnit') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.dayHour"
                    :min="0"
                    :max="23"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.hourUnit') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.dayMinute"
                    :min="0"
                    :max="59"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.minuteUnit') }}</span>
                </div>
              </template>

              <template v-if="cycle.type === 'n_hour'">
                <div class="time-row">
                  <span class="inline-prefix">{{ i18n.t('task.editor.everyNPrefix') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.n_hour"
                    :min="1"
                    :placeholder="i18n.t('task.editor.nValuePlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.hourUnit') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.hourMinute"
                    :min="0"
                    :max="59"
                    :placeholder="i18n.t('task.editor.inputPlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.minuteUnit') }}</span>
                </div>
              </template>

              <template v-if="cycle.type === 'n_minute'">
                <div class="time-row">
                  <span class="inline-prefix">{{ i18n.t('task.editor.everyNPrefix') }}</span>
                  <el-input-number
                    controls-position="right"
                    v-model="cycle.n_minute"
                    :min="1"
                    :placeholder="i18n.t('task.editor.nValuePlaceholder')"
                  />
                  <span class="inline-unit">{{ i18n.t('task.editor.minuteUnit') }}</span>
                </div>
              </template>
            </div>
            <div class="cycle-actions">
              <el-button type="danger" link @click="removeCycle(index)" v-if="ruleForm.cycles.length > 1">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="schedule-add-actions">
            <el-button type="primary" @click="addCycle">
              <el-icon><Plus /></el-icon>{{ i18n.t('task.editor.addSchedule') }}
            </el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </custom-drawer>
</template>

<script setup lang="ts">

import { Api } from '@/api/modules'
import { computed, onMounted, ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import i18n from '@/lang'

const props = defineProps<{
  modelValue: boolean
  type?: boolean // true为新增,false为修改
  formData?: any
}>()

const emit = defineEmits(['update:modelValue', 'success', 'taskAdded'])
const codeEditorRef = ref(null);
const drawer = ref(false)
const ruleFormRef = ref<FormInstance>()
const copy_content = ref('')
const confirmUnsafeShell = ref(false)
const fallbackWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface TemplateParameter {
  name: string
  label: string
  type: 'text' | 'select'
  required: boolean
  description?: string
  options?: string[]
  placeholder?: string
}

interface TaskTemplate {
  id: string
  name: string
  description: string
  parameters?: TemplateParameter[] | null
}

const templates = ref<TaskTemplate[]>([])
type CycleType = 'month' | 'week' | 'day' | 'hour' | 'n_day' | 'n_hour' | 'n_minute'

interface CycleTimeEntry {
  day: number
  hour: number
  minute: number
}

interface TaskCycle {
  type: CycleType
  monthTimes: CycleTimeEntry[]
  weekTimes: CycleTimeEntry[]
  dayHour: number
  dayMinute: number
  hourMinute: number
  customCron: string
  n_day: number
  n_hour: number
  n_minute: number
}

const weekDays = computed(() => {
  const locale = i18n.locale || 'zh-CN'
  const localeMessages = (i18n.global as any)?.getLocaleMessage?.(locale) || {}
  const labels = localeMessages?.task?.cron?.weekdays
  const normalizedLabels = Array.isArray(labels) && labels.length === 7 ? labels : fallbackWeekdays
  return [1, 2, 3, 4, 5, 6, 0].map((value) => ({ day: normalizedLabels[value], value }))
})

const cycleTypeOptions = computed(() => [
  { value: 'month', label: i18n.t('task.editor.everyMonth') },
  { value: 'week', label: i18n.t('task.editor.everyWeek') },
  { value: 'day', label: i18n.t('task.editor.everyDay') },
  { value: 'hour', label: i18n.t('task.editor.everyHour') },
  { value: 'n_day', label: i18n.t('task.editor.everyNDay') },
  { value: 'n_hour', label: i18n.t('task.editor.everyNHour') },
  { value: 'n_minute', label: i18n.t('task.editor.everyNMinute') }
])

const createDefaultCycle = (type: CycleType = 'day'): TaskCycle => ({
  type,
  monthTimes: [
    {
      day: 1,
      hour: 0,
      minute: 0
    }
  ],
  weekTimes: [
    {
      day: 1,
      hour: 0,
      minute: 0
    }
  ],
  dayHour: 0,
  dayMinute: 0,
  hourMinute: 0,
  customCron: '',
  n_day: 1,
  n_hour: 1,
  n_minute: 1
})

const ruleForm = reactive({
  name: '',
  task_type: 'template',
  template_id: 'disk-usage-report',
  template_params: {} as Record<string, string>,
  command: '',
  notify_on_failure: false,
  timeout_seconds: 1800,
  concurrency_policy: 'forbid',
  cycles: [createDefaultCycle()]
})

const rules = reactive<FormRules>({
  // cron_type: [
  //   { required: true, message: '请选择任务类型', trigger: 'change' }
  // ],
  name: [
    { required: true, message: i18n.t('task.editor.taskNameRequired'), trigger: 'blur' }
  ],
  command: [
    {
      required: true,
      message: i18n.t('task.editor.commandRequired'),
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (ruleForm.task_type === 'shell' && !value) {
          callback(new Error(i18n.t('task.editor.commandRequired')))
        } else {
          callback()
        }
      }
    }
  ]
})

const selectedTemplate = computed(() =>
  templates.value.find((template) => template.id === ruleForm.template_id)
)
const selectedTemplateParameters = computed(() =>
  Array.isArray(selectedTemplate.value?.parameters) ? selectedTemplate.value.parameters : []
)

watch(() => ruleForm.template_id, () => {
  if (!selectedTemplate.value) return
  const allowed = new Set(selectedTemplateParameters.value.map((parameter) => parameter.name))
  Object.keys(ruleForm.template_params).forEach((name) => {
    if (!allowed.has(name)) delete ruleForm.template_params[name]
  })
})

const loadTemplates = async () => {
  const { data } = await Api.getPlanTaskTemplates()
  templates.value = data || []
  if (!templates.value.some((template) => template.id === ruleForm.template_id)) {
    ruleForm.template_id = templates.value[0]?.id || ''
  }
}

const handleCycleChange = (type: string, index: number) => {
  const cycle = ruleForm.cycles[index]
  cycle.type = type as CycleType

  switch (type) {
    case 'hour':
      cycle.customCron = '0 * * * *'
      break
    case 'day':
      cycle.customCron = '0 0 * * *'
      break
    case 'week':
      cycle.customCron = '0 0 * * 0'
      break
    case 'month':
      cycle.customCron = '0 0 1 * *'
      break
    case 'n_day':
      cycle.customCron = `0 0 */${cycle.n_day} * *`
      break
    case 'n_hour':
      cycle.customCron = `0 */${cycle.n_hour} * * *`
      break
    case 'n_minute':
      cycle.customCron = `*/${cycle.n_minute} * * * *`
      break
    default:
      break
  }
}

const handleClose = () => {
  drawer.value = false
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!ruleFormRef.value) return

  // 手动验证执行周期
  if (!ruleForm.cycles || ruleForm.cycles.length === 0) {
    ElMessage.error(i18n.t('task.editor.cycleRequired'))
    return
  }
  if (ruleForm.task_type === 'template') {
    if (!selectedTemplate.value) {
      ElMessage.error(i18n.t('task.editor.templateRequired'))
      return
    }
    const missing = selectedTemplateParameters.value.find((parameter) =>
      parameter.required && !String(ruleForm.template_params[parameter.name] || '').trim()
    )
    if (missing) {
      ElMessage.error((i18n.t as any)('task.editor.parameterRequired', { name: missing.label }))
      return
    }
  } else if (!confirmUnsafeShell.value) {
    ElMessage.error(i18n.t('task.editor.unsafeShellConfirmRequired'))
    return
  }

  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 转换所有周期为 cron 表达式数组
        const cronExpressions = ruleForm.cycles.flatMap((cycle) => {
          switch (cycle.type) {
            case 'hour':
              return [`${cycle.hourMinute} * * * *`]
            case 'day':
              return [`${cycle.dayMinute} ${cycle.dayHour} * * *`]
            case 'week':
              return [`${cycle.weekTimes[0].minute} ${cycle.weekTimes[0].hour} * * ${cycle.weekTimes[0].day}`]
            case 'month':
              return [`${cycle.monthTimes[0].minute} ${cycle.monthTimes[0].hour} ${cycle.monthTimes[0].day} * *`]
            case 'n_day':
              return [`${cycle.dayMinute} ${cycle.dayHour} */${cycle.n_day} * *`]
            case 'n_hour':
              return [`${cycle.hourMinute} */${cycle.n_hour} * * *`]
            case 'n_minute':
              return [`*/${cycle.n_minute} * * * *`]
            default:
              return []
          }
        })

        let apidata: {
            name: string;
            schedule: string[];
            command: string;
            task_type: string;
            template_id: string;
            template_params: Record<string, string>;
            confirm_unsafe_shell: boolean;
            enabled: boolean;
            notify_on_failure: boolean;
            timeout_seconds: number;
            concurrency_policy: string;
            [key: string]: any; // 索引签名，允许添加任意属性
        } = {
            name: ruleForm.name,
            schedule: cronExpressions,
            command: ruleForm.task_type === 'shell' ? ruleForm.command : '',
            task_type: ruleForm.task_type,
            template_id: ruleForm.task_type === 'template' ? ruleForm.template_id : '',
            template_params: ruleForm.task_type === 'template' ? ruleForm.template_params : {},
            confirm_unsafe_shell: ruleForm.task_type === 'shell' && confirmUnsafeShell.value,
            enabled: props.type ? true : props.formData?.enabled !== false,
            notify_on_failure: ruleForm.notify_on_failure,
            timeout_seconds: ruleForm.timeout_seconds,
            concurrency_policy: ruleForm.concurrency_policy
        };
        if (!props.type && props.formData && props.formData.id) {
          apidata.id = props.formData.id 
          // (apidata as { id: number | string }).id = props.formData.id;
        }else{
          // delete (apidata as { id: number | string }).id;
          delete apidata.id
        }
        const { data } = await Api[props.type ? 'addPlanTask' :'updataPlanTask'](apidata)
        emit('taskAdded', data) 
        ElMessage.success(i18n.t(props.type ? 'task.editor.addSuccess' : 'task.editor.updateSuccess'))
        emit('success')
        handleClose()
      } catch (error) {
        ElMessage.error(i18n.t('task.editor.operationFailed'))
      }
    }
  })
}

// 监听父组件传值
watch(() => props.modelValue, (val) => {
  drawer.value = val
})

// 监听formData变化,用于修改时回填数据
watch(() => props.formData, (val) => {
    if (val && !props.type) {
        const cronTimes = val.schedule.split(',');
        ruleForm.name = val.name;
        ruleForm.cycles = [];
        ruleForm.task_type = val.task_type || 'shell';
        ruleForm.template_id = val.template_id || 'disk-usage-report';
        ruleForm.template_params = { ...(val.template_params || {}) };
        ruleForm.command = val.command;
        ruleForm.notify_on_failure = Boolean(val.notify_on_failure);
        confirmUnsafeShell.value = false;
        ruleForm.timeout_seconds = val.timeout_seconds || 1800;
        ruleForm.concurrency_policy = val.concurrency_policy || 'forbid';
        ruleForm.name = val.name;
      copy_content.value = val.command;

        cronTimes.forEach((cronTime: string) => {
            const [minutes, hours, dayOfMonth, month, dayOfWeek] = cronTime.split(' ');
            const cycle = createDefaultCycle();
            cycle.customCron = cronTime

            if (hours === '*' && minutes.startsWith('*/')) {
                cycle.type = 'n_minute';
                cycle.n_minute = parseInt(minutes.split('/')[1]);
            } else if (hours.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
                cycle.type = 'n_hour';
                cycle.n_hour = parseInt(hours.split('/')[1]);
                cycle.hourMinute = parseInt(minutes);
            } else if (dayOfMonth.startsWith('*/') && month === '*' && dayOfWeek === '*') {
                cycle.type = 'n_day';
                cycle.n_day = parseInt(dayOfMonth.split('/')[1]);
                cycle.dayHour = parseInt(hours);
                cycle.dayMinute = parseInt(minutes);
            } else if (hours === '0' && minutes === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
                cycle.type = 'day';
                cycle.dayHour = 0;
                cycle.dayMinute = 0;
            } else if (dayOfMonth === '*' && month === '*' && /^\d+$/.test(dayOfWeek)) {
                cycle.type = 'week';
                cycle.weekTimes[0] = {
                  day: parseInt(dayOfWeek),
                  hour: parseInt(hours),
                  minute: parseInt(minutes)
                };
            } else if (month === '*' && /^\d+$/.test(dayOfMonth)) {
                cycle.type = 'month';
                cycle.monthTimes[0] = {
                  day: parseInt(dayOfMonth),
                  hour: parseInt(hours),
                  minute: parseInt(minutes)
                };
            } else if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
                cycle.type = 'day';
                cycle.dayHour = parseInt(hours);
                cycle.dayMinute = parseInt(minutes);
            } else {
                cycle.type = 'day';
            }

            ruleForm.cycles.push(cycle);
        });
        if (!ruleForm.cycles.length) {
          ruleForm.cycles = [createDefaultCycle()]
        }
    }else{
      ruleForm.name= ''
      ruleForm.task_type = 'template'
      ruleForm.template_id = 'disk-usage-report'
      ruleForm.template_params = {}
      ruleForm.command = ''
      ruleForm.notify_on_failure = false
      confirmUnsafeShell.value = false
      ruleForm.timeout_seconds = 1800
      ruleForm.concurrency_policy = 'forbid'
      copy_content.value =  ''
      ruleForm.cycles = [createDefaultCycle()]
  
    }
}, { immediate: true });

onMounted(() => {
  void loadTemplates()
})

// 添加新的周期行
const addCycle = () => {
  ruleForm.cycles.push(createDefaultCycle())
}

// 删除周期行
const removeCycle = (index: number) => {
  if (ruleForm.cycles.length > 1) {
    ruleForm.cycles.splice(index, 1)
  }
}

const handleScriptInput = (event: Event) => {
  const target = event.target as HTMLPreElement;
  if (target) {
    ruleForm.command = target.innerText;
  }
}

</script>

<style scoped lang="less">
.el-form {
  :deep(.el-form-item) {
    .el-form-item__label {
      padding-bottom: 8px;
    }
    
    .el-form-item__content {
      margin-left: 0 !important;
    }
  }
}

.task-drawer-form {
  max-width: 680px;
}

.schedule-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cycle-row {
  width: 100%;
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr) auto;
  align-items: start;
  margin-bottom: 16px;
  gap: 16px;

  .cycle-inputs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    min-width: 0;
    // padding: 14px 16px;
    // border: 1px solid var(--border-subtle);
    border-radius: 12px;
    // background: var(--surface-card);

    .el-input-number,
    .el-select {
      width: 120px;
    }
  }

  .cycle-actions {
    display: flex;
    gap: 8px;
    padding-top: 6px;
  }
}

.cycle-type-select {
  width: 168px;
}

.schedule-add-actions {
  display: flex;
  justify-content: flex-start;
}

.time-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.inline-prefix,
.inline-unit {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

:deep(.cycle-inputs .el-input-number) {
  width: 136px;
}

:deep(.cycle-inputs .el-select) {
  min-width: 136px;
}

:deep(.cycle-inputs.week .el-select) {
  min-width: 160px;
}

:deep(.cycle-inputs .el-input-number .el-input__wrapper),
:deep(.cycle-inputs .el-select .el-select__wrapper) {
  min-height: 44px;
  border-radius: 10px;
}

.tip-text {
  color: #909399;
  font-size: 12px;
  margin-left: 10px;
}

.template-description {
  margin-top: 8px;
  color: #909399;
  line-height: 1.5;
}

.option-description {
  float: right;
  max-width: 60%;
  overflow: hidden;
  color: #909399;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-row {
  margin-bottom: 0;
}

.code-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #1e1e1e;
  width: 100%;
  .code-editor {
    margin: 0;
    padding: 12px;
    min-height: 200px;
    width: 100%;
    box-sizing: border-box;
    font-family: Monaco, Menlo, Consolas, 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #d4d4d4;
    white-space: pre-wrap;
    word-wrap: break-word;
    outline: none;
    
    &:focus {
      border-color: var(--el-color-primary);
    }
    
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #666;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-track {
      background: #1e1e1e;
    }
  }
}

@media (max-width: 640px) {
  .cycle-row {
    grid-template-columns: 1fr;
    gap: 10px;

    > .cycle-type-select {
      width: 100% !important;
    }

    .cycle-inputs {
      flex: 1 1 100%;
      min-width: 0;
      flex-wrap: wrap;
    }
  }

  .time-row {
    flex-wrap: wrap;
  }

  :deep(.cycle-inputs .el-input-number),
  :deep(.cycle-inputs .el-select) {
    width: 100%;
  }

  .tip-text {
    margin-left: 0;
  }
}
</style>
