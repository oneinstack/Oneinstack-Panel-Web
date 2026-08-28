<script setup lang="ts">
import { reactive } from 'vue'
import Scheduled from '@/views/pages/task/components/scheduled.vue'
import i18n from '@/lang'

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const conf = reactive({
  activeIndex: 0,
  list: [
    {
      name: t('task.scheduled', '计划任务'),
      nameKey: 'task.scheduled',
      index: 0,
      component: Scheduled
    },
    // ,{
    //   name: '任务编排',
    //   nameKey: 'task.orchestration',
    //   index: 1
    // },
    // {
    //   name: '脚本库',
    //   nameKey: 'task.scriptLibrary',
    //   index: 2
    // }
  ],
  clickActive: (item: any) => {
    conf.activeIndex = item.index
  }
})
</script>
<template>
  <div class="task-container">
    <!-- <card-tabs :list="conf.list" :activeIndex="conf.activeIndex" :clickActive="conf.clickActive" /> -->
    <component :is="conf.list[conf.activeIndex].component" />
  </div>
</template>
<style scoped lang="less"></style>
