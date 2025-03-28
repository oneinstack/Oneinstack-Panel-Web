<script setup lang="ts">
import { Api } from "@/api/Api";
import CustomDialog from "@/components/custom-dialog.vue";
import CustomTable from "@/components/custom-table.vue";
import sutil from "@/sstore/sutil";
import {
  Refresh,
  Search,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Delete,
  RefreshRight,
  Setting,
} from "@element-plus/icons-vue";
import {
  ElMessage,
  FormInstance,
  UploadFile,
  UploadInstance,
} from "element-plus";
import { nextTick, onMounted, reactive, useTemplateRef, ref, computed } from 'vue';
import type { DrawerType, DrawerOpenType } from "../index.vue";
import System from "@/utils/System";
import sconfig from "@/sstore/sconfig";
import { checkLink } from "@/utils/validator";
import CodeEditor from "./code-editor.vue";
import Upload from "@/components/upload.vue";
import { useRouter } from "vue-router";
const router = useRouter();
interface Emits {
  (e: "update:path", value: string[]): void;
  (
    e: "open-drawer",
    openType: DrawerOpenType,
    type: DrawerType,
    row?: any
  ): void;
}

const emit = defineEmits<Emits>();
const codeEditorRef = ref();
const uploadRef1 = ref<InstanceType<typeof Upload> | null>(null);
const conf = reactive({
  path: ["/"],
  columns: [
    {
      prop: "name",
      label: "文件名称",
      sortable: true,
      width: "420",
      tooltip: true,
    },
    { prop: "permissions", label: "权限", width: "180" },
    { prop: "user", label: "用户", width: "180" },
    { prop: "group", label: "用户组", width: "180" },
    { prop: "size", label: "大小", width: "150", sortable: true },
    { prop: "modTime", label: "修改时间", width: "160", sortable: true },
    {
      prop: "action",
      label: "操作",
      width: "280",
      align: "center",
      fixed: "right",
    },
  ],
  fileList: [],
  loading: false,
  getFileList: async (refresh = false) => {
    if (!refresh) emit("update:path", conf.path);
    const path = conf.path.join("/").replace(/\/\//g, "/");
    conf.loading = true;
    const { data: res } = await Api.getFileList({
      path,
      final: (isSuccess: boolean) => {
        conf.loading = false;
        if (!isSuccess) return conf.handleBackLevel();
      },
    });
    conf.fileList = res.files ?? [];
  },
  refresh: () => conf.getFileList(true),
  handleFileClick: (row: any) => {
    if (!row.isDir) {
      conf.openCodeEditor(row);
    } else {
      conf.path.push(row.name);
      conf.getFileList();
    }
  },
  openCodeEditor: (row:any) => {
    const path = conf.path.join("/").replace(/\/\//g, "/");
    const fullPath = `${path === "/" ? "" : path}/${row.name}`;
    codeEditorRef.value.acceptParams({path,fullPath});
    // codeReq.path = path;
    // codeReq.expand = true;
    // if (extension != "") {
    //   Languages.forEach((language) => {
    //     const ext = extension.substring(1);
    //     if (language.value.indexOf(ext) > -1) {
    //       fileEdit.language = language.label;
    //     }
    //   });
    // }
    const fileEdit = reactive({
      path: "",
      name: "",
      extension: "",
      content: "",
    });
    Api.fileContent({ path:fullPath })
      .then((res) => {
        fileEdit.content = res.data.content;
        fileEdit.path = res.data.path;
        fileEdit.name = res.data.name;
        fileEdit.extension = res.data.extension;
        codeEditorRef.value.acceptParams(fileEdit);
      })
      .catch(() => {});
  },
  handleBackLevel: (index = conf.path.length - 2) => {
    if (conf.path.length === 1) return;
    conf.path = conf.path.slice(0, index + 1);
    conf.getFileList();
  },
  inputPath: "",
  isInputPath: false,
  inputPathRef: useTemplateRef<HTMLInputElement>("inputPathRef"),
  handleClickOutside: (e: MouseEvent) => {
    if (e.target === conf.inputPathRef) return;
    conf.isInputPath = false;
    window.removeEventListener("click", conf.handleClickOutside);
  },
  handleInputPath: () => {
    conf.isInputPath = true;
    conf.inputPath = conf.path.join("/").replace(/\/\//g, "/");
    nextTick(() => {
      conf.inputPathRef?.focus();
      window.addEventListener("click", conf.handleClickOutside);
    });
  },
  handleInputPathConfirm: () => {
    if (!sutil.matchFilePath(conf.inputPath) && conf.inputPath !== "/")
      return ElMessage.error("请输入正确的文件路径");
    conf.isInputPath = false;
    conf.path =
      conf.inputPath === "/"
        ? ["/"]
        : conf.inputPath.split("/").map((item) => (item === "" ? "/" : item));
    conf.getFileList();
  },
  handleOpenDrawer: (openType: DrawerOpenType, type: DrawerType, row?: any) => {
    emit("open-drawer", openType, type, row);
  },
  handleFileDownload: async (row: any) => {
    const path = conf.path.join("/").replace(/\/\//g, "/");
    await Api.downloadFile({
      path: `${path === "/" ? "" : path}/${row.name}`,
      filename: row.name,
    });
    ElMessage.success("下载成功！");
  },
  fileDialog: {
    row: {} as any,
    show: false,
    type: "delete",
    title: "删除文件",
    confirmText: "确定",
    cancelText: "取消",
    open: (type: "delete" | "upload" | "linkDownload", row?: any) => {
      switch (type) {
        case "delete":
          conf.fileDialog.row = row;
          conf.fileDialog.title = "删除文件";
          conf.fileDialog.confirmText = "确定";
          break;
        case "upload":
          const path = conf.path.join("/").replace(/\/\//g, "/");
          conf.fileDialog.row = {
            path,
          };
          conf.fileDialog.title = `上传文件到[${path}]`;
          conf.fileDialog.confirmText = "开始上传";
          break;
        case "linkDownload":
          conf.fileDialog.title = `URL链接下载`;
          conf.fileDialog.confirmText = "确定";
          break;
      }
      conf.fileDialog.type = type;
      conf.fileDialog.show = true;
    },
    close: () => {
      conf.fileDialog.show = false;
      conf.fileDialog.row = {};
      conf.upload.instance?.clearFiles();
      conf.linkDownload.instance?.resetFields();
      conf.linkDownload.instance?.clearValidate();
    },
    confirm: async () => {
      if (conf.fileDialog.type === "upload") return uploadRef1.value?.submit();
      // return conf.upload.instance?.submit();
      if (conf.fileDialog.type === "linkDownload") {
        const res = await conf.linkDownload.instance?.validate();
        if (!res) return;
      }
      if (conf.fileDialog.type === "delete") {
        const path = conf.path.join("/").replace(/\/\//g, "/");
        const { data: msg } = await Api.deleteFile({
          path: `${path}/${conf.fileDialog.row.name}`,
        });
        ElMessage.success(msg);
      }
      conf.fileDialog.close();
      conf.refresh();
    },
  },
  upload: {
    instance: useTemplateRef<UploadInstance>("uploadRef"),
    state: {
      uploadEle: null as HTMLElement | null,
    },
    onChange: ({ status, response: res }: UploadFile) => {
      if (status === "success") ElMessage.success((res as any).data);
      else if (status === "fail") ElMessage.error((res as any).data);
      else return;
      conf.refresh();
      conf.fileDialog.close();
    },
    handleOpenDialog: () => {
      if (conf.path.length === 1)
        return ElMessage.error("不能直接上传文件到系统根目录!");
      conf.fileDialog.open("upload");
    },
  },
  linkDownload: {
    instance: useTemplateRef<FormInstance>("formRef"),
  },
  selectFolder: {
    show: false,
    path: "",
    open: () => {
      conf.selectFolder.show = true;
    },
    confirm: () => {
      conf.fileDialog.row.path = conf.selectFolder.path;
      conf.selectFolder.show = false;
    },
  },
  getWidth: () => {},
});

onMounted(() => {
  conf.getFileList();
});
const pathStr = computed(() => {
  return conf.path.join("/").replace(/\/\//g, "/");
});
defineExpose({
  refresh: () => conf.refresh(),
});
</script>

<template>
  <div class="file-list">
    <Upload :is-show-file-list="false" :auto-upload="true" :path="pathStr" @upload-success="conf.getFileList()">
      <template #drag-content>
        <div class="box1" style="border-radius: 4px">
          <div class="flex items-center" style="width: 100%; flex: 0.8">
            <div
              class="back-level hover-opacity"
              @click="conf.handleBackLevel()"
            >
              <el-icon size="24"><ArrowLeft /></el-icon>
            </div>
            <div style="flex: 1" @click.stop="conf.handleInputPath">
              <el-breadcrumb
                v-if="!conf.isInputPath"
                :separator-icon="ArrowRight"
              >
                <el-breadcrumb-item
                  v-for="(item, index) in conf.path"
                  :key="index"
                  @click.stop="conf.handleBackLevel(index)"
                >
                  {{ index === 0 ? "根目录" : item }}
                </el-breadcrumb-item>
              </el-breadcrumb>
              <el-input
                v-else
                v-model="conf.inputPath"
                ref="inputPathRef"
                @blur="conf.handleInputPathConfirm"
                @keyup.enter="conf.handleInputPathConfirm"
              />
            </div>
          </div>
          <el-space :size="42">
            <el-link @click.stop="conf.handleInputPath">搜索文件/目录</el-link>
            <el-checkbox label="包含子目录" size="large" />
            <div class="flex items-center">
              <el-button
                class="refresh-btn"
                :icon="RefreshRight"
                @click="conf.refresh"
              />
              <el-button
                class="search-btn"
                :icon="Search"
                @click="conf.handleInputPathConfirm"
              />
            </div>
          </el-space>
        </div>
        <div class="file-tool">
          <div class="left">
            <el-space :size="14" class="btn-group">
              <el-dropdown>
                <el-button type="primary">
                  上传/下载
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="conf.upload.handleOpenDialog"
                      >上传文件/文件夹</el-dropdown-item
                    >
                    <el-dropdown-item
                      @click="conf.fileDialog.open('linkDownload')"
                      >URL链接下载</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <!-- <el-dropdown>
          <el-button class="btn">
            新建
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                @click="conf.handleOpenDrawer('create', 'file')"
              >
                <div class="flex items-center" style="gap: 10px">
                  <v-s-icon name="txt" size="22" />
                  <span>文件</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item @click="conf.handleOpenDrawer('create', 'dir')">
                <div class="flex items-center" style="gap: 10px">
                  <v-s-icon name="folder" size="22" />
                  <span>文件夹</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button class="btn">终端</el-button>
        <el-button class="btn">/（根目录）29.47GB</el-button> -->
            </el-space>
            <div class="btns">
              <el-dropdown>
                <div class="btn">
                  新建 <el-icon class="icon"><arrow-down /></el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      @click="conf.handleOpenDrawer('create', 'file')"
                    >
                      <div class="flex items-center" style="gap: 10px">
                        <v-s-icon name="txt" size="22" />
                        <span>文件</span>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item
                      @click="conf.handleOpenDrawer('create', 'dir')"
                    >
                      <div class="flex items-center" style="gap: 10px">
                        <v-s-icon name="folder" size="22" />
                        <span>文件夹</span>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div class="btn" @click="router.push({path:'/terminal'})">
                终端
                <el-icon class="icon"><arrow-down /></el-icon>
              </div>
              <div class="btn">/（根目录）29.47GB</div>
            </div>
          </div>

          <!-- <div class="flex items-center">
            <SearchInput class="search-input" placeholder="请输入域名或备注" />
            <el-button
              class="refresh1-btn"
              type="primary"
              :icon="Refresh"
              @click="conf.refresh"
            />
            <el-button class="setting-btn" type="primary" :icon="Setting" />
          </div> -->
          <!-- <div class="demo-form-inline">
        <el-button type="primary">
          <span class="mr-1">回收站</span>
          <el-icon size="16"><Delete /></el-icon>
        </el-button>
      </div> -->
        </div>
        <div class="box2">
          <custom-table
            :data="conf.fileList"
            :columns="conf.columns"
            :loading="conf.loading"
          >
            <template #name="{ row }">
              <div class="flex items-center file-name-cell" style="gap: 10px">
                <v-s-icon
                  class="file-icon"
                  :name="row.isDir ? 'folder' : 'txt'"
                  size="22"
                />
                <el-link class="file-link" @click="conf.handleFileClick(row)">
                  <span class="ellipsis file-name">{{ row.name }}</span>
                </el-link>
              </div>
            </template>
            <template #permissions="{ row }">
              <el-link
                @click="
                  conf.handleOpenDrawer(
                    'editPER',
                    row.isDir ? 'dir' : 'file',
                    row
                  )
                "
              >
                {{ row.permissions?.padEnd(4, "0") }}
              </el-link>
            </template>
            <template #user="{ row }">
              <el-link
                @click="
                  conf.handleOpenDrawer(
                    'editUser',
                    row.isDir ? 'dir' : 'file',
                    row
                  )
                "
                >{{ row.user }}</el-link
              >
            </template>
            <template #group="{ row }">
              <el-link
                @click="
                  conf.handleOpenDrawer(
                    'editUser',
                    row.isDir ? 'dir' : 'file',
                    row
                  )
                "
                >{{ row.group }}</el-link
              >
            </template>
            <template #action="{ row }">
              <el-button type="primary" link @click="conf.handleFileClick(row)"
                >打开</el-button
              >
              <el-button
                type="primary"
                link
                @click="conf.handleFileDownload(row)"
                >下载</el-button
              >
              <!-- <el-button type="primary" link @click="conf.handleOpenDrawer('editPER', row.isDir ? 'dir' : 'file', row)">
            编辑权限
          </el-button> -->
              <!-- <el-button type="danger" link @click="conf.fileDialog.open('delete', row)">删除</el-button> -->
              <el-dropdown class="dropdown-more">
                <el-button type="primary" link>
                  更多
                  <!-- <el-icon class="el-icon--right"><arrow-down /></el-icon> -->
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      @click="conf.fileDialog.open('delete', row)"
                      >删除</el-dropdown-item
                    >
                    <el-dropdown-item
                      @click="
                        conf.handleOpenDrawer(
                          'editPER',
                          row.isDir ? 'dir' : 'file',
                          row
                        )
                      "
                      >编辑权限</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </custom-table>
        </div>
      </template>
    </Upload>
    <custom-dialog
      v-model="conf.fileDialog.show"
      :title="conf.fileDialog.title"
    >
      <template v-if="conf.fileDialog.type === 'delete'">
        <el-alert
          title="确定删除所选文件？"
          type="warning"
          show-icon
          :closable="false"
        />
        <div class="flex items-center" style="gap: 10px; margin-top: 20px">
          <v-s-icon
            :name="conf.fileDialog.row?.isDir ? 'folder' : 'txt'"
            size="22"
          />
          <span style="color: var(--font-color-gray)">{{
            conf.fileDialog.row.name
          }}</span>
        </div>
      </template>
      <template v-else-if="conf.fileDialog.type === 'upload'">
        <!-- <div class="flex column" style="gap: 18px">
          <div class="flex justify-end">
            <el-button type="info" @click="conf.upload.instance?.clearFiles()"
              >清空列表</el-button
            >
          </div>
          <el-upload
            ref="uploadRef"
            drag
            :data="conf.fileDialog.row"
            :headers="{ Authorization: `Bearer ${sconfig.userInfo?.token}` }"
            :auto-upload="false"
            multiple
            :action="`${System.env.API}/ftp/upload`"
            :on-change="conf.upload.onChange"
            :before-upload="conf.upload.beforeUpload"
          >
            <div class="el-upload__text">请将需要上传的文件/文件夹拖到此处</div>
          </el-upload>
        </div> -->
        <Upload
          ref="uploadRef1"
          :path="pathStr"
          @upload-success="conf.getFileList()"
        >
          <template #header>
            <div class="flex justify-end upload-header">
              <el-button type="info" @click="uploadRef1?.clearFiles()">清空列表</el-button>
            </div>
          </template>
        </Upload>
      </template>
      <template v-else-if="conf.fileDialog.type === 'linkDownload'">
        <el-form
          ref="formRef"
          :model="conf.fileDialog.row"
          :rules="{
            name: [
              { required: true, message: '请输入文件名', trigger: 'change' },
            ],
            url: [
              { required: true, message: 'URL链接不能为空', trigger: 'change' },
              { validator: checkLink, trigger: 'change' },
            ],
          }"
          label-width="100px"
        >
          <el-form-item label="URL地址" prop="url">
            <el-input
              v-model="conf.fileDialog.row.url"
              placeholder="在此处粘贴或输入url地址"
              clearable
            />
          </el-form-item>
          <el-form-item label="下载到" prop="path">
            <el-input
              v-model="conf.fileDialog.row.path"
              placeholder="请选择下载路径"
            >
              <template #append>
                <v-s-icon
                  class="cursor-pointer"
                  name="folders"
                  @click="conf.selectFolder.open"
                />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="文件名" prop="name">
            <el-input
              v-model="conf.fileDialog.row.name"
              placeholder="请输入保存文件名"
              clearable
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button
          v-if="conf.fileDialog.type !== 'upload'"
          @click="conf.fileDialog.close"
        >
          {{ conf.fileDialog.cancelText }}
        </el-button>
        <el-button type="primary" @click="conf.fileDialog.confirm">{{
          conf.fileDialog.confirmText
        }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.selectFolder.show" title="选择文件夹">
      <file-panel @select="(path) => (conf.selectFolder.path = path)" />
      <template #footer>
        <el-button type="primary" @click="conf.selectFolder.confirm"
          >确定</el-button
        >
      </template>
    </custom-dialog>
    <CodeEditor ref="codeEditorRef" />
  </div>
</template>

<style scoped lang="less">
:deep(.el-upload-dragger) {
  height: 100%;
  width: 100%;
  border: none;
  display: block;
  background: transparent;
}
.file-list {
  height: 100%;
  width: 100%;
}
.upload-header{
  margin-bottom: 18px;
}
.file-tool {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block: 18px;
  .left {
    display: flex;
    align-items: center;
  }
  .btns {
    background: rgb(var(--bg-card-color));
    height: 40px;
    width: 382px;
    display: flex;
    align-items: center;
    margin-left: 16px;
    border-radius: 6px;
    .btn {
      height: 40px;
      padding: 10px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      .icon {
        margin-left: 18px;
      }
      &:hover {
        color: rgb(var(--primary-color));
      }
      &::before {
        content: "";
        position: absolute;
        width: 1px;
        height: 20px;
        background: rgb(var(--category-item-bg-color));
        left: 0;
      }
      &:first-child::before {
        display: none;
      }
    }
  }
}
:deep(.el-input__wrapper) {
  height: 36px;
}
.back-level {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 22px;
  padding-inline-end: 22px;
  border-right: 1px solid var(--font-color-gray);
}
.file-name-cell {
  flex-wrap: nowrap;
  width: 100%;
  min-width: 100px;
}
.file-icon {
  flex-shrink: 0; // 防止图标被压缩
}
.file-name {
  display: block;
  width: 100%;
}
.dropdown-more {
  vertical-align: middle;
  margin-left: 12px;
}
.refresh-btn,
.search-btn,
.setting-btn,
.refresh1-btn {
  width: 36px;
  height: 36px;
}
.refresh1-btn {
  margin-left: 18px;
}
.el-button:focus-visible {
  outline: none;
}
:deep(
    .el-breadcrumb__item:last-child .el-breadcrumb__inner,
    .el-breadcrumb__item:last-child .el-breadcrumb__inner a,
    .el-breadcrumb__item:last-child .el-breadcrumb__inner a:hover,
    .el-breadcrumb__item:last-child .el-breadcrumb__inner:hover
  ) {
  color: rgb(var(--primary-color));
}
</style>
