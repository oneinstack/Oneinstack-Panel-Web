<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import sapp from '@/sstore/sapp' // 假设 sapp 存储了主题信息

// 获取当前主题
const currentTheme = computed(() => sapp.theme)

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

interface Package {
  name: string
  version: string
  required: boolean
  checked?: boolean
}

interface Packages {
  [key: string]: Package[]
}
const radio1 = ref('1')
const radio2 = ref('1')
const radio3 = ref('1')
const state = reactive({
  loading: false,
  activeTab: 'LNMP',
  packages: {
    LNMP: [
      { name: 'Nginx', version: '1.20', required: true },
      { name: 'MySQL', version: '1.26', required: false },
      { name: 'PHP', version: '1.26', required: false },
      { name: 'phpMyAdmin', version: '1.26', required: false },
      { name: 'Pure-Ftpd', version: '10.49', required: false }
    ]
  } as Packages
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

const togglePackage = (pkg: Package) => {
  if (!pkg.required) {
    pkg.checked = !pkg.checked
  }
}
</script>

<template>
  <el-dialog :model-value="visible" @update:model-value="emit('update:visible', $event)" width="1018px"
    :close-on-click-modal="false" @close="handleClose" :show-close="false">
    <div class="install-dialog">
      <img v-if="currentTheme === 'light'" src="../../../../../public/static/images/bj-install-light.png" alt="" class="background-image">
      <img v-else src="../../../../../public/static/images/bj-install-dark.png" alt="" class="background-image">
      <v-s-icon v-if="currentTheme === 'light'" name="off-light" size="32" classs="close" @click="handleClose" />
      <v-s-icon v-else name="off-dark" size="32" classs="close" @click="handleClose" />
      <span class="top">根据您的使用情况，推荐<span class="theme-color">安装以下套件</span></span>
      <div class="top-text">我们为您推荐安装以下一键套件，请您需选择或在<span class='theme-color'>软件商店</span>中自动选择，推荐安装 <strong
          class='theme-color'>LNMP</strong></div>
      <div class="tab-container">
        <div class="tab-container-box">
          <div class="tab-item">
            <span class="tab-indicator"></span> <span>LNMP(推荐)</span>
          </div>

          <div class="package-list">
            <div>
              <div v-for="pkg in state.packages[state.activeTab] || []" :key="pkg.name" class="package-wrapper">
                <div class="package-item" :class="{ 'selected': pkg.checked }" @click="togglePackage(pkg)">
                  <div class="package-icon"></div>
                  <div class="package-info">
                    <span style="margin-right: 10px;">{{ pkg.name }}</span> <span>{{ pkg.version }}</span>
                  </div>
                  <div class="package-down">
                    <v-s-icon name="arrow-down" size="15" :color="['#707070']" />
                  </div>
                </div>
                <div class="status-indicator">
                  <div v-if="!pkg.checked" class="package-extra"></div>
                  <v-s-icon v-else-if="currentTheme === 'light'" name="rund-while" size="15" class="check-icon" />
                  <v-s-icon v-else name="rund-an" size="15" class="check-icon" />
                </div>
              </div>
              <div></div>
            </div>
            <div class="install-options">
              <div class="mb-2 flex items-center text-sm">
                <el-radio-group v-model="radio1" class="ml-4">
                  <el-radio label="1" size="large" class="text">急速安装</el-radio>
                  <el-radio label="2" size="large" class="text">编译安装</el-radio>
                </el-radio-group>
              </div>
            </div>
          </div>
        </div>
        <div class="tab-container-box">
          <div class="tab-item">
            <span class="tab-indicator"></span> <span>LAMP</span>
          </div>
          <div class="package-list">
            <div>
              <div v-for="pkg in state.packages[state.activeTab] || []" :key="pkg.name" class="package-wrapper">
                <div class="package-item" :class="{ 'selected': pkg.checked }" @click="togglePackage(pkg)">
                  <div class="package-icon"></div>
                  <div class="package-info">
                    <span style="margin-right: 10px;">{{ pkg.name }}</span> <span>{{ pkg.version }}</span>
                  </div>
                  <div class="package-down">
                    <v-s-icon name="arrow-down" size="15" :color="['#707070']" />
                  </div>
                </div>
                <div class="status-indicator">
                  <div v-if="!pkg.checked" class="package-extra"></div>
                  <v-s-icon v-else-if="currentTheme === 'light'" name="rund-while" size="15" class="check-icon" />
                  <v-s-icon v-else name="rund-an" size="15" class="check-icon" />
                </div>
              </div>
              <div></div>
            </div>

            <div class="install-options">
              <el-radio-group v-model="radio2" class="ml-4">
                <el-radio label="1" size="large" class="text">急速安装</el-radio>
                <el-radio label="2" size="large" class="text">编译安装</el-radio>
              </el-radio-group>
            </div>
          </div>
        </div>

        <div class="tab-container-box">
          <div class="tab-item">
            <span class="tab-indicator"></span> <span>JAVA</span>
          </div>
          <div class="package-list">
            <div>
              <div v-for="pkg in state.packages[state.activeTab] || []" :key="pkg.name" class="package-wrapper">
                <div class="package-item" :class="{ 'selected': pkg.checked }" @click="togglePackage(pkg)">
                  <div class="package-icon"></div>
                  <div class="package-info">
                    <span style="margin-right: 10px;">{{ pkg.name }}</span> <span>{{ pkg.version }}</span>
                  </div>
                  <div class="package-down">
                    <v-s-icon name="arrow-down" size="15" :color="['#707070']" />
                  </div>
                </div>
                <div class="status-indicator">
                  <div v-if="!pkg.checked" class="package-extra"></div>
                  <v-s-icon v-else-if="currentTheme === 'light'" name="rund-while" size="15" class="check-icon" />
                  <v-s-icon v-else name="rund-an" size="15" class="check-icon" />
                </div>
              </div>
              <div></div>
            </div>
            <div class="install-options">
              <el-radio-group v-model="radio3" class="ml-4">
                <el-radio label="1" size="large" class="text">急速安装</el-radio>
                <el-radio label="2" size="large" class="text">编译安装</el-radio>
              </el-radio-group>
            </div>
          </div>
        </div>

      </div>
      <!-- <el-tabs v-model="state.activeTab" class="mt-4">
        <el-tab-pane v-for="tab in state.tabs" :key="tab.name" :label="tab.label" :name="tab.name">
           <div class="package-list">
            <div v-for="pkg in state.packages[state.activeTab] || []" :key="pkg.name" class="package-item">
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
      </el-tabs> -->
    </div>
    <template #footer>
      <div class="template-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="state.loading" @click="handleConfirm">一键安装</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.ml-4{
  .text{
    color: var(--dialog-install-color);
  }
}
.install-options {
  padding-left: 1.4375rem;
}

.install-dialog {
  padding: 1.875rem 1.875rem 0 1.875rem;
  position: relative;
  z-index: 1;

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
  }

  .close {
    position: absolute;
    top: 1.75rem;
    right:  1.75rem;
    cursor: pointer;
  }

  .top {
    font-size: 1.125rem;
    color: var(--font-color-black);
    font-weight: bold;
  }

  .top-text {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--dialog-color);

  }

  .tab-container {
    display: flex;
    justify-content: flex-start;
    margin-top: 2rem;
    padding-bottom: 1.5625rem;
    border-bottom: 1px dashed var(--dialog-color); // 添加虚线边框
    
    &-box {
      margin-right: 3.4375rem;
    }
  }

  .tab-item {
    display: flex;
    font-size: 1rem;
    color: var(--font-color-black);
    align-items: center;
  }

  .tab-indicator {
    width: 0.1875rem; // 3px / 16
    height: 0.8125rem; // 13px / 16
    background-color: var(--el-color-primary);
    margin-right: 0.5rem; // 8px / 16
    border-radius: 0.375rem; // 6px / 16
    margin-right: 0.875rem; // 14px / 16
  }

  .package-list {
    margin-top: 1.75rem;
  }

  .package-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border: 1px solid var(--dialog-border);
    border-radius: 4px;
    margin-bottom: 8px;
    transition: border-color 0.3s;

    &.selected {
      border-color:  var(--el-color-primary); // 主题色边框
      background-color: rgba(var(--primary-color), 0.05); // 添加轻微的背景色
    }
  }

  .package-icon {
    width: 1.6875rem; // 27px / 16
    height: 1.6875rem; // 27px / 16
    background-color: #ccc; // 用于替代软件图标的小盒子
    margin-right: 1.1875rem; // 19px / 16
    border-radius: 0.25rem; // 4px / 16
  }

  .package-info {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .package-down {
    box-sizing: content-box;
    width: 2.1875rem; // 35px / 16
    margin-left: 2.1875rem; // 35px / 16
    border-left: 1px solid #B7B6B7;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .select {
    margin-left: auto;
  }

  .theme-color {
    color: var(--el-color-primary); // 主题色为蓝色
  }
}

