<template>
  <el-dialog
    v-model="open"
    :show-close="false"
    :before-close="handleClose"
    destroy-on-close
    append-to-body
    @opened="onOpen"
    :class="isFullscreen ? 'full' : 'normal'"
    align-center
    :fullscreen="isFullscreen"
  >
    <template #header>
      <div class="header">
        <span>{{ $t("commons.button.preview") + " - " + fileInfo.fullPath }}</span>
        <el-space alignment="center" :size="10" class="dialog-header-icon">
          <el-tooltip
            :content="loadTooltip()"
            placement="top"
            v-if="fileInfo.type !== 'excel'"
          >
            <el-icon @click="toggleFullscreen"><FullScreen /></el-icon>
          </el-tooltip>
          <el-icon @click="handleClose" size="20"><Close /></el-icon>
        </el-space>
      </div>
    </template>
    <div
      v-loading="loading"
      :style="isFullscreen ? 'height: 90vh' : 'height: 80vh'"
    >
      <div class="preview-content">
        <el-image
          v-if="fileInfo.type === 'image'"
          :src="fileInfo.url"
          :style="isFullscreen ? 'height: 90vh' : 'height: 80vh'"
          fit="contain"
          :preview-src-list="[fileInfo.url]"
        />

        <video
          v-else-if="fileInfo.type === 'video'"
          :src="fileInfo.url"
          controls
          autoplay
          class="normal"
        ></video>

        <audio
          v-else-if="fileInfo.type === 'audio'"
          :src="fileInfo.url"
          controls
        ></audio>

        <vue-office-docx
          v-else-if="fileInfo.type === 'word'"
          :src="fileInfo.url"
          :style="isFullscreen ? 'height: 90vh' : 'height: 80vh'"
          class="full"
          @rendered="renderedHandler"
          @error="errorHandler"
        />

        <vue-office-excel
          v-else-if="fileInfo.type === 'excel'"
          :src="fileInfo.url"
          :style="isFullscreen ? 'height: 90vh;' : 'height: 80vh'"
          class="w-full"
          @rendered="renderedHandler"
          @error="errorHandler"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import i18n from "@/lang";
import { ref, reactive } from "vue";
import System from "@/utils/System";
import { ElMessage } from "element-plus";
import { Close, FullScreen } from "@element-plus/icons-vue";
import VueOfficeDocx from "@vue-office/docx";
import VueOfficeExcel from "@vue-office/excel";
import "@vue-office/docx/lib/index.css";
import "@vue-office/excel/lib/index.css";
import sconfig from "@/sstore/sconfig";
import { Api } from "@/api/Api";
interface EditProps {
  type: string;
  name: string;
  url: string;
  fullPath: string; 
}
let fileInfo = reactive<EditProps>({
  url: "",
  type: "",
  name: "",
  fullPath: ""
});
const open = ref(false);
const loading = ref(false);
const isFullscreen = ref(false);

const handleClose = () => {
  open.value = false;
};

const renderedHandler = () => {
  loading.value = false;
};
const errorHandler = () => {
  open.value = false;
  ElMessage.error(i18n.global.t("commons.msg.unSupportType"));
};
const loadTooltip = () => {
  return i18n.global.t(
    "commons.button." + (isFullscreen.value ? "quitFullscreen" : "fullscreen")
  );
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const acceptParams = async (props: any) => {
  fileInfo = props;
  isFullscreen.value = fileInfo.type === "excel";
  loading.value = true;
  fileInfo.url = `${System.env.API}/ftp/download?path=${encodeURIComponent(
    props.fullPath
  )}&timestamp=${new Date().getTime()}`;
  open.value = true;
  loading.value = false;
};

const onOpen = () => {};

defineExpose({ acceptParams });
</script>

<style scoped lang="less">
.dialog-top {
  top: 0;
}

.dialog-header-icon {
  color: var(--el-color-info);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.preview-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
