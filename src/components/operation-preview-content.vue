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

const fileCount = computed(() => props.preview.files?.length || 0)

const actionCount = computed(() => props.preview.actions?.length || 0)

const effectiveValues = computed(() => props.preview.effectiveValues || [])

const effectiveValueSourceKeys: Record<string, string> = {
  request: 'request',
  server_default: 'serverDefault',
  manifest_default: 'manifestDefault',
  derived: 'derived',
  backend_normalized: 'backendNormalized',
  server_resolved: 'serverResolved'
}

const isSensitiveEffectiveValue = (item: NonNullable<OperationPreview['effectiveValues']>[number]) => {
  if (item.sensitive === true || item.source === 'server_resolved') return true
  return /password|passwd|secret|token|credential|private.?key/i.test(item.key)
}

const effectiveValueText = (item: NonNullable<OperationPreview['effectiveValues']>[number]) => {
  if (isSensitiveEffectiveValue(item)) {
    return t('common.operationPreview.sensitiveValue', 'Sensitive value hidden')
  }
  if (item.value === undefined || item.value === null || item.value === '') {
    return t('common.operationPreview.emptyValue', 'Not provided')
  }
  if (typeof item.value === 'object') return JSON.stringify(item.value)
  return String(item.value)
}

const effectiveValueSource = (source?: string) => {
  if (!source) return ''
  const sourceKey = effectiveValueSourceKeys[source] || ''
  return sourceKey
    ? t(`common.operationPreview.valueSources.${sourceKey}`, source)
    : source
}

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
        <div class="preview-summary__meta">
          <el-tag :type="riskTagType" effect="light" size="small">{{ riskLabel }}</el-tag>
          <div v-if="formattedExpiresAt" class="preview-expiry">
            <el-icon><Clock /></el-icon>
            <span>{{ t('common.operationPreview.expiresAt', 'Valid until') }}</span>
            <strong>{{ formattedExpiresAt }}</strong>
          </div>
        </div>
        <p class="preview-summary__headline">{{ primarySummary }}</p>
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

    <section v-if="effectiveValues.length" class="preview-section effective-values-section">
      <div class="preview-section__title">
        <h4>{{ t('common.operationPreview.effectiveValues', 'Effective values') }}</h4>
        <span>{{ t('common.operationPreview.effectiveValueCount', '{count} values', { count: effectiveValues.length }) }}</span>
      </div>
      <div class="effective-values-list">
        <div v-for="item in effectiveValues" :key="item.key" class="effective-value-item">
          <div class="effective-value-item__meta">
            <code>{{ item.key }}</code>
            <el-tag v-if="effectiveValueSource(item.source)" size="small" effect="plain">
              {{ effectiveValueSource(item.source) }}
            </el-tag>
          </div>
          <strong :class="{ 'is-sensitive': isSensitiveEffectiveValue(item) }">
            {{ effectiveValueText(item) }}
          </strong>
        </div>
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
            <pre v-if="file.diff" class="preview-diff">{{ file.diff }}</pre>
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
            <small v-if="action.service">{{ t('common.operationPreview.service', 'Service') }}: {{ action.service }}</small>
          </div>
        </div>
      </div>
    </section>

    <section v-if="fileCount || actionCount" class="preview-section">
      <div class="preview-section__title">
        <h4>{{ t('common.operationPreview.summaryDetails', 'Execution details') }}</h4>
      </div>
      <div class="preview-metrics">
        <div class="preview-metric">
          <span>{{ t('common.operationPreview.affectedFiles', 'Affected files') }}</span>
          <strong>{{ fileCount }}</strong>
        </div>
        <div class="preview-metric">
          <span>{{ t('common.operationPreview.executionActions', 'Execution actions') }}</span>
          <strong>{{ actionCount }}</strong>
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

      <div v-if="preview.prechecks?.length" class="preview-checklist">
        <div
          v-for="check in preview.prechecks"
          :key="`${check.name}-${check.status}`"
          class="preview-check"
          :class="`is-${check.status}`"
        >
          <strong>{{ check.name }}</strong>
          <span>{{ check.message || check.status }}</span>
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
  gap: 14px;
  padding-right: 4px;
  text-align: left;
}

.preview-summary {
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, rgba(var(--primary-color), 0.2) 55%, var(--border-subtle));
  border-left: 4px solid var(--el-color-info);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(var(--primary-color), 0.1), transparent 42%),
    color-mix(in srgb, var(--surface-raised) 78%, var(--surface-card));
  // box-shadow:
  //   inset 0 1px 0 rgba(255, 255, 255, 0.04),
  //   0 14px 30px rgba(4, 8, 20, 0.24);

  &.is-medium {
    border-color: color-mix(in srgb, rgba(var(--warning-color), 0.26) 55%, var(--border-subtle));
    border-left-color: var(--el-color-warning);
  }

  &.is-high {
    border-color: color-mix(in srgb, rgba(var(--danger-color), 0.3) 58%, var(--border-subtle));
    border-left-color: var(--el-color-danger);
    background:
      linear-gradient(135deg, rgba(var(--danger-color), 0.14), transparent 46%),
      color-mix(in srgb, var(--surface-raised) 76%, rgba(var(--danger-color), 0.14));
  }
}