.package-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem; // 12px / 16
  margin-bottom: 0.75rem; // 12px / 16

  .package-item {
    flex: 1;
    margin-bottom: 0;
  }

  .status-indicator {
    width: 0.9375rem; // 15px / 16
    height: 0.9375rem; // 15px / 16
    position: relative;

    .package-extra {
      width: 0.875rem; // 14px / 16
      height: 0.875rem; // 14px / 16
      border-radius: 50%;
      border: 1px solid #B7B6B7;
      position: absolute;
      top: 0;
      left: 0;
      transition: opacity 0.3s ease;
    }

    .check-icon {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;

      &.v-enter-active {
        opacity: 1;
        transform: scale(1);
      }
    }
  }

  &:hover {
    .package-extra {
      border-color: var(--el-color-primary);
    }
  }

  .selected+.status-indicator {
    .package-extra {
      opacity: 0;
    }

    .check-icon {
      opacity: 1;
      transform: scale(1);
    }
  }
}
.template-footer{
  padding: 0.9375rem 1.875rem 1.875rem 0; // 15px / 16, 30px / 16
}
// 媒体查询适配
@media (max-width: 768px) {
  .install-dialog {
    padding: 1rem;

    .tab-container {
      flex-direction: column;
      margin-top: 1rem;

      &-box {
        margin-right: 0;
        margin-bottom: 1rem;
      }
    }

    .package-item {
      padding: 0.25rem;
    }
  }
}
</style>