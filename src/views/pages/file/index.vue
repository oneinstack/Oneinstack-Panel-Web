<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";
import { ElMessage, FormInstance } from "element-plus";
import { reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import FileList from "./components/file-list.vue";
import sapp from "@/sstore/sapp";
import CustomDrawer from "@/components/custom-drawer.vue";
import { Api } from "@/api/Api";
import CustomForm from "@/components/custom-form.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
export type DrawerType = "file" | "dir";
export type DrawerOpenType = "create" | "editPER" | "editUser";

const perms = {
  codes: {
    owner: ["0400", "0200", "0100"],
    group: ["0040", "0020", "0010"],
    public: ["0004", "0002", "0001"],
  },
  getArrs: (perms: string[]) => {
    const permCombos = [];
    for (let i = 0; i < 8; i++) {
      const combo = [];
      if (i & 4) combo.push(perms[0]);
      if (i & 2) combo.push(perms[1]);
      if (i & 1) combo.push(perms[2]);
      permCombos.push(combo);
    }
    return permCombos;
  },
  getValue: (perms: string[], index: number, code = "0000") => {
    let codes = code.split("");
    const value = perms.reduce((prev, curr) => {
      return prev + parseInt(curr[index]);
    }, 0);
    codes[index] = value.toString();
    return codes.join("");
  },
};
const conf = reactive({
  theme: {
    light: ["#626262"],
    dark: ["#DBDBDB"],
  },
  tab: {
    list: [
      {
        path: ["/"],
        active: true,
        instance: null,
      } as any,
    ],
    handleAddTab: () => {
      if (conf.tab.list.length >= 10)
        return ElMessage.warning("最多只能打开10个文件夹");
      conf.tab.list.push({
        path: ["/"],
        active: true,
        instance: null,
      });
    },
    handleCloseTab: (index: number) => {
      if (conf.tab.list.length === 1) return;
      conf.tab.list[index - 1].active = true;
      conf.tab.list.splice(index, 1);
    },
  },
  handleUpdatePath: (path: string[], index: number) => {
    conf.tab.list.forEach((item, i) => (item.active = i === index));
    conf.tab.list[index].path = path;
  },
  drawer: {
    visible: false,
    openType: "create" as DrawerOpenType,
    type: "file" as DrawerType,
    title: t("commons.button.create"),
    open: (openType: DrawerOpenType, type: DrawerType, row?: any) => {
      conf.drawer.openType = openType;
      switch (openType) {
        case "create":
          conf.drawer.title = t("commons.button.create");
          break;
        case "editPER":
        case "editUser":
          conf.form.editPER.value.isDir = row.isDir;
          conf.form.editPER.value.perm = row.permissions.padEnd(4, "0");
          conf.form.editPER.value.recursive = row.recursive;
          conf.form.editPER.value.owner = perms.getArrs(perms.codes.owner)[
            row.permissions[1]
          ];
          conf.form.editPER.value.group = perms.getArrs(perms.codes.group)[
            row.permissions[2]
          ];
          conf.form.editPER.value.public = perms.getArrs(perms.codes.public)[
            row.permissions[3]
          ];
          conf.form.editPER.value.name = row.name;
          conf.form.editUser.value.isDir = row.isDir;
          conf.form.editUser.value.user = row.user;
          conf.form.editUser.value.group = row.group;
          conf.drawer.title =
            openType === "editPER" ? t('file.editPermissions') : t('file.changeOwner');
          break;
      }
      conf.drawer.type = type;
      conf.drawer.visible = true;
    },
    close: () => {
      conf.drawer.visible = false;
      conf.form.instance?.resetFields();
      conf.form.instance?.clearValidate();
    },
    confirm: () => {
      conf.form.instance?.validate(async (valid: boolean) => {
        if (!valid) return;
        const currentTab = conf.tab.list.find((item) => item.active);
        const currentPath = currentTab?.path.join("/").replace(/\/\//g, "/");
        let api = Api.createFile,
          params;
        switch (conf.drawer.openType) {
          case "create":
            api = Api.createFile;
            params = {
              path: `${currentPath === "/" ? "" : currentPath}/${conf.form.create.value.name}`,
              type: conf.drawer.type,
            };
            break;
          case "editPER":
          case "editUser":
            api = Api.updateFilePerm;
            params = {
              path: `${currentPath === "/" ? "" : currentPath}/${conf.form.editPER.value.name}`,
              perm: conf.form.editPER.value.perm,
              user: conf.form.editUser.value.user,
              group: conf.form.editUser.value.group,
              recursive:
                conf.form.editPER.value.recursive ||
                conf.form.editUser.value.recursive,
            };
            break;
        }
        const { data } = await api(params);
        currentTab?.instance?.refresh();
        ElMessage.success(data);
        conf.drawer.close();
      });
    },
  },
  form: {
    instance: null as FormInstance | null,
    create: {
      value: {
        type: "file",
        name: "",
      },
      items: [
        {
          label: t("file.name"),
          type: "input",
          prop: "name",
          rules: [
            {
              required: true,
              message: t("commons.rule.name"),
              trigger: "blur",
            },
          ],
        },
      ],
    },
    editPER: {
      value: {
        owner: [],
        group: [],
        public: [],
        perm: "",
        recursive: false,
      },
      items: [
        {
          label: t("file.owner"),
          type: "checkbox-group",
          prop: "owner",
          options: [
            {
              label: t('file.rRole'),
              value: "0400",
            },
            {
              label: t("file.wRole"),
              value: "0200",
            },
            {
              label: t('file.xRole'),
              value: "0100",
            },
          ],
          change: (value: string[]) => {
            conf.form.editPER.value.perm = perms.getValue(
              value,
              1,
              conf.form.editPER.value.perm
            );
          },
        },
        {
          label: t("file.userGroup"),
          type: "checkbox-group",
          prop: "group",
          options: [
            {
              label: t('file.rRole'),
              value: "0040",
            },
            {
              label: t("file.wRole"),
              value: "0020",
            },
            {
              label: t('file.xRole'),
              value: "0010",
            },
          ],
          change: (value: string[]) => {
            conf.form.editPER.value.perm = perms.getValue(
              value,
              2,
              conf.form.editPER.value.perm
            );
          },
        },
        {
          label: t("file.public"),
          type: "checkbox-group",
          prop: "public",
          options: [
            {
              label: t('file.rRole'),
              value: "0004",
            },
            {
              label: t("file.wRole"),
              value: "0002",
            },
            {
              label: t("file.xRole"),
              value: "0001",
            },
          ],
          change: (value: string[]) => {
            conf.form.editPER.value.perm = perms.getValue(
              value,
              3,
              conf.form.editPER.value.perm
            );
          },
        },
        {
          label: t("file.role"),
          type: "input",
          prop: "perm",
          rules: [
            { required: true, message: t('commons.rule.role'), trigger: "blur" },
            { pattern: /^[0-7]{4}$/, message: t('commons.rule.role'), trigger: "blur" },
          ],
          change: (value: string) => {
            if (value.length !== 4) return;
            conf.form.editPER.value.owner = perms.getArrs(perms.codes.owner)[
              +value[1]
            ];
            conf.form.editPER.value.group = perms.getArrs(perms.codes.group)[
              +value[2]
            ];
            conf.form.editPER.value.public = perms.getArrs(perms.codes.public)[
              +value[3]
            ];
          },
        },
        {
          ifShow: (value: any) => value.isDir,
          label: "",
          options: t('file.containSub'),
          type: "checkbox",
          prop: "recursive",
        },
      ],
    },
    editUser: {
      value: {
        user: "",
        group: "",
      },
      items: [
        {
          label:t('file.user'),
          type: "input",
          prop: "user",
          rules: [{ required: true, message: t('commons.rule.user'), trigger: "blur" }],
        },
        {
          label: t('file.userGroup'),
          type: "input",
          prop: "group",
          rules: [{ required: true, message: t('commons.rule.userGroup'), trigger: "blur" }],
        },
      ],
    },
  } as any,
});
</script>

<template>
  <div class="file-container relative">
    <div class="absolute fit-width fit-height">
      <!-- <div class="box1">
        <div
          v-for="(item, index) in conf.tab.list"
          :key="index"
          class="path-tab"
          :class="{ active: item.active }"
          @click="conf.handleUpdatePath(item.path, index)"
        >
          <v-s-icon
            name="folder"
            size="24"
            :color="conf.theme[sapp.theme]"
            style="transform: rotateY(180deg); margin-right: 14px"
          />
          <span class="path-tab-text">
            {{ item.path[item.path.length - 1] === '/' ? '根目录' : item.path[item.path.length - 1] }}
          </span>
          <el-icon v-if="index > 0" class="hover-opacity" @click.stop="conf.tab.handleCloseTab(index)">
            <Close />
          </el-icon>
        </div>
        <div class="add-btn hover-opacity" @click.stop="conf.tab.handleAddTab">+</div>
      </div> -->
      <file-list
        v-for="(_, index) in conf.tab.list"
        v-show="conf.tab.list[index].active"
        :ref="(el) => el && (conf.tab.list[index].instance = el)"
        :key="index"
        @update:path="conf.handleUpdatePath($event, index)"
        @open-drawer="conf.drawer.open"
      />
    </div>
    <custom-drawer
      :visible="conf.drawer.visible"
      :title="conf.drawer.title"
      :on-close="conf.drawer.close"
      :on-confirm="conf.drawer.confirm"
      :cancel-text="$t('commons.button.cancel')"
      :confirm-text="$t('commons.button.confirm')"
    >
      <custom-form
        v-if="conf.drawer.visible"
        :data="conf.form[conf.drawer.openType]"
        :on-init="(ins) => (conf.form.instance = ins)"
        label-width="100px"
      />
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.file-container {
  height: 100%;
  .box1 {
    border-radius: 4px;
    margin-top: 0;
    justify-content: flex-start;

    .path-tab {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 22px;
      padding-inline-end: 12px;
      border-right: 1px solid rgb(var(--border-color-gray));
      color: var(--font-color-gray);
      cursor: pointer;

      &.active,
      &:hover {
        .path-tab-text {
          color: var(--font-color-black);
        }
      }

      .path-tab-text {
        margin-right: 10px;
      }
    }

    .add-btn {
      font-size: 24px;
      color: var(--font-color-gray);
    }
  }
}
</style>
