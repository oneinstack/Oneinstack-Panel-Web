<template>
  <el-drawer
    v-model="drawer"
    :direction="direction"
    size="50%"
    :before-close="handleClose"
  >
    <template #header>
      <div class="drawer-header" style="padding: 20px;font-size: 16px;">
        <span class="title">{{ type ? $t('task.addScheduleTask') : $t('task.editScheduleTask') }}</span>
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

      <el-form-item :label="$t('task.taskName')" prop="name" required>
        <el-input v-model="ruleForm.name" :placeholder="$t('commons.rule.taskName')" />
      </el-form-item>

      <el-form-item :label="$t('task.scriptContents')" prop="command" >
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

      <el-form-item :label="$t('task.exeCycle')" required>
        <div v-for="(cycle, index) in ruleForm.cycles" :key="index" class="cycle-row">
          <el-select v-model="cycle.type" @change="(val:string) => handleCycleChange(val, index)" placeholder="请选择执行周期" style="width: 100px;">
            <el-option :label="$t('commons.units.perMinute')" value="minute" />
            <el-option :label="$t('commons.units.perHour')" value="hour" />
            <el-option :label="$t('commons.units.perDay')" value="day" />
            <el-option :label="$t('commons.units.perWeek')" value="week" />
            <el-option :label="$t('commons.units.perMonth')" value="month" />
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
                    :placeholder="$t('commons.rule.select')"
                    style="width: 120px"
                  >
                    <template #suffix><span>{{$t('commons.units.day')}}</span></template>
                  </el-input-number>
                </div>
                <div class="time-input-group">
                  <el-input-number 
                    controls-position="right"
                    v-model="monthTime.hour" 
                    :min="0" 
                    :max="23" 
                    :placeholder="$t('commons.rule.select')"
                    style="width: 120px"
                  >
                    <template #suffix><span>{{$t('commons.units.hour')}}</span></template>
                  </el-input-number>
                </div>
                <div class="time-input-group">
                  <el-input-number 
                    controls-position="right"
                    v-model="monthTime.minute" 
                    :min="0" 
                    :max="59" 
                    :placeholder="$t('commons.rule.select')"
                    style="width: 120px"
                  >
                    <template #suffix><span>{{$t('commons.units.minute')}}</span></template>
                  </el-input-number>
                </div>
                
              </div>
            </template>

            <template v-if="cycle.type === 'week'">
              <div v-for="(weekTime, wIndex) in cycle.weekTimes" :key="wIndex" class="time-row">
                <el-select v-model="weekTime.day" :placeholder="$t('commons.rule.select')">
                  <el-option v-for="i in weekDays" :key="i.value" :label="`${i.day}`" :value="i.value" />
                </el-select>
                <el-input-number 
                  controls-position="right"
                  v-model="weekTime.hour" 
                  :min="0" 
                  :max="23" 
                  :placeholder="$t('commons.rule.select')"
                  style="width: 120px"
                >
                  <template #suffix><span>{{$t('commons.units.hour')}}</span></template>
                </el-input-number>
                <el-input-number 
                  controls-position="right"
                  v-model="weekTime.minute" 
                  :min="0" 
                  :max="59" 
                  :placeholder="$t('commons.rule.select')"
                  style="width: 120px"
                >
                  <template #suffix><span>{{$t('commons.units.minute')}}</span></template>
                </el-input-number>
              </div>
            </template>

            <template v-if="cycle.type === 'day'">
              <el-input-number 
                controls-position="right"
                v-model="cycle.dayHour" 
                :min="0" 
                :max="23" 
                :placeholder="$t('commons.rule.select')"
                style="width: 120px"
              >
                <template #suffix><span>{{$t('commons.units.hour')}}</span></template>
              </el-input-number>
              <el-input-number 
                controls-position="right"
                v-model="cycle.dayMinute" 
                :min="0" 
                :max="59" 
                :placeholder="$t('commons.rule.select')"
                style="width: 120px"
              >
                <template #suffix><span>{{$t('commons.units.minute')}}</span></template>
              </el-input-number>
            </template>

            <template v-if="cycle.type === 'hour'">
              <el-input-number 
                controls-position="right"
                v-model="cycle.hourMinute" 
                :min="0" 
                :max="59" 
                :placeholder="$t('commons.rule.select')"
                style="width: 120px"
              >
                <template #suffix><span>{{$t('commons.units.minute')}}</span></template>
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
            <el-icon><Plus />{{$t('commons.button.add')}}</el-icon>
          </el-button>
        </div>
        
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="flex: auto; text-align: right; padding: 0 20px">
        <el-button @click="handleClose">{{ $t('commons.button.cancel')}}</el-button>
        <el-button type="primary" @click="handleSubmit">{{$t('commons.button.confirm')}}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">

import { Api } from '@/api/Api'
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
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
const weekDays = [
  { day: t('commons.units.monday'), value: 1 },
  { day: t('commons.units.tuesday'), value: 2 },
  { day: t('commons.units.wednesday'), value: 3 },
  { day: t('commons.units.thursday'), value: 4 },
  { day: t('commons.units.friday'), value: 5 },
  { day: t('commons.units.saturday'), value: 6 },
  { day: t('commons.units.sunday'), value: 7 }
]

const ruleForm = reactive({
  // cron_type: 'shell',
  name: '',
  command: '',
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
    { required: true, message: t('commons.rule.taskName'), trigger: 'blur' }
  ],
  command: [
    {
      required: true,
      message: t('commons.rule.scriptContents'),
      trigger: 'blur',
      validator: (rule, value, callback) => {
        // if (ruleForm.cron_type === 'shell' && !value) {
          if (!value) {
          callback(new Error(t('commons.rule.scriptContents')))
        } else {
          callback()
        }
      }
    }
  ]
})

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
    ElMessage.error(t('commons.rule.exeCycle'))
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
              return [generateCronExpression(cycle.n_minute, 0)]
            default:
              return []
          }
        })

        // 打印生成的 cron 表达式数组
        console.log('Cron expressions:', cronExpressions)
        let apidata: {
            name: string;
            schedule: string[];
            command: string;
            enabled: boolean;
            [key: string]: any; // 索引签名，允许添加任意属性
        } = {
            name: ruleForm.name,
            schedule: cronExpressions,
            command: ruleForm.command,
            enabled: true
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
        ElMessage.success(props.type ? t('commons.msg.addSuccess') : t('commons.msg.editSuccess'))
        emit('success')
        handleClose()
      } catch (error) {
        ElMessage.error(t('commons.msg.operationFailed'))
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
        // ruleForm.cron_type = val.cron_type;
        ruleForm.name = val.name;
        ruleForm.cycles = [];
        ruleForm.command = val.command;
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
      ruleForm.command = ''
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
