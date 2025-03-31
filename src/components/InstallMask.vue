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
    <custom-dialog v-model:show="dialog.show" title="安装日志" :on-close="dialog.onClose" draggable
      :close-on-click-modal="false">
      <el-input ref="logTextareaRef" v-model="dialog.content" type="textarea" readonly
        style=" min-height: 280px; scroll-behavior: smooth;" />
      <template #footer>
        <el-button v-if="dialog.completed" type="primary" @click="dialog.onClose" :loading="dialog.loading">
          {{ dialog.loading ? '正在刷新' : '安装完成' }}
        </el-button>
      </template>
    </custom-dialog>
    <el-dialog v-model="versionDialog.show" :title="`选择 ${versionDialog.currentItem?.name} 版本`" width="30%">
      <el-select v-model="installForm.value.version" placeholder="请选择版本">
        <el-option v-for="version in versionDialog.currentItem?.versions" :key="version" :label="version"
          :value="version" />
      </el-select>
      <template #footer>
        <el-button @click="versionDialog.onClose">取消</el-button>
        <el-button type="primary" @click="versionDialog.onConfirm">安装</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, reactive, ref, nextTick } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import { Scope } from 'tools-vue3'
import { ElInput, ElMessage } from "element-plus";
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

const handleInstall = async () => {
  //点击下载添加跳转逻辑
  // emit('install')
  const softwareName = props.installText.replace(/下载|安装/g, '').trim()//获取软件名
  console.log('获取的软件名称', softwareName)
  const params = {//获取软件列表传的参数
    page: 1,
    pageSize: 9,
    name: softwareName
  }
  const { data: res } = await Api.getSoftList(params)
  // console.log('获取的软件列表', res.data)
  // 添加状态判断
  if (res.data[0].status === 1) {
    ElMessage({
      type: 'warning',
      message: '插件已在安装中，请勿重复点击,可以在软件商店中查看安装进度'
    })
    return
  } else if (res.data[0].status === 0) {
    handleInstallClick(res.data[0])
  }
}

// 在 script setup 中添加 installForm 定义
const installForm = reactive({
  value: {
    version: ''
  }
})
const versionDialog = reactive({
  show: false,
  currentItem: null as any,
  onClose: () => {
    versionDialog.show = false;
    versionDialog.currentItem = null;
  },
  onConfirm: () => {
    versionDialog.show = false;
    const selectedVersion = installForm.value.version || versionDialog.currentItem.versions[0];
    DownloadSoftware(selectedVersion, versionDialog.currentItem);
  },
});
const DownloadSoftware = async (version: string, item: any) => {
  const installForm = {
    key: item.key,
    version: version,
  };
  console.log('开始安装', versionDialog.currentItem);
  const { data: res } = await Api.installSoft(installForm);
  // console.log("res", res);
  handleCheckInstallLog(res.installName);//显示安装日志信息
};
// 修改原有的点击安装按钮事件
const handleInstallClick = (item: any) => {
  if (item.versions.length > 1) {
    versionDialog.currentItem = item;
    versionDialog.show = true; // 显示版本选择弹窗
    installForm.value.version = item.versions[0];
    // console.log('当前选择的版本', versionDialog.currentItem)
    // versionDialog.show = true;
  } else {
    // 如果只有一个版本，直接安装
    DownloadSoftware(item.versions[0], item)
    // console.log('当前选择的版本', item)


  }
}
const dialog = reactive({
  show: false,
  content: "",
  completed: false, // 添加安装完成状态
  loading: false, // 添加 loading 状态
  onClose: () => {
    dialog.loading = true; // 开始加载动画
    timer && timer.clear();
    
     // 先显示成功提示
     ElMessage({
      type: 'success',
      message: '安装成功，页面即将刷新...',
      duration: 1500
    });

    // 添加淡出动画
    setTimeout(() => {
      const fadeOverlay = document.createElement('div');
      fadeOverlay.className = 'fade-overlay';
      document.body.appendChild(fadeOverlay);
      
      // 等待提示显示和动画完成后再刷新
      setTimeout(() => {
        dialog.show = false;
        location.reload();
      }, 600);
    }, 1000);
  },
});
// 添加 ref
const timer = Scope.Timer();
const logTextareaRef = ref<InstanceType<typeof ElInput> | null>(null);
const handleCheckInstallLog = async (value: string) => {
  console.log("value", value);
  dialog.show = true;
  timer.on(
    async () => {
      const { data: res2 } = await Api.getInstallLog({ fn: value });
      dialog.content = res2.logs.content; // 更新为正确的日志内容路径
      dialog.completed = res2.logs.completed; // 更新安装完成状态
      // 如果安装完成，清除定时器
      if (dialog.completed) {
        timer.clear();
      }
      // 添加自动滚动
      await nextTick();
      const textarea = logTextareaRef.value?.$el?.querySelector("textarea");
      if (textarea) {
        // 使用 requestAnimationFrame 实现平滑滚动
        requestAnimationFrame(() => {
          textarea.scrollTo({
            top: textarea.scrollHeight,
            behavior: "smooth",
          });
        });
      }
    },
    2000,
    true
  )
}

</script>

<style scoped lang="less">
/* 修改全局样式写法 */
:deep(.fade-overlay) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  animation: fade-in-out 0.6s ease-in-out forwards;
}

@keyframes fade-in-out {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 1;
  }
}

:deep(textarea) {
  height: 280px !important;
}

.blur-mask {
  position: relative;
  filter: blur(10px);
  pointer-events: none;
  user-select: none;
  // margin: 0 20px;
}

.mask-tip {
  position: absolute;
  top: 20%;
  left: 40%;
  z-index: 10;
  width: auto;
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

:deep(.fade-overlay) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  animation: fade-in-out 0.6s ease-in-out forwards;
}

@keyframes fade-in-out {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>