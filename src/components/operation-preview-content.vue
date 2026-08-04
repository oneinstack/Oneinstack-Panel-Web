<script setup lang="ts">
import { computed } from 'vue'
import type { OperationPreview } from '@/utils/operationPreview'

const props = defineProps<{
  preview: OperationPreview
}>()

const riskType = computed(() => {
  const level = props.preview.review?.riskLevel
  if (level === 'high') return 'error'
  if (level === 'medium') return 'warning'
  return 'info'
})

const impactLabels: Array<[keyof NonNullable<OperationPreview['impact']>, string]> = [
  ['writeFiles', '会写入配置文件'],
  ['modifyDatabase', '会修改面板记录'],
  ['restartService', '会重启服务'],
  ['reloadService', '会重载服务'],
  ['networkRisk', '可能影响网络连接']
]

const failedPrechecks = computed(() =>
  (props.preview.prechecks || []).filter((item) => item.status === 'failed')
)

const hasImpact = computed(() =>
  impactLabels.some(([key]) => props.preview.impact?.[key])
)
</script>

<template>
  <div class="operation-preview">
    <el-alert
      v-if="preview.review?.reason"
      :title="preview.review.reason"
      :type="riskType"
      :closable="false"
      show-icon
    />

    <section v-if="hasImpact" class="preview-section">
      <h4>影响范围</h4>
      <div class="impact-tags">
        <el-tag
          v-for="[key, label] in impactLabels"
          v-show="preview.impact?.[key]"
          :key="key"
          :type="key === 'networkRisk' || key === 'restartService' ? 'danger' : 'warning'"
          effect="light"
        >
          {{ label }}
        </el-tag>
      </div>
    </section>

    <section v-if="preview.files?.length" class="preview-section">
      <h4>将写入的配置文件</h4>
      <div class="preview-list">
        <div v-for="file in preview.files" :key="`${file.path}-${file.action}`" class="preview-item">
          <strong>{{ file.path }}</strong>
          <span>{{ file.changeSummary || file.action }}</span>
        </div>
      </div>
    </section>

    <section v-if="preview.actions?.length" class="preview-section">
      <h4>将执行的命令或服务动作</h4>
      <div class="preview-list">
        <div v-for="action in preview.actions" :key="`${action.type}-${action.name}-${action.displayCommand}`" class="preview-item">
          <strong>{{ action.name }}</strong>
          <code v-if="action.displayCommand">{{ action.displayCommand }}</code>
          <span v-else>{{ action.type }}</span>
        </div>
      </div>
    </section>

    <section v-if="preview.prechecks?.length" class="preview-section">
      <h4>执行前检查</h4>
      <div class="preview-list">
        <div v-for="check in preview.prechecks" :key="check.name" class="preview-item">
          <strong>{{ check.name }}</strong>
          <span>{{ check.message || check.status }}</span>
        </div>
      </div>
    </section>

    <section v-if="preview.rollback" class="preview-section">
      <h4>失败回滚</h4>
      <p>{{ preview.rollback.summary || (preview.rollback.supported ? '支持失败回滚' : '不支持自动回滚') }}</p>
      <el-alert
        v-if="preview.rollback.supported === false || preview.rollback.unrecoverable?.length"
        :title="preview.rollback.unrecoverable?.join('；') || '该操作不支持自动回滚，请确认后继续'"
        type="error"
        :closable="false"
        show-icon
      />
    </section>

    <el-alert
      v-if="failedPrechecks.length"
      title="存在未通过的预检项，不能继续执行"
      type="error"
      :closable="false"
      show-icon
    />
  </div>
</template>

<style scoped lang="less">
.operation-preview {
  display: flex;
  flex-direction: column;
  max-height: 62vh;
  overflow: auto;
  gap: 14px;
  text-align: left;
}

.preview-section {
  h4 {
    margin: 0 0 8px;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.6;
  }
}

.impact-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
    line-height: 1.4;
    word-break: break-all;
  }

  span,
  code {
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
    word-break: break-all;
  }

  code {
    padding: 6px 8px;
    border-radius: 4px;
    background: var(--surface-subtle, rgba(0, 0, 0, 0.04));
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
}
</style>
