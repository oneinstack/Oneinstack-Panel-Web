<template>
  <el-drawer
    v-model="drawer"
    :direction="direction"
    size="50%"
    :before-close="handleClose"
  >
    <template #header>
      <div class="drawer-header" style="padding: 20px;font-size: 16px;">
        <span class="title">{{ type ? '添加计划任务' : '修改计划任务' }}</span>
      </div>
    </template>
    <el-form
      ref="ruleFormRef"
      :model="ruleForm"
      :rules="rules"
      label-position="top"
      style="padding: 0 20px"
    >
      <!-- <el-form-item label="任务类型" prop="cron_type" required>
        <el-select v-model="ruleForm.cron_type" placeholder="请选择任务类型">
          <el-option label="Shell脚本" value="shell" />
        </el-select>
      </el-form-item> -->

      <el-form-item label="任务名称" prop="name" required>
        <el-input v-model="ruleForm.name" placeholder="请输入任务名称" />
      </el-form-item>

      <el-form-item label="任务类型" required>
        <el-radio-group v-model="ruleForm.task_type">
          <el-radio-button value="template">安全模板</el-radio-button>
          <el-radio-button value="shell">高级 Shell</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="ruleForm.task_type === 'template'">
        <el-alert
          type="success"
          :closable="false"
          show-icon
          title="安全模板使用固定可执行文件和结构化参数，不经过 Shell 解析。"
          style="margin-bottom: 18px"
        />
        <el-form-item label="任务模板" required>
          <el-select v-model="ruleForm.template_id" style="width: 100%" placeholder="请选择模板">
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
            :placeholder="parameter.placeholder || `请选择${parameter.label}`"
          >
            <el-option v-for="option in parameter.options" :key="option" :label="option" :value="option" />
          </el-select>
          <el-input
            v-else
            v-model="ruleForm.template_params[parameter.name]"
            :placeholder="parameter.placeholder || `请输入${parameter.label}`"
          />
          <span v-if="parameter.description" class="tip-text">{{ parameter.description }}</span>
        </el-form-item>
      </template>

      <template v-else>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          title="高级 Shell 将以面板进程权限执行。请优先使用安全模板，仅在确认脚本来源和影响范围后启用。"
          style="margin-bottom: 18px"
        />
      <el-form-item label="脚本内容" prop="command" >
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
            我确认该脚本可信，并理解其将以面板权限执行
          </el-checkbox>
        </el-form-item>
      </template>

      <el-form-item label="超时时间">
        <el-input-number
          v-model="ruleForm.timeout_seconds"
          :min="1"
          :max="86400"
          controls-position="right"
        />
        <span class="tip-text">秒；超时后终止整个命令进程组</span>
      </el-form-item>

      <el-form-item label="并发策略">
        <el-select v-model="ruleForm.concurrency_policy" style="width: 240px">
          <el-option label="禁止重叠（推荐）" value="forbid" />
        </el-select>
        <span class="tip-text">前一次未结束时，新调度会记录为“已跳过”</span>
      </el-form-item>

      <el-form-item label="失败通知">
        <el-switch v-model="ruleForm.notify_on_failure" />
        <span class="tip-text">失败或超时后使用“监控告警”中已启用的通知通道发送告警</span>
      </el-form-item>

      <el-form-item label="执行周期" required>
        <div v-for="(cycle, index) in ruleForm.cycles" :key="index" class="cycle-row">
          <el-select v-model="cycle.type" @change="(val:string) => handleCycleChange(val, index)" placeholder="请选择执行周期" style="width: 100px;">
            <el-option label="每分钟" value="minute" />
            <el-option label="每小时" value="hour" />
            <el-option label="每天" value="day" />
            <el-option label="每周" value="week" />
            <el-option label="每月" value="month" />
            <!-- <el-option label="每N分钟" value="n_minute" /> -->
          </el-select>

          <div class="cycle-inputs" :class="cycle.type">
            <template v-if="cycle.type === 'month'" >
              <div v-for="(monthTime, mIndex) in cycle.monthTimes" :key="mIndex" class="time-row">
                <div class="time-input-group">
                  <el-input-number 
                    controls-position="right"
                    v-model="monthTime.day" 
                    :min="1" 
                    :max="31" 
                    placeholder="请输入"
                    style="width: 120px"
                  >
                    <template #suffix><span>日</span></template>
                  </el-input-number>
                </div>
                <div class="time-input-group">
                  <el-input-number 
                    controls-position="right"
                    v-model="monthTime.hour" 
                    :min="0" 
                    :max="23" 
                    placeholder="请输入"
                    style="width: 120px"
                  >
                    <template #suffix><span>时</span></template>
                  </el-input-number>
                </div>
                <div class="time-input-group">
                  <el-input-number 
                    controls-position="right"
                    v-model="monthTime.minute" 
                    :min="0" 
                    :max="59" 
                    placeholder="请输入"
                    style="width: 120px"
                  >
                    <template #suffix><span>分</span></template>
                  </el-input-number>
                </div>
                
              </div>
            </template>

            <template v-if="cycle.type === 'week'">
              <div v-for="(weekTime, wIndex) in cycle.weekTimes" :key="wIndex" class="time-row">
                <el-select v-model="weekTime.day" placeholder="请输入">
                  <el-option v-for="i in weekDays" :key="i.value" :label="`周${i.day}`" :value="i.value" />
                </el-select>
                <el-input-number 
                  controls-position="right"
                  v-model="weekTime.hour" 
                  :min="0" 
                  :max="23" 
                  placeholder="请输入"
                  style="width: 120px"
                >
                  <template #suffix><span>时</span></template>
                </el-input-number>
                <el-input-number 
                  controls-position="right"
                  v-model="weekTime.minute" 
                  :min="0" 
                  :max="59" 
                  placeholder="请输入"
                  style="width: 120px"
                >
                  <template #suffix><span>分</span></template>
                </el-input-number>
              </div>
            </template>

            <template v-if="cycle.type === 'day'">
              <el-input-number 
                controls-position="right"
                v-model="cycle.dayHour" 
                :min="0" 
                :max="23" 
                placeholder="请输入"
                style="width: 120px"
              >
                <template #suffix><span>时</span></template>
              </el-input-number>
              <el-input-number 
                controls-position="right"
                v-model="cycle.dayMinute" 
                :min="0" 
                :max="59" 
                placeholder="请输入"
                style="width: 120px"
              >
                <template #suffix><span>分</span></template>
              </el-input-number>
            </template>

            <template v-if="cycle.type === 'hour'">
              <el-input-number 
                controls-position="right"
                v-model="cycle.hourMinute" 
                :min="0" 
                :max="59" 
                placeholder="请输入"
                style="width: 120px"
              >
                <template #suffix><span>分</span></template>
              </el-input-number>
            </template>

            <template v-if="cycle.type === 'n_minute'">
              <el-input-number 
                controls-position="right"
                v-model="cycle.n_minute" 
                :min="1" 
                placeholder="请输入N值"
                style="width: 120px"
              />
            </template>

          </div>
          <div class="cycle-actions">
            <el-button type="danger" link @click="removeCycle(index)" v-if="ruleForm.cycles.length > 1">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="cycle-actions" style="width: 100%;">
          <el-button type="primary"  @click="addCycle" >
            <el-icon><Plus />添加</el-icon>
          </el-button>
        </div>
        
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="flex: auto; text-align: right; padding: 0 20px">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">

