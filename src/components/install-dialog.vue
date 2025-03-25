<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

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
      <img src="/static/images/bj-install.png" alt="" class="background-image">
      <v-s-icon name="off" size="32" classs="close" @click="handleClose" />
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
                  <v-s-icon v-else name="rund-while" size="15" class="check-icon" />
                </div>
              </div>
              <div></div>
            </div>
            <div class="install-options">
              <div class="mb-2 flex items-center text-sm">
                <el-radio-group v-model="radio1" class="ml-4">
                  <el-radio label="1" size="large">急速安装</el-radio>
                  <el-radio label="2" size="large">编译安装</el-radio>
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
                  <v-s-icon v-else name="rund-while" size="15" class="check-icon" />
                </div>
              </div>
              <div></div>
            </div>

            <div class="install-options">
              <el-radio-group v-model="radio2" class="ml-4">
                <el-radio label="1" size="large">急速安装</el-radio>
                <el-radio label="2" size="large">编译安装</el-radio>
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
                  <v-s-icon v-else name="rund-while" size="15" class="check-icon" />
                </div>
              </div>
              <div></div>
            </div>
            <div class="install-options">
              <el-radio-group v-model="radio3" class="ml-4">
                <el-radio label="1" size="large">急速安装</el-radio>
                <el-radio label="2" size="large">编译安装</el-radio>
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
.install-options {
  padding-left: 23px;
}

.install-dialog {
  padding: 30px 30px 0 30px;
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
    top: 28px;
    right: 28px;
    cursor: pointer;
  }

  .top {
    font-size: 18px;
    color: #2B2B2B;
    font-weight: bold;
  }

  .top-text {
    margin-top: 8px;
    font-size: 14px;
    color: #969696;

  }

  .tab-container {
    display: flex;
    justify-content: flex-start;
    margin-top: 32px;
    padding-bottom: 25px;
    border-bottom: 1px dashed #c9c9c9; // 添加虚线边框
    
    &-box {
      margin-right: 55px;
    }
  }

  .tab-item {
    display: flex;
    font-size: 16px;
    color: #333;
    align-items: center;
  }

  .tab-indicator {
    width: 3px;
    height: 13px;
    background-color: #1677FF; // 橙色指示器
    margin-right: 8px;
    border-radius: 6px;
    margin-right: 14px;
  }

  .package-list {
    margin-top: 28px;
  }

  .package-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    margin-bottom: 8px;
    transition: border-color 0.3s;

    &.selected {
      border-color: #1677FF; // 主题色边框
      background-color: rgba(22, 119, 255, 0.05); // 添加轻微的背景色
    }
  }

  .package-icon {
    width: 27px;
    height: 27px;
    background-color: #ccc; // 用于替代软件图标的小盒子
    margin-right: 19px;
    border-radius: 4px;
  }

  .package-info {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .package-down {
    box-sizing: content-box;
    width: 35px;
    margin-left: 35px;
    border-left: 1px solid #B7B6B7;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .select {
    margin-left: auto;
  }

  .theme-color {
    color: #1677FF; // 主题色为蓝色
  }
}

.package-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .package-item {
    flex: 1;
    margin-bottom: 0;
  }

  .status-indicator {
    width: 15px;
    height: 15px;
    position: relative;

    .package-extra {
      width: 14px;
      height: 14px;
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
      border-color: #1677FF;
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
 padding: 15px 30px 30px 0;
}
</style>