<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Top } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

import i18n from '@/lang'
import { useConfigStore } from '@/stores/modules/config'
import {
  PANEL_UPDATE_CHECKED_EVENT,
  requestPanelUpdateCheck,
  type PanelUpdateCheckResult
} from '@/utils/panel-update'

const AUTO_CHECK_INTERVAL_MS = 3 * 60 * 60 * 1000

const router = useRouter()
const configStore = useConfigStore()
const update = ref<PanelUpdateCheckResult>()
const popoverVisible = ref(false)
const checking = ref(false)
const lastAutomaticCheckAt = ref(0)
const mounted = ref(false)

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const canCheckPanelUpdate = computed(() => configStore.hasActionAccess('panel.update.check'))
const targetVersion = computed(() => update.value?.latestVersion?.trim() || '')
const shouldShow = computed(() => Boolean(
  canCheckPanelUpdate.value
  && update.value?.updateAvailable
  && targetVersion.value
  && targetVersion.value !== update.value?.currentVersion
))
const updateAriaLabel = computed(() => t(
  'layout.panelUpdate.availableAria',
  `Panel update ${targetVersion.value} is available`,
  { version: targetVersion.value }
))
const channelLabel = computed(() => {
  const channel = update.value?.channel?.trim().toLowerCase()
  if (channel === 'stable') return t('layout.panelUpdate.channels.stable', 'Stable')
  if (channel === 'beta') return t('layout.panelUpdate.channels.beta', 'Beta')
  if (channel === 'development') return t('layout.panelUpdate.channels.development', 'Development')
  return update.value?.channel || '—'
})
const sourceLabel = computed(() => {
  if (update.value?.source === 'center') return 'OneinStack Center'
  if (update.value?.source === 'manifest') {
    return t('layout.panelUpdate.signedManifest', 'Signed manifest')
  }
  return '—'
})
const publishedDate = computed(() => {
  const value = update.value?.publishedAt
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(i18n.locale === 'en-US' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
})

const checkAutomatically = async (force = false) => {
  if (!canCheckPanelUpdate.value || checking.value) return
  const now = Date.now()
  if (!force && now - lastAutomaticCheckAt.value < AUTO_CHECK_INTERVAL_MS) return

  // Record the attempt before starting so focus/visibility events cannot queue
  // repeated requests, including when Center is temporarily unavailable.
  lastAutomaticCheckAt.value = now
  checking.value = true
  try {
    update.value = await requestPanelUpdateCheck()
    if (!shouldShow.value) popoverVisible.value = false
  } catch {
    update.value = undefined
    popoverVisible.value = false
  } finally {
    checking.value = false
  }
}

const handleWindowFocus = () => {
  void checkAutomatically()
}

const handleVisibilityChange = () => {
  if (!document.hidden) void checkAutomatically()
}

const handlePanelUpdateChecked = (event: Event) => {
  const result = (event as CustomEvent<PanelUpdateCheckResult | undefined>).detail
  update.value = result || undefined
  lastAutomaticCheckAt.value = Date.now()
  if (!shouldShow.value) popoverVisible.value = false
}

const goToPanelUpdate = async () => {
  popoverVisible.value = false
  await router.push({
    path: '/setting',
    query: { section: 'update', check: '1' }
  }).catch(() => undefined)
}

watch(canCheckPanelUpdate, (allowed) => {
  if (mounted.value && allowed && lastAutomaticCheckAt.value === 0) {
    void checkAutomatically(true)
  }
})

onMounted(() => {
  // A layout mount represents a login transition or a full page refresh and
  // intentionally bypasses the three-hour focus throttle.
  mounted.value = true
  void checkAutomatically(true)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener(PANEL_UPDATE_CHECKED_EVENT, handlePanelUpdateChecked)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  mounted.value = false
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener(PANEL_UPDATE_CHECKED_EVENT, handlePanelUpdateChecked)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <el-popover
    v-if="shouldShow"
    v-model:visible="popoverVisible"
    placement="bottom-end"
    :width="360"
    trigger="click"
    popper-class="panel-update-notice-popper"
  >
    <template #reference>
      <button
        class="panel-update-notice__trigger"
        type="button"
        :title="updateAriaLabel"
        :aria-label="updateAriaLabel"
        aria-haspopup="dialog"
        :aria-expanded="popoverVisible"
      >
        <span class="panel-update-notice__icon" aria-hidden="true">
          <el-icon :size="14"><Top /></el-icon>
        </span>
        <span class="panel-update-notice__label">
          {{ $t('layout.panelUpdate.available', { version: targetVersion }) }}
        </span>
        <span class="panel-update-notice__mobile-dot" aria-hidden="true"></span>
      </button>
    </template>

    <div class="panel-update-popover">
      <div class="panel-update-popover__heading">
        <span class="panel-update-popover__eyebrow">{{ $t('layout.panelUpdate.eyebrow') }}</span>
        <strong>{{ $t('layout.panelUpdate.title') }}</strong>
      </div>

      <div class="panel-update-popover__versions">
        <span>{{ update?.currentVersion || '—' }}</span>
        <span class="panel-update-popover__arrow" aria-hidden="true">→</span>
        <strong>{{ targetVersion }}</strong>
      </div>

      <div class="panel-update-popover__meta">
        <span>{{ channelLabel }}</span>
        <span>{{ sourceLabel }}</span>
        <span v-if="publishedDate">{{ publishedDate }}</span>
      </div>

      <div class="panel-update-popover__release-notes">
        <span>{{ $t('layout.panelUpdate.releaseNotes') }}</span>
        <p>{{ update?.releaseNotes || $t('layout.panelUpdate.noReleaseNotes') }}</p>
      </div>

      <div class="panel-update-popover__actions">
        <el-button type="primary" @click="goToPanelUpdate">
          {{ $t('layout.panelUpdate.goToUpdate') }}
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<style scoped lang="less">
.panel-update-notice__trigger {
  min-width: 142px;
  height: 38px;
  padding: 0 12px 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(var(--primary-color), 0.34);
  border-radius: 11px;
  color: rgb(var(--primary-color));
  background: linear-gradient(135deg, rgba(var(--primary-color), 0.12), rgba(var(--primary-color), 0.04));
  box-shadow: 0 5px 14px rgba(var(--primary-color), 0.1);
  font-size: 12px;
  font-weight: 680;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(var(--primary-color), 0.58);
    background: rgba(var(--primary-color), 0.14);
    box-shadow: 0 7px 18px rgba(var(--primary-color), 0.16);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--primary-color), 0.24);
    outline-offset: 2px;
  }
}

