<script setup lang="ts">
import { computed } from 'vue'
import type { OperationPreview } from '@/utils/operationPreview'
import i18n from '@/lang'

const props = defineProps<{
  preview: OperationPreview
}>()

const riskType = computed(() => {
  const level = props.preview.review?.riskLevel
  if (level === 'high') return 'error'
  if (level === 'medium') return 'warning'
  return 'info'
})

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const impactLabels = computed<Array<[keyof NonNullable<OperationPreview['impact']>, string]>>(() => [
  ['writeFiles', t('common.operationPreview.impacts.writeFiles', 'Writes configuration files')],
  ['modifyDatabase', t('common.operationPreview.impacts.modifyDatabase', 'Modifies panel records')],
  ['restartService', t('common.operationPreview.impacts.restartService', 'Restarts services')],
  ['reloadService', t('common.operationPreview.impacts.reloadService', 'Reloads services')],
  ['networkRisk', t('common.operationPreview.impacts.networkRisk', 'May affect network connectivity')]
])

const failedPrechecks = computed(() =>
  (props.preview.prechecks || []).filter((item) => item.status === 'failed')
)

const hasImpact = computed(() =>
  impactLabels.value.some(([key]) => props.preview.impact?.[key])
)

const hasDetails = computed(() =>
  hasImpact.value ||
  Boolean(props.preview.review?.reason) ||
  Boolean(props.preview.summary) ||
  Boolean(props.preview.files?.length) ||
  Boolean(props.preview.actions?.length) ||
  Boolean(props.preview.prechecks?.length) ||
  Boolean(props.preview.rollback)
)

const riskLabel = computed(() => {
  const level = props.preview.review?.riskLevel || 'low'
  return t(`common.operationPreview.riskLevels.${level}`, level)
})
</script>

<template>
  <div class="operation-preview">
    <section class="preview-overview">
      <div class="overview-item">
        <span>{{ t('common.operationPreview.riskLevel', 'Risk level') }}</span>
        <el-tag :type="preview.review?.riskLevel === 'high' ? 'danger' : preview.review?.riskLevel === 'medium' ? 'warning' : 'info'">
          {{ riskLabel }}
        </el-tag>
      </div>
      <div v-if="preview.summary" class="overview-item overview-item--stacked">
        <span>{{ t('common.operationPreview.summary', 'Summary') }}</span>
        <strong>{{ preview.summary }}</strong>
      </div>
      <div v-if="preview.expiresAt" class="overview-item">
        <span>{{ t('common.operationPreview.expiresAt', 'Valid until') }}</span>
        <strong>{{ preview.expiresAt }}</strong>
      </div>
    </section>

    <el-alert
      v-if="preview.review?.reason"
      :title="preview.review.reason"
      :type="riskType"
      :closable="false"
      show-icon
    />

    <el-alert
      v-if="!hasDetails"
      :title="t('common.operationPreview.noDetails', 'No detailed changes were returned for this preview. Confirm the target operation before continuing.')"
      type="info"
      :closable="false"
      show-icon
    />

    <section v-if="hasImpact" class="preview-section">
      <h4>{{ t('common.operationPreview.impactScope', 'Impact scope') }}</h4>
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
      <h4>{{ t('common.operationPreview.filesToWrite', 'Files to write') }}</h4>
      <div class="preview-list">
        <div v-for="file in preview.files" :key="`${file.path}-${file.action}`" class="preview-item">
          <strong>{{ file.path }}</strong>
          <span>{{ file.changeSummary || file.action }}</span>
        </div>
      </div>
    </section>

    <section v-if="preview.actions?.length" class="preview-section">
      <h4>{{ t('common.operationPreview.actionsToExecute', 'Actions to execute') }}</h4>
      <div class="preview-list">
        <div v-for="action in preview.actions" :key="`${action.type}-${action.name}-${action.displayCommand}`" class="preview-item">
          <strong>{{ action.name }}</strong>
          <code v-if="action.displayCommand">{{ action.displayCommand }}</code>
          <span v-else>{{ action.type }}</span>
        </div>
      </div>
    </section>

    <section v-if="preview.prechecks?.length" class="preview-section">
      <h4>{{ t('common.operationPreview.prechecks', 'Prechecks') }}</h4>
      <div class="preview-list">
        <div v-for="check in preview.prechecks" :key="check.name" class="preview-item">
          <strong>{{ check.name }}</strong>
          <span>{{ check.message || check.status }}</span>
        </div>
      </div>
    </section>

    <section v-if="preview.rollback" class="preview-section">
      <h4>{{ t('common.operationPreview.rollback', 'Rollback') }}</h4>
      <p>{{ preview.rollback.summary || (preview.rollback.supported ? t('common.operationPreview.rollbackSupported', 'Rollback supported') : t('common.operationPreview.rollbackUnsupported', 'Rollback unsupported')) }}</p>
      <el-alert
        v-if="preview.rollback.supported === false || preview.rollback.unrecoverable?.length"
        :title="preview.rollback.unrecoverable?.join('；') || t('common.operationPreview.rollbackConfirmTip', 'This operation contains unrecoverable changes')"
        type="error"
        :closable="false"
        show-icon
      />
    </section>

    <el-alert
      v-if="failedPrechecks.length"
      :title="t('common.operationPreview.failedPrechecks', 'Precheck failed')"
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

.preview-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--surface-subtle);
}

.overview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  > span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  > strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    text-align: right;
    word-break: break-all;
  }
}

.overview-item--stacked {
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;

  > strong {
    text-align: left;
  }
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
