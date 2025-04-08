<template>
  <div class="drag" v-loading="loading">
    <slot name="header"></slot>
    <div
      class="el-upload-dragger"
      :class="props.className"
      @dragover="handleDragover"
      @drop="handleDrop"
      @dragleave="handleDragleave"
    >
      <slot name="drag-content">
        <div class="flex column fit flex-center" style="gap: 18px">
          <el-upload
            action="#"
            :auto-upload="false"
            ref="uploadRef"
            :on-change="fileOnChange"
            :on-exceed="handleExceed"
            :on-success="handleSuccess"
            :show-file-list="false"
            multiple
            v-model:file-list="uploaderFiles"
            :limit="1000"
          >
            <div class="el-upload__text">
              {{$t('file.uploadText')}}<el-link> {{ $t('file.clickUpload')}}</el-link>
            </div>
          </el-upload>
        </div>
      </slot>
    </div>
    <el-upload
      v-if="props.autoUpload"
      action="#"
      :auto-upload="false"
      ref="uploadRef"
      :on-change="fileOnChange"
      :on-exceed="handleExceed"
      :on-success="handleSuccess"
      :show-file-list="false"
      multiple
      v-model:file-list="uploaderFiles"
      :limit="1000"
    >
    </el-upload>
    <div v-if="props.isShowFileList">
      <template v-if="loading">
        <el-text>{{ uploadHelper }}</el-text>
        <el-progress
          v-if="loading"
          text-inside
          :stroke-width="20"
          :percentage="uploadPercent"
        ></el-progress>
      </template>
      <p
        v-for="(item, index) in uploaderFiles"
        :key="index"
        class="file-item"
        @mouseover="hoverIndex = index"
        @mouseout="hoverIndex = null"
      >
        <el-icon class="file-icon"><Document /></el-icon>
        <span v-if="item.raw.webkitRelativePath != ''">{{
          item.raw.webkitRelativePath
        }}</span>
        <span v-else>{{ item.name }}</span>
        <span v-if="item.status === 'success'" class="success-icon">
          <el-icon><Select /></el-icon>
        </span>
        <span v-else>
          <el-button
            class="delete-button"
            type="primary"
            link
            @click="removeFile(index)"
            :disabled="loading"
            :icon="Close"
          ></el-button>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, onMounted, watch } from "vue";
import {
  UploadFile,
  UploadFiles,
  UploadInstance,
  UploadProps,
  UploadRawFile,
} from "element-plus";
import i18n from "@/lang";
import { Close, Document, UploadFilled, Select } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance } from "element-plus";
import { Api } from "@/api/Api";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = defineProps({
  path: {
    type: String,
    default: "",
  },
  uploadType: {
    type: String,
    default: "file",
  },
  isShowFileList: {
    type: Boolean,
    default: true,
  },
  uploadApi: {
    type: Function,
    default: () => {},
  },
  autoUpload: {
    type: Boolean,
    default: false,
  },
  className: {
    type: String,
    default: "",
  }
});
const emit = defineEmits(["upload-success"]);
interface UploadFileProps {
  path: string;
  uploadType: "file" | "dir";
}

const uploadRef = ref<UploadInstance>();
const loading = ref(false);
let uploadPercent = ref(0);
let uploadHelper = ref("");

const state = reactive({
  uploadEle: null as any,
});
// const uploaderFiles = ref<UploadFiles>([]);
const uploaderFiles = ref<any>([]);
const hoverIndex = ref<number | null>(null);
const tmpFiles = ref<UploadFiles>([]);
const breakFlag = ref(false);
const CHUNK_SIZE = 1024 * 1024 * 5;
const MAX_SINGLE_FILE_SIZE = 1024 * 1024 * 10;

const removeFile = (index: number) => {
  uploaderFiles.value.splice(index, 1);
};

const handleDragover = (event: DragEvent) => {
  event.preventDefault();
};

const initTempFiles = () => {
  tmpFiles.value = [];
  breakFlag.value = false;
};

const handleDrop = async (event: DragEvent) => {
  initTempFiles();
  event.preventDefault();
  const items = event.dataTransfer?.items;
  if (items) {
    const entries = Array.from(items).map((item) => item.webkitGetAsEntry());
    await Promise.all(entries.map((entry) => traverseFileTree(entry)));
    if (!breakFlag.value) {
      uploaderFiles.value = uploaderFiles.value.concat(tmpFiles.value);
      if (props.autoUpload && !props.isShowFileList) {
        submit();
      }
    } else {
      ElMessage.warning(t("file.uploadOverLimit"));
    }
    initTempFiles();
  }
};

