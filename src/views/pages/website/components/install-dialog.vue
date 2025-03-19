<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const state = reactive({
  loading: false,
  activeTab: 'LNMP',
  tabs: [
    { label: 'LNMP (推荐)', name: 'LNMP' },
    { label: 'LAMP', name: 'LAMP' },
    { label: 'JAVA', name: 'JAVA' }
  ],
  packages: {
    LNMP: [
      { name: 'Nginx', version: '1.20', required: true },
      { name: 'MySQL', version: '1.26', required: false },
      { name: 'PHP', version: '1.26', required: false },
      { name: 'phpMyAdmin', version: '1.26', required: false },
      { name: 'Pure-Ftpd', version: '10.49', required: false }
    ]
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  state.loading = true
  // 这里添加安装逻辑
  setTimeout(() => {
    state.loading = false
    emit('confirm')
    handleClose()
  }, 1000)
}
</script>

<template>
  <el-dialog v-model="visible" title="软件的使用情况" width="680px" :close-on-click-modal="false" @close="handleClose">
    <div class="install-dialog">
      <el-alert type="warning" :closable="false">
        <template #title>
          <span>未安装运行环境，请安装以下软件包后使用该页面</span>
          <el-link type="warning" style="margin-left: 4px">安装帮助</el-link>
        </template>
      </el-alert>

      <el-tabs v-model="state.activeTab" class="mt-4">
        <el-tab-pane v-for="tab in state.tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <div class="package-list">
            <div v-for="pkg in state.packages[state.activeTab]" :key="pkg.name" class="package-item">
              <div class="package-info">
                <el-checkbox v-model="pkg.checked" :disabled="pkg.required">
                  {{ pkg.name }} {{ pkg.version }}
                </el-checkbox>
              </div>
              <div class="package-actions">
                <el-select v-model="pkg.version" size="small" style="width: 120px">
                  <el-option :value="pkg.version" :label="pkg.version" />
                </el-select>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="state.loading" @click="handleConfirm">一键安装</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.install-dialog {
  .mt-4 {
    margin-top: 16px;
  }

  .package-list {
    padding: 12px;
  }

  .package-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }
  }

  .package-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .package-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>