<script setup lang="ts">
import { onBeforeUnmount, shallowRef, ref, type Component } from 'vue'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import CustomDrawer from './custom-drawer.vue'
import i18n from '@/lang'
import System from '@/utils/System'
import {
  canReloadChunkContent,
  clearChunkContentRecovery,
  reloadChunkContentOnce
} from '@/utils/chunk-reload'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  loader: () => Promise<{ default: Component }>
  recoveryTarget: string
  resourceKey: string
  retryHint?: string
  drawer?: boolean
}>(), { drawer: false })
const emit = defineEmits<{ (event: 'cancel'): void }>()
const content = shallowRef<Component>()
const failed = ref(false)
const retryAvailable = ref(canReloadChunkContent(props.recoveryTarget, props.resourceKey))
let disposed = false

const timeout = window.setTimeout(() => {
  if (!disposed) {
    failed.value = true
    retryAvailable.value = canReloadChunkContent(props.recoveryTarget, props.resourceKey)
  }
}, 20_000)

void props.loader().then((module) => {
  if (disposed) return
  if (!module?.default) throw new Error('Page content did not load')
  content.value = module.default
  clearChunkContentRecovery(props.recoveryTarget, props.resourceKey)
}).catch((error) => {
  console.error(`[resource-load] Failed to load ${props.resourceKey}`, error)
  if (!disposed) {
    failed.value = true
    retryAvailable.value = canReloadChunkContent(props.recoveryTarget, props.resourceKey)
  }
}).finally(() => window.clearTimeout(timeout))

const retry = () => {
  retryAvailable.value = false
  reloadChunkContentOnce(props.recoveryTarget, props.resourceKey)
}
const leave = () => {
  if (content.value) return
  if (props.drawer) emit('cancel')
  else void System.router?.push('/home')
}

onBeforeUnmount(() => {
  disposed = true
  window.clearTimeout(timeout)
})
</script>

<template>
  <component v-if="content" :is="content" v-bind="$attrs" />
  <component
    v-else
    :is="drawer ? CustomDrawer : 'section'"
    v-bind="drawer ? {
      visible: true,
      title: i18n.t('layout.resourceLoading.title'),
      size: '1080px',
      showConfirm: false,
      onClose: leave,
      cancelText: i18n.t('common.close')
    } : {}"
  >
    <section class="async-content-state" :role="failed ? 'alert' : 'status'" aria-live="polite">
      <el-icon :class="{ 'is-loading': !failed }" :size="32">
        <WarningFilled v-if="failed" />
        <Loading v-else />
      </el-icon>
      <h3>{{ i18n.t(failed ? 'layout.resourceLoading.failed' : 'layout.resourceLoading.title') }}</h3>
      <p v-if="failed">{{ retryAvailable ? retryHint || i18n.t('layout.resourceLoading.interrupted') : i18n.t('layout.resourceLoading.exhausted') }}</p>
      <div v-if="failed" class="async-content-actions">
        <el-button type="primary" :disabled="!retryAvailable" @click="retry">{{ i18n.t(drawer ? 'layout.resourceLoading.refreshPage' : 'layout.resourceLoading.retry') }}</el-button>
        <el-button @click="leave">{{ i18n.t(drawer ? 'common.close' : 'layout.resourceLoading.home') }}</el-button>
      </div>
    </section>
  </component>
</template>

<style scoped>
.async-content-state {
  display: flex;
  min-height: 260px;
  padding: 32px 24px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  color: var(--text-secondary);
}
.async-content-state h3, .async-content-state p { margin: 0; }
.async-content-state h3 { color: var(--text-primary); }
.async-content-actions { display: flex; gap: 12px; }
</style>