const convertFileToUploadFile = (file: File, path: string): UploadFile => {
  const uid = Date.now();

  const uploadRawFile: UploadRawFile = new File([file], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  }) as UploadRawFile;
  uploadRawFile.uid = uid;

  let fileName = file.name;
  if (path != "") {
    fileName = path + file.name;
  }
  return {
    name: fileName,
    size: file.size,
    status: "ready",
    uid: uid,
    raw: uploadRawFile,
  };
};

const traverseFileTree = async (item: any, path = "") => {
  path = path || "";
  if (!item) {
    return;
  }
  if (item.isFile) {
    if (tmpFiles.value.length > 1000) {
      breakFlag.value = true;
      return;
    }
    await new Promise<void>((resolve) => {
      item.file((file: File) => {
        if (!breakFlag.value) {
          tmpFiles.value.push(convertFileToUploadFile(file, path));
        }
        resolve();
      });
    });
  } else if (item.isDirectory) {
    const dirReader = item.createReader();
    const readEntries = async () => {
      const entries = await new Promise<any[]>((resolve) => {
        dirReader.readEntries((entries: any[] | PromiseLike<any[]>) => {
          resolve(entries);
        });
      });

      if (entries.length === 0) {
        return;
      }

      for (const element of entries) {
        await traverseFileTree(element, path + item.name + "/");
        if (breakFlag.value) {
          return;
        }
      }
      await readEntries();
    };
    await readEntries();
  }
};

const handleDragleave = (event: { preventDefault: () => void }) => {
  event.preventDefault();
};

const fileOnChange = (_uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  if (_uploadFile.size == 64 || _uploadFile.size == 0) {
    uploaderFiles.value = uploadFiles;
    const reader = new FileReader();
    reader.readAsDataURL(_uploadFile.raw as Blob);
    reader.onload = async () => {};
    reader.onerror = () => {
      uploaderFiles.value = uploaderFiles.value.filter(
        (file: UploadFile) => file.uid !== _uploadFile.uid
      );
      ElMessage.error(t("file.typeErrOrEmpty", [_uploadFile.name]));
    };
  } else {
    uploaderFiles.value = uploadFiles;
  }
};

const clearFiles = () => {
  uploadRef.value!.clearFiles();
  uploaderFiles.value = [];
};

const handleExceed: UploadProps["onExceed"] = () => {
  clearFiles();
  ElMessage.warning(t("file.uploadOverLimit"));
};

const handleSuccess: UploadProps["onSuccess"] = (res, file) => {
  file.status = "success";
};

const submit = async () => {
  const files = uploaderFiles.value.slice();
  await uploadFile(files);
  //   const fileNamesWithPath = Array.from(
  //     new Set(
  //       files.map(
  //         (file) => `${props.path}/${file.raw.webkitRelativePath || file.name}`
  //       )
  //     )
  //   );
  // const existFiles = await BatchCheckFiles(fileNamesWithPath);
  // if (existFiles.data.length > 0) {
  //   const fileSizeMap = new Map(
  //     files.map((file) => [
  //       `${props.path}/${file.raw.webkitRelativePath || file.name}`,
  //       file.size,
  //     ])
  //   );
  //   existFiles.data.forEach((file) => {
  //     if (fileSizeMap.has(file.path)) {
  //       file.uploadSize = fileSizeMap.get(file.path);
  //     }
  //   });
  //   dialogExistFileRef.value.acceptParams({
  //     paths: existFiles.data,
  //     onConfirm: handleFileUpload,
  //   });
  // } else {
  //   await uploadFile(files);
  // }
};

const handleFileUpload = (
  action: "skip" | "overwrite",
  skippedPaths: string[] = []
) => {
  const files = uploaderFiles.value.slice();
  if (action === "skip") {
    const filteredFiles = files.filter(
      (file: any) =>
        !skippedPaths.includes(
          `${props.path}/${file.raw.webkitRelativePath || file.name}`
        )
    );
    uploaderFiles.value = filteredFiles;
    uploadFile(filteredFiles);
  } else if (action === "overwrite") {
    uploadFile(files);
  }
};

