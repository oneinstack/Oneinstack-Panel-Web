<template>
    <div>
      <div :class="{ 'blur-mask': !isInstalled }">
        <slot></slot>
      </div>
      <div v-if="!isInstalled" class="mask-tip">
        <img :src="imageSrc" alt="" class="tip-image">
        <div class="tip-text">
          未安装运行环境，请点击下方按钮<span class="highlight">{{ installText }}</span>否则无法使用该页面
        </div>
        <el-button type="primary" class="install-btn" @click="handleInstall">
          {{ installText }}
          <el-icon class="el-icon--right">
            <Download />
          </el-icon>
        </el-button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import { Download } from '@element-plus/icons-vue'
  
  const props = defineProps({
    isInstalled: {
      type: Boolean,
      default: false
    },
    installText: {
      type: String,
      default: '安装Nginx'
    },
    imageSrc: {
      type: String,
      default: '/static/images/ins-Plugin.png'
    }
  })
  
  const emit = defineEmits(['install'])
  
  const handleInstall = () => {
    emit('install')
  }
  </script>
  
  <style scoped lang="less">
  .blur-mask {
    filter: blur(10px);
    pointer-events: none;
    user-select: none;
    // margin: 0 20px;
  }
  
  .mask-tip {
    position: absolute;
    top: 30%;
    left: 0;
    z-index: 10;
    width: 100%;
    max-width: auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  
    .tip-image {
      width: 359px;
      height: auto;
      margin-bottom: 8px;
    }
  
    .tip-text {
      letter-spacing: 2px;
      font-weight: 400;
      color: #000;
      font-size: 14px;
      line-height: 1.5;
  
      .highlight {
        font-size: 18px;
        color: #1677FF;
        margin: 0 2px;
      }
    }
  
    .install-btn {
      padding: 18px 22px;
      font-size: 14px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 1%;
    }
  }
  </style>