.preview-summary__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 9px;
}

.preview-summary__meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.preview-summary__headline {
  margin: 0;
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.preview-expiry {
  display: flex;
  align-items: center;
  flex: none;
  gap: 5px;
  padding: 6px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-card) 88%, rgba(var(--primary-color), 0.14));
  color: var(--text-tertiary);
  font-size: 11px;
  white-space: nowrap;

  strong {
    color: var(--text-secondary);
    font-weight: 600;
  }
}

.preview-description {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-card) 92%, rgba(var(--primary-color), 0.08));
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.preview-impact {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-card) 94%, rgba(var(--warning-color), 0.08));
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

:global(html.dark .operation-preview .preview-impact) {
  border-color: rgba(var(--warning-color), 0.18);
  background:
    linear-gradient(180deg, rgba(120, 82, 12, 0.12), rgba(23, 29, 41, 0.92));
}

:global(html.dark .operation-preview .preview-impact .preview-label) {
  color: #d6deea;
}

:global(html.dark .operation-preview .impact-tags .el-tag) {
  border-color: rgba(245, 158, 11, 0.28);
  color: #fcd34d;
  background: rgba(120, 82, 12, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

:global(html.dark .operation-preview .impact-tags .el-tag .el-tag__content) {
  color: inherit;
}

:global(html.dark .operation-preview .impact-tags .el-tag.el-tag--danger) {
  border-color: rgba(var(--error-color), 0.3);
  color: #fda4af;
  background: rgba(127, 29, 29, 0.22);
}

.preview-section {
  padding: 16px 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface-raised) 72%, var(--surface-card));
  // box-shadow:
  //   inset 0 1px 0 rgba(255, 255, 255, 0.03),
  //   0 10px 24px rgba(4, 8, 20, 0.18);
}

.preview-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

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
  overflow: hidden;
  // border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface-card) 96%, rgba(var(--primary-color), 0.04));
}

.preview-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  // border-bottom: 1px solid var(--border-subtle);

  &:last-child {
    border-bottom: none;
  }
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

.preview-diff {
  grid-column: 1 / -1;
  margin: 6px 0 0;
  padding: 12px 14px;
  overflow: auto;
  // border: 1px solid var(--border-subtle);
  border-radius: 12px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--surface-muted) 86%, rgba(3, 8, 20, 0.35));
  font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.effective-values-list {
  display: grid;
  gap: 8px;
}

.effective-value-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface-card) 95%, rgba(var(--primary-color), 0.04));

  strong {
    min-width: 0;
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 600;
    overflow-wrap: anywhere;
    text-align: right;
  }

  strong.is-sensitive {
    color: var(--text-tertiary);
    font-weight: 500;
  }
}

.effective-value-item__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  min-width: 0;
  gap: 6px;

  code {
    max-width: 100%;
    color: var(--text-secondary);
    font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    overflow-wrap: anywhere;
  }
}

.preview-metric {
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface-card) 95%, rgba(var(--primary-color), 0.05));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);

  span {
    display: block;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 5px;
    color: var(--text-primary);
    font-size: 18px;
  }
}

.preview-safety {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 2px;
}

.preview-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-check {
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface-card) 95%, rgba(var(--primary-color), 0.04));

  &.is-failed {
    border-color: color-mix(in srgb, var(--el-color-danger) 32%, var(--border-subtle));
    background: color-mix(in srgb, var(--el-color-danger-light-9) 70%, var(--surface-card));
  }

  &.is-passed {
    border-color: color-mix(in srgb, var(--el-color-success) 24%, var(--border-subtle));
  }

  strong {
    display: block;
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 600;
  }

  span {
    display: block;
    margin-top: 4px;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.55;
  }
}

.safety-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 13px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-card) 94%, rgba(var(--success-color), 0.04));
  color: var(--el-color-success);

  &.is-danger {
    border-color: color-mix(in srgb, var(--el-color-danger) 24%, var(--border-subtle));
    background: color-mix(in srgb, var(--surface-card) 90%, rgba(var(--danger-color), 0.08));
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
  width: 720px;
  max-width: calc(100vw - 32px);
  padding: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(3, 8, 20, 0.38);
  background: color-mix(in srgb, var(--surface-raised) 84%, var(--surface-card));
}

:global(.operation-preview-message-box .el-message-box__header) {
  padding: 22px 24px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

:global(.operation-preview-message-box .el-message-box__title) {
  font-size: 18px;
  font-weight: 650;
  color: var(--text-primary);
}

:global(.operation-preview-message-box .el-message-box__content) {
  padding: 0 24px 6px;
}

:global(.operation-preview-message-box .el-message-box__container) {
  display: block;
}

:global(.operation-preview-message-box .el-message-box__btns) {
  margin-top: 16px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface-raised) 84%, var(--surface-card));
}

@media (max-width: 640px) {
  .preview-summary__meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .preview-expiry {
    white-space: normal;
  }

  .preview-impact {
    flex-direction: column;
    gap: 6px;
  }

  .preview-metrics {
    grid-template-columns: 1fr;
  }

  .effective-value-item {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;

    strong {
      text-align: left;
    }
  }

  .safety-item > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
