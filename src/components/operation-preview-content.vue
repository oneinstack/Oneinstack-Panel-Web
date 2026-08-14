<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, Clock, Document, Refresh, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import type { OperationPreview } from '@/utils/operationPreview'
import i18n from '@/lang'

const props = defineProps<{
  preview: OperationPreview
}>()

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  if (value && value !== key) return value
  return Object.entries(params || {}).reduce(
    (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
    fallback || key
  )
}

const riskLevel = computed(() => props.preview.review?.riskLevel || 'low')

const riskTagType = computed(() => {
  if (riskLevel.value === 'high') return 'danger'
  if (riskLevel.value === 'medium') return 'warning'
  return 'info'
})

const riskLabel = computed(() =>
  t(`common.operationPreview.riskLevels.${riskLevel.value}`, riskLevel.value)
)

const impactLabels = computed<Array<[keyof NonNullable<OperationPreview['impact']>, string]>>(() => [
  ['writeFiles', t('common.operationPreview.impacts.writeFiles', 'Writes configuration files')],
  ['modifyDatabase', t('common.operationPreview.impacts.modifyDatabase', 'Modifies panel records')],
  ['restartService', t('common.operationPreview.impacts.restartService', 'Restarts services')],
  ['reloadService', t('common.operationPreview.impacts.reloadService', 'Reloads services')],
  ['networkRisk', t('common.operationPreview.impacts.networkRisk', 'May affect network connectivity')]
])

const activeImpacts = computed(() =>
  impactLabels.value.filter(([key]) => props.preview.impact?.[key])
)

const failedPrechecks = computed(() =>
  (props.preview.prechecks || []).filter((item) => item.status === 'failed')
)

const hasDeferredPrecheck = computed(() =>
  (props.preview.prechecks || []).some((item) => item.status === 'deferred')
)

const precheckSummary = computed(() => {
  const checks = props.preview.prechecks || []
  const messages = checks.map((item) => item.message).filter(Boolean)
  if (messages.length) return messages.join(' · ')
  if (failedPrechecks.value.length) {
    return t('common.operationPreview.failedPrechecks', 'Some prechecks failed. The operation cannot continue.')
  }
  if (hasDeferredPrecheck.value) {
    return t('common.operationPreview.prechecksDeferred', '{count} checks will run during execution', {
      count: checks.length
    })
  }
  return t('common.operationPreview.prechecksPassed', '{count} checks passed', { count: checks.length })
})

const primarySummary = computed(() =>
  props.preview.review?.reason ||
  props.preview.summary ||
  t(
    'common.operationPreview.noDetails',
    'No detailed changes were returned for this preview. Confirm the target operation before continuing.'
  )
)

const secondarySummary = computed(() => {
  if (!props.preview.review?.reason || !props.preview.summary) return ''
  return props.preview.review.reason === props.preview.summary ? '' : props.preview.summary
})

const changeCount = computed(
  () => (props.preview.files?.length || 0) + (props.preview.actions?.length || 0)
)