.panel-update-notice__icon {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: rgb(var(--primary-color));
  box-shadow: 0 4px 10px rgba(var(--primary-color), 0.22);
}

.panel-update-notice__mobile-dot {
  display: none;
}

.panel-update-popover__heading {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: var(--text-primary);
    font-size: 16px;
    line-height: 1.4;
  }
}

.panel-update-popover__eyebrow {
  color: rgb(var(--primary-color));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.panel-update-popover__versions {
  margin-top: 16px;
  padding: 13px 14px;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid rgba(var(--primary-color), 0.16);
  border-radius: 12px;
  background: rgba(var(--primary-color), 0.06);
  color: var(--text-secondary);
  font-size: 14px;
  font-variant-numeric: tabular-nums;

  strong {
    color: rgb(var(--primary-color));
    font-size: 16px;
  }
}

.panel-update-popover__arrow {
  color: var(--text-placeholder);
}

.panel-update-popover__meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  color: var(--text-tertiary);
  font-size: 11px;

  span + span::before {
    content: '·';
    margin-right: 12px;
    color: var(--text-placeholder);
  }
}

.panel-update-popover__release-notes {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);

  > span {
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 680;
  }

  p {
    margin: 7px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.65;
    white-space: pre-line;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }
}

.panel-update-popover__actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1180px) {
  .panel-update-notice__trigger {
    min-width: 108px;
  }
}

@media (max-width: 768px) {
  .panel-update-notice__trigger {
    position: relative;
    min-width: 38px;
    width: 38px;
    padding: 0;
  }

  .panel-update-notice__label {
    display: none;
  }

  .panel-update-notice__mobile-dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 7px;
    height: 7px;
    display: block;
    border: 2px solid var(--surface-card);
    border-radius: 50%;
    background: rgb(var(--primary-color));
  }
}
</style>

<style lang="less">
.panel-update-notice-popper.el-popper {
  padding: 18px !important;
  border: 1px solid var(--border-subtle) !important;
  border-radius: 14px !important;
  background: var(--surface-raised) !important;
  box-shadow: 0 20px 44px rgba(4, 10, 20, 0.2) !important;
}

.panel-update-notice-popper .el-popper__arrow::before {
  border-color: var(--border-subtle) !important;
  background: var(--surface-raised) !important;
}

@media (max-width: 420px) {
  .panel-update-notice-popper.el-popper {
    max-width: calc(100vw - 24px);
  }
}
</style>