const uploadFile = async (files: any[]) => {
  if (props.path == "/") return ElMessage.warning(t('file.notAllowUpload'));
  if (files.length == 0) {
    clearFiles();
  } else {
    loading.value = true;
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadHelper.value = t("file.fileUploadStart", [file.name]);

      //   let isSuccess =
      //     file.size <= MAX_SINGLE_FILE_SIZE
      //       ? await uploadSingleFile(file)
      //       : await uploadLargeFile(file);
      let isSuccess = await uploadSingleFile(file);
      if (isSuccess) {
        successCount++;
        uploaderFiles.value[i].status = "success";
      } else {
        uploaderFiles.value[i].status = "fail";
      }
    }

    loading.value = false;
    uploadHelper.value = "";

    if (successCount === files.length) {
      clearFiles();
      ElMessage.success(t("file.uploadSuccess"));
      emit("upload-success");
    }
  }
};

const uploadSingleFile = async (file: { raw: string | Blob }) => {
  uploadPercent.value = 0;
  //   await UploadFileData(formData, {
  //     onUploadProgress: (progressEvent) => {
  //       uploadPercent.value = Math.round(
  //         (progressEvent.loaded / progressEvent.total) * 100
  //       );
  //     },
  //     timeout: 40000,
  //   });
  //   const api = props.uploadApi || Api.uploadFile;
  await Api.uploadFile(
    {
      file: file.raw,
      path: getUploadPath(file),
    },
    (progressEvent: any) => {
      uploadPercent.value = Math.round(
        (progressEvent.loaded / progressEvent.total) * 100
      );
    }
  );

  return true;
};

// const uploadLargeFile = async (file: {
//   size: any;
//   raw: string | Blob;
//   name: string;
// }) => {
//   const fileSize = file.size;
//   const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);
//   let uploadedChunkCount = 0;
//   for (let c = 0; c < chunkCount; c++) {
//     const start = c * CHUNK_SIZE;
//     const end = Math.min(start + CHUNK_SIZE, fileSize);
//     const chunk = file.raw.slice(start, end);
//     const formData = new FormData();
//     formData.append("filename", getFilenameFromPath(file.name));
//     formData.append("path", getUploadPath(file));
//     formData.append("chunk", chunk);
//     formData.append("chunkIndex", c.toString());
//     formData.append("chunkCount", chunkCount.toString());

//     // try {
//     //   await ChunkUploadFileData(formData, {
//     //     onUploadProgress: (progressEvent) => {
//     //       uploadPercent.value = Math.round(
//     //         ((uploadedChunkCount + progressEvent.loaded / progressEvent.total) *
//     //           100) /
//     //           chunkCount
//     //       );
//     //     },
//     //     timeout: 60000,
//     //   });
//     //   uploadedChunkCount++;
//     // } catch (error) {
//     //   return false;
//     // }
//   }

//   return uploadedChunkCount === chunkCount;
// };

const getUploadPath = (file: any) => {
  return `${props.path}/${getPathWithoutFilename(file.raw.webkitRelativePath || file.name)}`;
};

const getPathWithoutFilename = (path: string) => {
  return path ? path.split("/").slice(0, -1).join("/") : path;
};

const getFilenameFromPath = (path: string) => {
  return path ? path.split("/").pop() : path;
};

const acceptParams = (props: UploadFileProps) => {
  props.path = props.path;
  uploadPercent.value = 0;
  uploadHelper.value = "";
  nextTick(() => {
    state.uploadEle = document.querySelector(".el-upload__input");
  });
};
onMounted(() => {
  if (props.uploadType == "dir") {
    state.uploadEle = document.querySelector(".el-upload__input");
    state.uploadEle.webkitdirectory = true;
  }
});
defineExpose({ acceptParams, clearFiles, submit });
</script>

<style lang="less" scoped>
:deep(.el-upload__text) {
  height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.drag {
  height: 100%;
  width: 100%;
  background: var(--bg-color);
}
.flex-center {
  > div {
    width: 100%;
    background: rgb(var(--bg-color));
  }
}
.file-item {
  font-size: 14px;
  color: #888;
  position: relative;
  display: flex;
  align-items: center;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.file-icon {
  margin-right: 8px;
}

.delete-button {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.success-icon {
  color: green;
  position: absolute;
  right: 0;
}
</style>
