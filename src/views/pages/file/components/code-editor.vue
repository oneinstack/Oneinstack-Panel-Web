<template>
  <el-dialog
    v-model="open"
    :show-close="false"
    :before-close="handleClose"
    destroy-on-close
    width="80%"
    @opened="onOpen"
    center
    :fullscreen="isFullscreen"
  >
    <template #header>
      <div ref="dialogHeader" class="dialog-header">
        <div class="dialog-title">
          <span>{{ $t("commons.button.edit") + " - " + form.path }}</span>
        </div>
        <el-space alignment="center" :size="1" class="dialog-header-icon">
          <el-tooltip :content="loadTooltip()" placement="top">
            <el-button
              @click="toggleFullscreen"
              circle
              :icon="FullScreen"
              style="margin-right: 10px"
            ></el-button>
          </el-tooltip>
          <el-button @click="handleClose" circle :icon="Close"></el-button>
        </el-space>
      </div>
    </template>
    <div ref="dialogForm">
      <el-form
        :inline="true"
        :model="config"
        class="form-config"
        label-position="right"
      >
        <el-form-item :label="$t('file.theme')">
          <el-select
            v-model="config.theme"
            @change="changeTheme()"
            class="select-theme"
          >
            <el-option
              v-for="item in themes"
              :key="item.label"
              :value="item.value"
              :label="item.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('file.eol')">
          <el-select
            v-model="config.eol"
            @change="changeEOL()"
            class="select-eol"
          >
            <el-option
              v-for="eol in eols"
              :key="eol.label"
              :value="eol.value"
              :label="eol.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('file.wordWrap')">
          <el-switch
            v-model="config.wordWrap"
            @change="changeWarp()"
            inline-prompt
            :active-value="'on'"
            :inactive-value="'off'"
            :active-text="$t('commons.button.enable')"
            :inactive-text="$t('commons.button.disable')"
          />
        </el-form-item>
        <el-form-item :label="$t('file.minimap')">
          <el-switch
            v-model="config.minimap"
            @change="changeMinimap()"
            inline-prompt
            :active-text="$t('commons.button.enable')"
            :inactive-text="$t('commons.button.disable')"
          />
        </el-form-item>
        <el-form-item :label="''">
          <el-checkbox v-model="req.dirOnly">是否只显示目录</el-checkbox>
        </el-form-item>
        <el-form-item :label="''">
          <el-checkbox v-model="req.containSub">是否包含子目录</el-checkbox>
        </el-form-item>
        <el-form-item :label="'每个文件夹最大数量'">
          <el-select v-model="req.maxPerFolder" class="select-minimap">
            <el-option :label="'100'" :value="100"></el-option>
            <el-option :label="'500'" :value="500"></el-option>
            <el-option :label="'1000'" :value="1000"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div v-loading="loading">
      <div class="content-wrapper">
        <div class="file-tree-container" v-if="isShow">
          <div class="tree-header-container">
            <el-tooltip :content="$t('file.top')" placement="top">
              <el-text size="small" @click="getUpData()" class="cursor-pointer">
                <el-icon><Top /></el-icon>
                <span class="tree-btn-text">{{ $t("file.up") }}</span>
              </el-text>
            </el-tooltip>
            <el-tooltip :content="$t('file.refresh')" placement="top">
              <el-text
                size="small"
                @click="getRefresh(directoryPath)"
                class="cursor-pointer"
              >
                <el-icon>
                  <Refresh />
                </el-icon>
                <span class="sm:inline hidden pl-1">{{
                  $t("file.refresh")
                }}</span>
              </el-text>
            </el-tooltip>
          </div>
          <el-divider class="divider-mini" />
          <el-tree-v2
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            class="monaco-editor-tree monaco-editor-background"
            @node-expand="handleNodeExpand"
            :height="treeHeight"
            :indent="6"
            :item-size="24"
            highlight-current
          >
            <template #default="{ node, data }">
              <span
                v-if="data.isDir"
                style="display: inline-flex; align-items: center"
              >
                <v-s-icon class="file-icon" :name="'folder'" size="22" />
                <small :title="node.label">{{ node.label }}</small>
              </span>
              <span
                v-else
                style="display: inline-flex; align-items: center"
                @click="getContent(data.path, data.extension)"
              >
                <v-s-icon class="file-icon" :name="'txt'" size="22" />
                <small :title="node.label" class="min-w-32">{{
                  node.label
                }}</small>
              </span>
            </template>
          </el-tree-v2>
        </div>
        <div class="divider-container">
          <el-divider
            v-if="isShow"
            direction="vertical"
            :style="{ height: codeHeight }"
            class="divider-reset"
            :class="isShow ? 'visible' : 'invisible'"
          ></el-divider>
          <el-icon
            v-if="isShow"
            class="toggle-btn toggle-btn-left"
            size="9"
            @click="toggleShow"
          >
            <DArrowLeft />
          </el-icon>
          <el-icon
            v-else
            class="toggle-btn toggle-btn-right"
            size="9"
            @click="toggleShow"
          >
            <DArrowRight />
          </el-icon>
        </div>
        <div
          ref="codeBox"
          id="codeBox"
          :style="{ height: codeHeight }"
          class="code-editor-container"
        ></div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer" ref="dialogFooter">
        <el-button @click="handleReset">{{
          $t("commons.button.reset")
        }}</el-button>
        <el-button type="primary" @click="saveContent()">{{
          $t("commons.button.confirm")
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { Api } from "@/api/Api";
import i18n from "@/lang";
import * as monaco from "monaco-editor";
import {
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  onMounted,
  computed,
} from "vue";
// import { Languages } from '@/global/mimetype';
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { ElMessageBox, ElTreeV2, ElMessage } from "element-plus";
import {
  TreeKey,
  TreeNodeData,
} from "element-plus/es/components/tree-v2/src/types";
import {
  Top,
  Refresh,
  DArrowLeft,
  DArrowRight,
  Close,
  FullScreen,
} from "@element-plus/icons-vue";
import sapp from "@/sstore/sapp";
import { fileType } from "@/utils/index";
let editor: monaco.editor.IStandaloneCodeEditor | any;

self.MonacoEnvironment = {
  getWorker(workerId, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (["typescript", "javascript"].includes(label)) {
      return new tsWorker();
    }
    return new EditorWorker();
  },
};

interface EditorConfig {
  theme: string;
  language: string;
  eol: number;
  wordWrap: WordWrapOptions;
  minimap: boolean;
}

interface TreeNode {
  key: TreeKey;
  level: number;
  parent?: TreeNode;
  children?: any[];
  data: TreeNodeData;
  disabled?: boolean;
  name?: string;
  isLeaf?: boolean;
}

const open = ref(false);
const loading = ref(false);
const fileName = ref("");
const codeThemeKey = "code-theme";
const warpKey = "code-warp";
const minimapKey = "code-minimap";
const directoryPath = ref("");
const fileExtension = ref("");
const baseDir = ref();
const treeData = ref([]);
const codeBox = ref();
const defaultHeight = ref(55);
const treeHeight = ref(0);
const codeHeight = ref("55vh");
const codeReq = reactive({ path: "", expand: false, page: 1, pageSize: 100 });
const isShow = ref(true);
const isEdit = ref(false);
const oldFileContent = ref("");
const dialogHeader = ref();
const dialogForm = ref();
const dialogFooter = ref();

const toggleShow = () => {
  isShow.value = !isShow.value;
};

type WordWrapOptions = "off" | "on" | "wordWrapColumn" | "bounded";

const isFullscreen = ref(false);

const config = reactive<EditorConfig>({
  theme: sapp.theme == "light" ? "vs" : "vs-dark",
  language: "plaintext",
  eol: monaco.editor.EndOfLineSequence.LF,
  wordWrap: "on",
  minimap: false,
});

const eols = [
  {
    label: "LF (Linux)",
    value: monaco.editor.EndOfLineSequence.LF,
  },
  {
    label: "CRLF (Windows)",
    value: monaco.editor.EndOfLineSequence.CRLF,
  },
];

const themes = [
  {
    label: "Visual Studio",
    value: "vs",
  },
  {
    label: "Visual Studio Dark",
    value: "vs-dark",
  },
  {
    label: "High Contrast Dark",
    value: "hc-black",
  },
];

let form = ref({
  content: "",
  path: "",
});

const em = defineEmits(["close"]);

const handleClose = () => {
  const closeEditor = () => {
    open.value = false;
    if (editor) {
      editor.dispose();
    }
    em("close", open.value);
  };

  if (isEdit.value) {
    ElMessageBox.confirm(i18n.global.t("file.saveContentAndClose"), {
      confirmButtonText: i18n.global.t("commons.button.save"),
      cancelButtonText: i18n.global.t("commons.button.notSave"),
      type: "info",
      distinguishCancelAndClose: true,
    })
      .then(() => {
        saveContent();
      })
      .finally(() => {
        closeEditor();
      });
  } else {
    closeEditor();
  }
};

const handleReset = () => {
  if (isEdit.value) {
    loading.value = true;
    form.value.content = oldFileContent.value;
    editor.setValue(oldFileContent.value);
    isEdit.value = false;
    ElMessage.success(i18n.global.t("commons.msg.resetSuccess"));
    loading.value = false;
  } else {
    ElMessage.info(i18n.global.t("file.noEdit"));
  }
};

const loadTooltip = () => {
  return i18n.global.t(
    "commons.button." + (isFullscreen.value ? "quitFullscreen" : "fullscreen")
  );
};

onMounted(() => {
  updateHeights();
  window.addEventListener("resize", updateHeights);
});

const updateHeights = () => {
  const vh = window.innerHeight / 100;
  if (isFullscreen.value) {
    let paddingHeight = 75;
    const headerHeight = dialogHeader.value.offsetHeight;
    const formHeight = dialogForm.value.offsetHeight;
    const footerHeight = dialogFooter.value.offsetHeight;
    treeHeight.value =
      window.innerHeight -
      headerHeight -
      formHeight -
      footerHeight -
      paddingHeight -
      31;
    codeHeight.value = `${
      ((window.innerHeight -
        headerHeight -
        formHeight -
        footerHeight -
        paddingHeight) /
        window.innerHeight) *
      100
    }vh`;
  } else {
    treeHeight.value = defaultHeight.value * vh - 31;
    codeHeight.value = `${defaultHeight.value}vh`;
  }
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  updateHeights();
};

const changeLanguage = () => {
  monaco.editor.setModelLanguage(editor.getModel(), config.language);
};

const changeTheme = () => {
  console.log(config.theme);
  monaco.editor.setTheme(config.theme);
  const themes = {
    vs: "monaco-editor-tree-light",
    "vs-dark": "monaco-editor-tree-dark",
    "hc-black": "monaco-editor-tree-dark",
  };
  if (treeRef.value) {
    Object.values(themes).forEach((themeClass) => {
      treeRef.value.$el.classList.remove(themeClass);
    });
    if (themes[config.theme as keyof typeof themes]) {
      treeRef.value.$el.classList.add(
        themes[config.theme as keyof typeof themes]
      );
    }
  }

  // 等待 Monaco Editor 主题更新完成
  nextTick(() => {
    const monacoElement = document.querySelector(".monaco-editor");
    if (monacoElement) {
      const backgroundColor =
        window.getComputedStyle(monacoElement).backgroundColor;
      document.documentElement.style.setProperty(
        "--vscode-editor-background",
        backgroundColor
      );
    }
  });

  // localStorage.setItem(codeThemeKey, config.theme);
};

const changeEOL = () => {
  editor.getModel().pushEOL(config.eol);
};

const changeWarp = () => {
  localStorage.setItem(warpKey, config.wordWrap);
  editor.updateOptions({
    wordWrap: config.wordWrap,
  });
};

const changeMinimap = () => {
  localStorage.setItem(minimapKey, JSON.stringify(config.minimap));
  editor.updateOptions({
    minimap: {
      enabled: config.minimap,
    },
  });
};

const initEditor = () => {
  if (editor) {
    editor.dispose();
  }
  nextTick(() => {
    editor = monaco.editor.create(codeBox.value as HTMLElement, {
      theme: config.theme,
      value: form.value.content,
      readOnly: false,
      automaticLayout: true,
      language: config.language,
      folding: true,
      roundedSelection: false,
      overviewRulerBorder: false,
      wordWrap: config.wordWrap,
      minimap: {
        enabled: config.minimap,
      },
    });
    if (editor.getModel().getValue() === "") {
      let defaultContent = "\n\n\n\n";
      editor.getModel().setValue(defaultContent);
    }

    editor.getModel().pushEOL(config.eol);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, quickSave);

    editor.onDidChangeModelContent(() => {
      if (editor) {
        form.value.content = editor.getValue();
        isEdit.value = true;
      }
    });
  });
};

const quickSave = () => {
  saveContent();
};

const saveContent = () => {
  if (isEdit.value) {
    loading.value = true;
    Api.saveFile(form.value)
      .then(() => {
        loading.value = false;
        isEdit.value = false;
        oldFileContent.value = form.value.content;
        ElMessage.success(i18n.global.t("commons.msg.updateSuccess"));
      })
      .catch(() => {
        loading.value = false;
      });
  } else {
    ElMessage.info(i18n.global.t("file.noEdit"));
  }
};

const acceptParams = (props: any) => {
  form.value.content = props.content;
  oldFileContent.value = props.content;
  form.value.path = props.path;
  directoryPath.value = getDirectoryPath(props.path);
  fileExtension.value = props.extension;
  fileName.value = props.name;
  config.eol = monaco.editor.EndOfLineSequence.LF;
  config.theme = localStorage.getItem(codeThemeKey) || "vs-dark";
  config.wordWrap = (localStorage.getItem(warpKey) as WordWrapOptions) || "on";
  config.minimap =
    localStorage.getItem(minimapKey) !== null
      ? localStorage.getItem(minimapKey) === "true"
      : true;
  open.value = true;
};

const getDirectoryPath = (filePath: string) => {
  if (!filePath) {
    return baseDir.value;
  }

  const lastSlashIndex = filePath.lastIndexOf("/");

  if (lastSlashIndex === -1) {
    return baseDir.value;
  }

  const directoryPath = filePath.substring(0, lastSlashIndex);
  if (directoryPath === "" || directoryPath === "." || directoryPath === "/") {
    return baseDir.value;
  }
  return directoryPath;
};

const onOpen = () => {
  initEditor();
  changeTheme();
  search(directoryPath.value).then((res) => {
    handleSearchResult(res);
  });
};

const handleSearchResult = (res: any) => {
  if (res.data[0].children.length > 0 && res.data[0].children) {
    treeData.value = res.data[0].children.map((item: any) => ({
      ...item,
      children: item.isDir ? item.children || [] : undefined,
    }));
  } else {
    treeData.value = [];
  }
};

const getRefresh = (path: string) => {
  loading.value = true;
  try {
    search(path).then((res) => {
      treeData.value = res.data[0].children;
      loadedNodes.value = new Set();
    });
  } finally {
    loading.value = false;
    ElMessage.success(i18n.global.t("commons.msg.refreshSuccess"));
  }
};

const getContent = (path: string, extension: string) => {
  if (form.value.path === path) {
    return;
  }

  const fetchFileContent = () => {
    codeReq.path = path;
    codeReq.expand = true;

    Api.fileContent(codeReq)
      .then((res) => {
        form.value.content = res.data.content;
        oldFileContent.value = res.data.content;
        form.value.path = res.data.path;
        fileExtension.value = res.data.extension;
        fileName.value = res.data.name;
        initEditor();
      })
      .catch(() => {});
  };

  if (isEdit.value) {
    ElMessageBox.confirm(i18n.global.t("file.saveAndOpenNewFile"), {
      confirmButtonText: i18n.global.t("commons.button.open"),
      cancelButtonText: i18n.global.t("commons.button.cancel"),
      type: "info",
    })
      .then(() => {
        saveContent();
        fetchFileContent();
      })
      .finally(() => {});
  } else {
    fetchFileContent();
  }
};

const initTreeData = () => ({
  path: "/",
  showHidden: true,
  dirOnly: false, //是否只显示目录
  containSub: false, //是否包含子目录
  maxDepth: 2, //最大深度
  maxPerFolder: 500, //每个文件夹的最大数量
});

let req = reactive(initTreeData());

const loadedNodes = ref(new Set());

const search = async (path: string) => {
  req.path = path || "/";
  return await Api.fileTree(req);
};

const getUpData = async () => {
  if ("/" === directoryPath.value) {
    ElMessage.info(i18n.global.t("commons.msg.rootInfoErr"));
    return;
  }
  let pathParts = directoryPath.value.split("/");
  pathParts.pop();
  let newPath = pathParts.join("/") || "/";

  try {
    const res = await search(newPath);
    treeData.value = res.data[0]?.children || [];
    loadedNodes.value = new Set();
  } catch (error) {
    ElMessage.error(i18n.global.t("commons.msg.notRecords"));
  } finally {
    directoryPath.value = newPath;
  }
};

const treeRef = ref();

const treeProps = {
  value: "id",
  label: "name",
  children: "children",
};
const handleFileDownload = async (data: any) => {
  await Api.downloadFile({
    path: data.path,
    filename: data.name,
  });
  ElMessage.success("下载成功！");
};
const handleNodeExpand = async (node: any, data: TreeNode) => {
  const extension = data.data.extension?.toLowerCase();
  if (!data.data.isDir && extension && fileType.image.includes(extension)) {
    return handleFileDownload(data.data);
  }
  if (!data.data.isDir || loadedNodes.value.has(data.data.path)) {
    return;
  }
  try {
    const res = await search(node.path);
    const newTreeData = JSON.parse(JSON.stringify(treeData.value));
    if (res.data[0].children.length > 0 && res.data[0].children) {
      data.children = res.data[0].children;
      loadedNodes.value.add(data.data.path);
      updateNodeChildren(newTreeData, data.data.path, res.data[0].children);
    } else {
      data.children = [];
    }
    treeData.value = newTreeData;
  } catch (error) {
    ElMessage.error(i18n.global.t("commons.msg.notRecords"));
  }
};

// 更新指定节点的 children 数据
const updateNodeChildren = (nodes: any[], path: any, newChildren: []) => {
  const updateNode = (nodes: string | any[]) => {
    for (const element of nodes) {
      if (element.path === path) {
        element.children = newChildren;
        break;
      }
      if (element.children && element.children.length) {
        updateNode(element.children);
      }
    }
  };
  updateNode(nodes);
};
onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
  window.removeEventListener("resize", updateHeights);
});

