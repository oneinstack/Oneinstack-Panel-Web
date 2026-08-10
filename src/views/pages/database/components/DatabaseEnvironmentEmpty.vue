<script setup lang="ts">
import { Connection, Download, WarningFilled } from '@element-plus/icons-vue'
import System from '@/utils/System'
import { computed } from 'vue'

const props = defineProps<{
  type: 'mysql' | 'redis'
  installed: boolean
}>()

const displayName = computed(() => (props.type === 'mysql' ? 'MySQL' : 'Redis'))
const title = computed(() =>
  props.installed
    ? `未检测到可用的 ${displayName.value} 连接`
    : `当前未安装 ${displayName.value} 环境，也没有远程数据库`
)
const description = computed(() =>
  props.installed
    ? '本机服务已安装，但连接尚未就绪。可以添加当前或远程服务器连接。'
    : `安装本机 ${displayName.value}，或连接一台已有的远程服务器后即可开始管理。`
)

const openRemote = () => System.router.push(`/database/remote?type=${props.type}`)
const openSoftware = () => System.router.push(`/software?component=${props.type}`)
</script>

<template>
  <div class="environment-empty">
    <div class="environment-icon">
      <el-icon><WarningFilled /></el-icon>
    </div>
    <div class="environment-copy">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
    </div>
    <div class="environment-actions">
      <el-button :icon="Connection" @click="openRemote">添加远程数据库</el-button>
      <el-button type="primary" :icon="Download" @click="openSoftware">
        {{ installed ? `查看 ${displayName}` : `安装 ${displayName}` }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.environment-empty {
  width: min(760px, calc(100% - 48px));
  min-height: 108px;
  margin: 52px auto;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: 46px minmax(220px, 1fr) auto;
  align-items: center;
  gap: 16px;
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 30%, var(--border-subtle));
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-color-warning) 5%, var(--surface-card));
  box-shadow: var(--shadow-xs);
}

.environment-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, var(--surface-card));

  .el-icon {
    font-size: 23px;
  }
}

.environment-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
  text-align: left;

  strong {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 650;
  }

  span {
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.55;
  }
}

.environment-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 860px) {
  .environment-empty {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .environment-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