import { Api } from '@/api/Api'
import { computed, onMounted, ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: boolean
  type?: boolean // true为新增,false为修改
  formData?: any
}>()

const emit = defineEmits(['update:modelValue', 'success', 'taskAdded'])
const codeEditorRef = ref(null);
const drawer = ref(false)
const direction = ref<'rtl' | 'ltr' | 'ttb' | 'btt'>('rtl')
const ruleFormRef = ref<FormInstance>()
const copy_content = ref('')
const confirmUnsafeShell = ref(false)

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
const weekDays = [
  { day: '一', value: 1 },
  { day: '二', value: 2 },
  { day: '三', value: 3 },
  { day: '四', value: 4 },
  { day: '五', value: 5 },
  { day: '六', value: 6 },
  { day: '日', value: 0 }
]

const ruleForm = reactive({
  name: '',
  task_type: 'template',
  template_id: 'disk-usage-report',
  template_params: {} as Record<string, string>,
  command: '',
  notify_on_failure: false,
  timeout_seconds: 1800,
  concurrency_policy: 'forbid',
  cycles: [
    {
      type: 'day',
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
      n_minute: 1
    }
  ]
})

const rules = reactive<FormRules>({
  // cron_type: [
  //   { required: true, message: '请选择任务类型', trigger: 'change' }
  // ],
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  command: [
    {
      required: true,
      message: '请输入脚本内容',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (ruleForm.task_type === 'shell' && !value) {
          callback(new Error('请输入脚本内容'))
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

  switch (type) {
    case 'minute':
      cycle.customCron = '* * * * *'
      break
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
    ElMessage.error('请设置执行周期')
    return
  }
  if (ruleForm.task_type === 'template') {
    if (!selectedTemplate.value) {
      ElMessage.error('请选择安全任务模板')
      return
    }
    const missing = selectedTemplateParameters.value.find((parameter) =>
      parameter.required && !String(ruleForm.template_params[parameter.name] || '').trim()
    )
    if (missing) {
      ElMessage.error(`请填写${missing.label}`)
      return
    }
  } else if (!confirmUnsafeShell.value) {
    ElMessage.error('请确认高级 Shell 的执行风险')
    return
  }

  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 转换所有周期为 cron 表达式数组
        const cronExpressions = ruleForm.cycles.flatMap((cycle) => {
          switch (cycle.type) {
            case 'minute':
              return ['* * * * *']
            case 'hour':
              return [`${cycle.hourMinute} * * * *`]
            case 'day':
              return [`${cycle.dayMinute} ${cycle.dayHour} * * *`]
            case 'week':
              return cycle.weekTimes.map((time) =>
                `${time.minute} ${time.hour} * * ${time.day}`
              )
            case 'month':
              return cycle.monthTimes.map((time) =>
                `${time.minute} ${time.hour} ${time.day} * *`
              )
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
        ElMessage.success(props.type ? '添加成功' : '修改成功')
        emit('success')
        handleClose()
      } catch (error) {
        ElMessage.error('操作失败')
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
            let cycle: any = {
                customCron: cronTime
            };

            if (cronTime === '* * * * *') {
                cycle.type = 'minute';
            } else if (hours === '*' && minutes.startsWith('*/')) {
                cycle.type = 'n_minute';
                cycle.n_minute = parseInt(minutes.split('/')[1]);
            } else if (hours === '0' && minutes === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
                cycle.type = 'day';
                cycle.dayHour = 0;
                cycle.dayMinute = 0;
            } else if (dayOfMonth === '*' && month === '*' && /^\d+$/.test(dayOfWeek)) {
                cycle.type = 'week';
                cycle.weekTimes = [
                    {
                        day: parseInt(dayOfWeek),
                        hour: parseInt(hours),
                        minute: parseInt(minutes)
                    }
                ];
            } else if (month === '*' && /^\d+$/.test(dayOfMonth)) {
                cycle.type = 'month';
                cycle.monthTimes = [
                    {
                        day: parseInt(dayOfMonth),
                        hour: parseInt(hours),
                        minute: parseInt(minutes)
                    }
                ];
            } else if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
                cycle.type = 'day';
                cycle.dayHour = parseInt(hours);
                cycle.dayMinute = parseInt(minutes);
            }

            ruleForm.cycles.push(cycle);
        });
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
  ruleForm.cycles = [
    {
      type: 'day',
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
      n_minute: 1
    }
  ]
  
    }
}, { immediate: true });

onMounted(() => {
  void loadTemplates()
})

// 添加新的周期行
const addCycle = () => {
  ruleForm.cycles.push({
    type: 'day',
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
    n_minute: 1,
  })
}

// 删除周期行
const removeCycle = (index: number) => {
  if (ruleForm.cycles.length > 1) {
    ruleForm.cycles.splice(index, 1)
  }
}

function generateCronExpression(minutesInput: number, hoursInput: number): string {
  // 初始化 Cron 表达式的各个部分
  let minutes = minutesInput % 60;
  let hours = Math.floor(minutesInput / 60) + hoursInput;
  let days = 1;
  let months = 1;
  let weeks = "*";

  // 处理小时进位到天
  if (hours >= 24) {
    days += Math.floor(hours / 24);
    hours = hours % 24;
  }

  // 处理天进位到月（简单假设每月 30 天）
  if (days > 30) {
    months += Math.floor(days / 30);
    days = days % 30;
    if (days === 0) {
      days = 30;
    }
  }

  // 处理月进位到年（简单假设一年 12 个月）
  if (months > 12) {
    months = months % 12;
    if (months === 0) {
      months = 12;
    }
  }

  // 生成新的 Cron 表达式
  return `${minutes} ${hours} ${days} ${months} ${weeks}`;
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

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.cycle-row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;

  .cycle-inputs {
    display: flex;
    gap: 8px;

    .el-input-number,
    .el-select {
      width: 120px;
    }
  }

  .cycle-actions {
    display: flex;
    gap: 8px;
  }
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
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
  width: 100%;

  &:last-child {
    margin-bottom: 0;
  }

  .time-actions {
    display: flex;
    gap: 8px;
  }
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
</style>