const formattedExpiresAt = computed(() => {
  if (!props.preview.expiresAt) return ''
  const date = new Date(props.preview.expiresAt)
  if (Number.isNaN(date.getTime())) return props.preview.expiresAt
  return new Intl.DateTimeFormat(i18n.locale === 'en-US' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
})

const rollbackSummary = computed(() => {
  const rollback = props.preview.rollback
  if (!rollback) return ''
  if (rollback.unrecoverable?.length) return rollback.unrecoverable.join(' · ')
  if (rollback.summary) return rollback.summary
  return rollback.supported
    ? t('common.operationPreview.rollbackSupported', 'Failure rollback is supported')
    : t('common.operationPreview.rollbackUnsupported', 'Automatic rollback is not supported')
})
</script>

<template>
  <div class="operation-preview">
    <section class="preview-summary" :class="`is-${riskLevel}`">
      <div class="preview-summary__content">
        <el-tag :type="riskTagType" effect="light" size="small">{{ riskLabel }}</el-tag>
        <span>{{ primarySummary }}</span>
      </div>
      <div v-if="formattedExpiresAt" class="preview-expiry">
        <el-icon><Clock /></el-icon>
        <span>{{ t('common.operationPreview.expiresAt', 'Valid until') }}</span>
        <strong>{{ formattedExpiresAt }}</strong>
      </div>
    </section>

    <p v-if="secondarySummary" class="preview-description">{{ secondarySummary }}</p>

    <section v-if="activeImpacts.length" class="preview-impact">
      <span class="preview-label">{{ t('common.operationPreview.impactScope', 'Impact scope') }}</span>
      <div class="impact-tags">
        <el-tag
          v-for="[key, label] in activeImpacts"
          :key="key"
          :type="key === 'networkRisk' || key === 'restartService' ? 'danger' : 'warning'"
          effect="plain"
          size="small"
        >
          {{ label }}
        </el-tag>
      </div>
    </section>

    <section v-if="changeCount" class="preview-section">
      <div class="preview-section__title">
        <h4>{{ t('common.operationPreview.changes', 'Changes') }}</h4>
        <span>{{ t('common.operationPreview.changeCount', '{count} items', { count: changeCount }) }}</span>
      </div>
      <div class="preview-list">
        <div v-for="file in preview.files" :key="`${file.path}-${file.action}`" class="preview-item">
          <el-icon class="preview-item__icon"><Document /></el-icon>
          <div class="preview-item__content">
            <span class="preview-item__type">{{ t('common.operationPreview.fileChange', 'File') }}</span>
            <strong>{{ file.path }}</strong>
            <small>{{ file.changeSummary || file.action }}</small>
          </div>
        </div>

        <div
          v-for="action in preview.actions"
          :key="`${action.type}-${action.name}-${action.displayCommand}`"
          class="preview-item"
        >
          <el-icon class="preview-item__icon"><VideoPlay /></el-icon>
          <div class="preview-item__content">
            <span class="preview-item__type">{{ t('common.operationPreview.actionChange', 'Command') }}</span>
            <strong>{{ action.name }}</strong>
            <code v-if="action.displayCommand">{{ action.displayCommand }}</code>
            <small v-else>{{ action.type }}</small>
          </div>
        </div>
      </div>
    </section>

    <section v-if="preview.prechecks?.length || preview.rollback" class="preview-safety">
      <div
        v-if="preview.prechecks?.length"
        class="safety-item"
        :class="{ 'is-danger': failedPrechecks.length }"
      >
        <el-icon>
          <WarningFilled v-if="failedPrechecks.length" />
          <Refresh v-else-if="hasDeferredPrecheck" />
          <CircleCheck v-else />
        </el-icon>
        <div>
          <strong>{{ t('common.operationPreview.prechecks', 'Prechecks') }}</strong>
          <span>{{ precheckSummary }}</span>
        </div>
      </div>

      <div
        v-if="preview.rollback"
        class="safety-item"
        :class="{ 'is-danger': preview.rollback.supported === false || preview.rollback.unrecoverable?.length }"
      >
        <el-icon>
          <Refresh v-if="preview.rollback.supported" />
          <WarningFilled v-else />
        </el-icon>
        <div>
          <strong>{{ t('common.operationPreview.rollback', 'Failure rollback') }}</strong>
          <span>{{ rollbackSummary }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
.operation-preview {
  display: flex;
  flex-direction: column;
  max-height: 56vh;
  overflow: auto;
  gap: 12px;
  padding-right: 2px;
  text-align: left;
}

.preview-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 42px;
  padding: 9px 12px;
  border-left: 3px solid var(--el-color-info);
  border-radius: 4px;
  background: var(--surface-subtle);

  &.is-medium {
    border-left-color: var(--el-color-warning);
  }

  &.is-high {
    border-left-color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
}

.preview-summary__content {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 9px;

  > span:last-child {
    color: var(--text-primary);
    font-size: 13px;
    line-height: 1.5;
  }
}

.preview-expiry {
  display: flex;
  align-items: center;
  flex: none;
  gap: 4px;
  color: var(--text-tertiary);
  font-size: 12px;
  white-space: nowrap;

  strong {
    color: var(--text-secondary);
    font-weight: 600;
  }
}

.preview-description {
  margin: -2px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.preview-impact {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.preview-label {
  flex: none;
  padding-top: 3px;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 600;
}

.impact-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;

  h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.preview-list {
  border-top: 1px solid var(--border-subtle);
}

.preview-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 2px;
  border-bottom: 1px solid var(--border-subtle);
}

.preview-item__icon {
  flex: none;
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: 15px;
}

.preview-item__content {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  min-width: 0;
  flex: 1;
  gap: 3px 8px;

  strong {
    min-width: 0;
    overflow-wrap: anywhere;
    color: var(--text-primary);
    font-size: 13px;
    line-height: 1.45;
  }

  small,
  code {
    grid-column: 2;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  code {
    width: fit-content;
    max-width: 100%;
    padding: 2px 6px;
    border-radius: 3px;
    background: var(--surface-subtle, rgba(0, 0, 0, 0.04));
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
}

.preview-item__type {
  color: var(--text-tertiary);
  font-size: 11px;
  white-space: nowrap;
}

.preview-safety {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-top: 1px;
}

.safety-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--el-color-success);

  &.is-danger {
    color: var(--el-color-danger);
  }

  > .el-icon {
    flex: none;
    margin-top: 2px;
  }

  > div {
    display: flex;
    align-items: baseline;
    min-width: 0;
    gap: 8px;
  }

  strong {
    flex: none;
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 600;
  }

  span {
    min-width: 0;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
}

:global(.operation-preview-message-box) {
  width: 600px;
  max-width: calc(100vw - 32px);
  padding: 0;
  border-radius: 8px;
}

:global(.operation-preview-message-box .el-message-box__header) {
  padding: 18px 20px 12px;
}

:global(.operation-preview-message-box .el-message-box__title) {
  font-size: 17px;
  font-weight: 650;
}

:global(.operation-preview-message-box .el-message-box__content) {
  padding: 0 20px;
}

:global(.operation-preview-message-box .el-message-box__container) {
  display: block;
}

:global(.operation-preview-message-box .el-message-box__btns) {
  margin-top: 14px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 640px) {
  .preview-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .preview-impact {
    flex-direction: column;
    gap: 6px;
  }

  .safety-item > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
