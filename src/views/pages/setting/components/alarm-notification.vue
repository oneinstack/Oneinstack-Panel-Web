<script setup lang="ts">
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import i18n from '@/lang'
import { computed } from 'vue'

const t = i18n.t as any

const column = computed<ColumnItem[]>(() => [
  {
    label: t('setting.alarmPage.title'),
    prop: '',
    width: 200
  },
  {
    label: t('setting.alarmPage.status'),
    prop: ''
  },
  {
    label: t('setting.alarmPage.method'),
    prop: ''
  },
  {
    label: t('setting.alarmPage.condition'),
    prop: ''
  },
  {
    label: t('setting.alarmPage.action'),
    prop: '',
    width: 180,
    fixed: 'right'
  }
])
</script>

<template>
  <div>
    <div class="flex">
      <div class="btnItem mr-2">{{ t('setting.alarmPage.list') }}</div>
      <div class="btnItem mr-2">{{ t('setting.alarmPage.settings') }}</div>
      <div class="btnItem">{{ t('setting.alarmPage.logs') }}</div>
    </div>
    <div class="box2" style="padding: 24px 30px">
      <el-form label-width="auto">
        <el-form-item :label="t('setting.alarmPage.taskType')">
          <el-select :placeholder="t('setting.alarmPage.certificateExpiry')"></el-select>
        </el-form-item>
        <el-form-item :label="t('setting.alarmPage.website')">
          <el-select :placeholder="t('setting.alarmPage.allWebsites')"></el-select>
        </el-form-item>
        <el-form-item :label="t('setting.alarmPage.remainingDays')">
          <el-input>
            <template #append>
              <span>{{ t('setting.alarmPage.days') }}</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('setting.alarmPage.sendCount')">
          <el-input>
            <template #append>
              <span>{{ t('setting.alarmPage.times') }}</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('setting.alarmPage.method')">
          <el-checkbox-group>
            <el-checkbox>{{ t('setting.alarmPage.email') }}</el-checkbox>
            <el-checkbox>{{ t('setting.alarmPage.dingtalk') }}</el-checkbox>
            <el-checkbox>{{ t('setting.alarmPage.feishu') }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div class="flex justify-between" style="margin: 36px 0 20px">
        <el-button type="primary">{{ t('setting.alarmPage.addTask') }}</el-button>
        <div>
          <el-button>{{ t('setting.alarmPage.start') }}</el-button>
          <el-button>{{ t('setting.alarmPage.stop') }}</el-button>
          <el-button>{{ t('setting.alarmPage.stop') }}</el-button>
        </div>
      </div>
      <custom-table :data="[]" :columns="column" selection>
        <template #empty>
          <div class="flex column justify-between items-center" style="margin-top: 26px">
            <img src="/static/images/empty.webp" alt="" />
            <span style="color: var(--font-color-gray-light)">{{ t('setting.alarmPage.empty') }}</span>
          </div>
        </template>
      </custom-table>
    </div>
  </div>
</template>

<style scoped lang="less">
:deep(.el-select), :deep(.el-input) {
  width: 297px;

  &.is-disabled {
    .el-input__wrapper,
    .el-input-group__append {
      background: rgb(var(--category-item-bg-color)) !important;
    }
  }

  &__wrapper {
    background: transparent !important;
    box-shadow: 0 0 0 0.4px #7d8389 inset !important;
  }

  &-group__append {
    background: rgb(var(--category-item-bg-color)) !important;
    border: 0.1px solid #7d838980 !important;
    box-shadow: none !important;
    border-left: none !important;
  }
}
</style>