defineExpose({ acceptParams });
</script>

<style scoped lang="less">
:deep(.el-dialog) {
  background: rgb(var(--card-bg-color)) !important;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 0.5rem;
}
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.tree-container {
  width: 33.333333%;
  @media (min-width: 640px) {
    width: 12rem;
  }
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  @media (min-width: 640px) {
    padding-right: 1rem;
  }
  padding-top: 0.25rem;
}

.tree-btn {
  cursor: pointer;
}

.tree-btn-text {
  padding-left: 0.25rem;
  @media (max-width: 640px) {
    display: none;
  }
  @media (min-width: 640px) {
    display: inline;
  }
}
.dialog-top {
  top: 0;
}

.dialog-header-icon {
  color: var(--el-color-info);
}

.monaco-editor-tree {
  color: rgb(var(--primary-color)) !important;
}

.tree-widget {
  background-color: var(--el-button--primary);
}

.form-config {
  margin-top: 0.375rem;
}

.content-wrapper {
  display: flex;
}

.file-tree-container {
  width: 33.333333%;
  @media (min-width: 640px) {
    width: 12rem;
  }
  background-color: var(--vscode-editor-background);
  border: 0;
}

.tree-header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.25rem 0 0.25rem;
  @media (min-width: 640px) {
    padding-right: 1rem;
  }
}

.tree-btn-text {
  padding-left: 0.25rem;
  @media (max-width: 640px) {
    display: none;
  }
  @media (min-width: 640px) {
    display: inline;
  }
}

.divider-mini {
  margin: 0.25rem 0;
}

.divider-container {
  position: relative;
}

.divider-reset {
  margin: 0;
  padding: 0;
}

.visible {
  opacity: 1;
}

.invisible {
  opacity: 0;
}

.toggle-btn {
  cursor: pointer;
  position: absolute;
  background-color: #f3f4f6;
  padding: 0.5rem 0;
  display: block;
  top: 33.333333%;
}

.toggle-btn-left {
  border-top-left-radius: 0.125rem;
  border-bottom-left-radius: 0.125rem;
  left: -9px;
}

.toggle-btn-right {
  border-top-right-radius: 0.125rem;
  border-bottom-right-radius: 0.125rem;
  right: 7px;
}

.code-editor-container {
  flex: 1;
  position: relative;
  @media (min-width: 640px) {
    width: 80%;
  }
  width: 66.666667%;
}
.select-theme {
  width: 200px;
}

.select-eol {
  width: 150px;
}

.select-wrap,
.select-minimap {
  width: 100px;
}
</style>
