<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { ElMessage, FormInstance } from 'element-plus'
import { computed, reactive } from 'vue'
import FileList from './components/file-list.vue'
import sapp from '@/sstore/sapp'
import CustomDrawer from '@/components/custom-drawer.vue'
import { Api } from '@/api/Api'
import CustomForm from '@/components/custom-form.vue'
import TrashList from './components/trash-list.vue'
import i18n from '@/lang'


export type DrawerType = 'file' | 'dir'
export type DrawerOpenType = 'create' | 'editPER' | 'editUser'

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const perms = {
  codes: {
    owner: ['0400', '0200', '0100'],
    group: ['0040', '0020', '0010'],
    public: ['0004', '0002', '0001']
  },
  getArrs: (perms: string[]) => {
    const permCombos = []
    for (let i = 0; i < 8; i++) {
      const combo = []
      if (i & 4) combo.push(perms[0])
      if (i & 2) combo.push(perms[1])
      if (i & 1) combo.push(perms[2])
      permCombos.push(combo)
    }
    return permCombos
  },
  getValue: (perms: string[], index: number, code = '0000') => {
    let codes = code.split('')
    const value = perms.reduce((prev, curr) => {
      return prev + parseInt(curr[index])
    }, 0)
    codes[index] = value.toString()
    return codes.join('')
  }
}
const conf = reactive({
  trashVisible: false,
  theme: {
    light: ['#626262'],
    dark: ['#DBDBDB']
  },
  tab: {
    list: [
      {
        path: ['/'],
        active: true,
        instance: null
      } as any
    ],
    handleAddTab: () => {
      if (conf.tab.list.length >= 10) return ElMessage.warning(t('file.maxTabsWarning', 'Up to 10 folders can be opened'))
      conf.tab.list.push({
        path: ['/'],
        active: true,
        instance: null
      })
    },
    handleCloseTab: (index: number) => {
      if (conf.tab.list.length === 1) return
      conf.tab.list[index - 1].active = true
      conf.tab.list.splice(index, 1)
    },
    refreshAll: () => conf.tab.list.forEach((item) => item.instance?.refresh())
  },
  handleUpdatePath: (path: string[], index: number) => {
    conf.tab.list.forEach((item, i) => (item.active = i === index))
    conf.tab.list[index].path = path
  },
  drawer: {
    visible: false,
    openType: 'create' as DrawerOpenType,
    type: 'file' as DrawerType,
    title: t('file.create', 'Create'),
    open: (openType: DrawerOpenType, type: DrawerType, row?: any) => {
      conf.drawer.openType = openType
      switch (openType) {
        case 'create':
          conf.drawer.title = t('file.create', 'Create')
          break
        case 'editPER':
        case 'editUser':
          conf.form.editPER.value.isDir = row.isDir
          conf.form.editPER.value.perm = row.permissions.padEnd(4, '0')
          conf.form.editPER.value.recursive = row.recursive
          conf.form.editPER.value.owner = perms.getArrs(perms.codes.owner)[row.permissions[1]]
          conf.form.editPER.value.group = perms.getArrs(perms.codes.group)[row.permissions[2]]
          conf.form.editPER.value.public = perms.getArrs(perms.codes.public)[row.permissions[3]]
          conf.form.editPER.value.name = row.name
          conf.form.editUser.value.isDir = row.isDir
          conf.form.editUser.value.user = row.user
          conf.form.editUser.value.group = row.group
          conf.drawer.title = openType === 'editPER' ? t('file.editPermissions', 'Edit permissions') : t('file.changeUserGroup', 'Change user and group')
          break
      }
      conf.drawer.type = type
      conf.drawer.visible = true
    },
    close: () => {
      conf.drawer.visible = false
      conf.form.instance?.resetFields()
      conf.form.instance?.clearValidate()
    },
    confirm: () => {
      conf.form.instance?.validate(async (valid: boolean) => {
        if (!valid) return
        const currentTab = conf.tab.list.find((item) => item.active)
        const currentPath = currentTab?.path.join('/').replace(/\/\//g, '/')
        let api = Api.createFile,
          params
        switch (conf.drawer.openType) {
          case 'create':
            api = Api.createFile
            params = {
              path: `${currentPath === '/' ? '' : currentPath}/${conf.form.create.value.name}`,
              type: conf.drawer.type
            }
            break
          case 'editPER':
          case 'editUser':
            api = Api.updateFilePerm
            params = {
              path: `${currentPath === '/' ? '' : currentPath}/${conf.form.editPER.value.name}`,
              perm: conf.form.editPER.value.perm,
              user: conf.form.editUser.value.user,
              group: conf.form.editUser.value.group,
              recursive: conf.form.editPER.value.recursive || conf.form.editUser.value.recursive
            }
            break
        }
        const { data } = await api(params)
        currentTab?.instance?.refresh()
        ElMessage.success(data)
        conf.drawer.close()
      })
    }
  },
  form: {
    instance: null as FormInstance | null,
    create: {
      value: {
        type: 'file',
        name: ''
      },
      items: computed(() => [
        {
          label: t('common.name', 'Name'),
          type: 'input',
          prop: 'name',
          rules: [{ required: true, message: t('file.nameRequired', 'Enter a name'), trigger: 'blur' }]
        }
      ])
    },
    editPER: {
      value: {
        owner: [],
        group: [],
        public: [],
        perm: '',
        recursive: false
      },
      items: computed(() => [
        {
          label: t('file.owner', 'Owner'),
          type: 'checkbox-group',
          prop: 'owner',
          options: [
            {
              label: t('file.read', 'Read'),
              value: '0400'
            },
            {
              label: t('file.write', 'Write'),
              value: '0200'
            },
            {
              label: t('file.execute', 'Execute'),
              value: '0100'
            }
          ],
          change: (value: string[]) => {
            conf.form.editPER.value.perm = perms.getValue(value, 1, conf.form.editPER.value.perm)
          }
        },
        {
          label: t('file.group', 'Group'),
          type: 'checkbox-group',
          prop: 'group',
          options: [
            {
              label: t('file.read', 'Read'),
              value: '0040'
            },
            {
              label: t('file.write', 'Write'),
              value: '0020'
            },
            {
              label: t('file.execute', 'Execute'),
              value: '0010'
            }
          ],
          change: (value: string[]) => {
            conf.form.editPER.value.perm = perms.getValue(value, 2, conf.form.editPER.value.perm)
          }
        },
        {
          label: t('file.public', 'Public'),
          type: 'checkbox-group',
          prop: 'public',
          options: [
            {
              label: t('file.read', 'Read'),
              value: '0004'
            },
            {
              label: t('file.write', 'Write'),
              value: '0002'
            },
            {
              label: t('file.execute', 'Execute'),
              value: '0001'
            }
          ],
          change: (value: string[]) => {
            conf.form.editPER.value.perm = perms.getValue(value, 3, conf.form.editPER.value.perm)
          }
        },
        {
          label: t('file.permission', 'Permission'),
          type: 'input',
          prop: 'perm',
          rules: [
            { required: true, message: t('file.permissionRequired', 'Enter permissions'), trigger: 'blur' },
            { pattern: /^[0-7]{4}$/, message: t('file.permissionError', 'Invalid permissions'), trigger: 'blur' }
          ],
          change: (value: string) => {
            if (value.length !== 4) return
            conf.form.editPER.value.owner = perms.getArrs(perms.codes.owner)[+value[1]]
            conf.form.editPER.value.group = perms.getArrs(perms.codes.group)[+value[2]]
            conf.form.editPER.value.public = perms.getArrs(perms.codes.public)[+value[3]]
          }
        },
        {
          ifShow: (value: any) => value.isDir,
          label: t('file.recursiveChildren', 'Also update child file attributes'),
          type: 'checkbox',
          prop: 'recursive'
        }
      ])
    },
    editUser: {
      value: {
        user: '',
        group: ''
      },
      items: computed(() => [
        {
          label: t('common.user', 'User'),
          type: 'input',
          prop: 'user',
          rules: [{ required: true, message: t('file.userRequired', 'Enter user'), trigger: 'blur' }]
        },
        {
          label: t('file.group', 'Group'),
          type: 'input',
          prop: 'group',
          rules: [{ required: true, message: t('file.groupRequired', 'Enter group'), trigger: 'blur' }]
        }
      ])
    }
  } as any
})
</script>

<template>
  <div class="file-container">
    <div class="file-workspace">
      <div class="workspace-tabs">
        <div class="workspace-tabs__scroller">
        <div
          v-for="(item, index) in conf.tab.list"
          :key="index"
          class="path-tab"
          :class="{ active: item.active }"
          @click="conf.handleUpdatePath(item.path, index)"
        >
          <v-s-icon
            name="folder"
            size="19"
            :color="conf.theme[sapp.theme]"
            style="transform: rotateY(180deg)"
          />
          <span class="path-tab-text">
            {{ item.path[item.path.length - 1] === '/' ? $t('file.rootDir') : item.path[item.path.length - 1] }}
          </span>
          <el-icon v-if="index > 0" class="hover-opacity" @click.stop="conf.tab.handleCloseTab(index)">
            <Close />
          </el-icon>
        </div>
        </div>
        <button class="add-btn" aria-label="打开新文件标签" @click.stop="conf.tab.handleAddTab">+</button>
      </div>
      <file-list
        v-for="(_, index) in conf.tab.list"
        v-show="conf.tab.list[index].active"
        :ref="(el) => el && (conf.tab.list[index].instance = el)"
        :key="index"
        @update:path="conf.handleUpdatePath($event, index)"
        @open-drawer="conf.drawer.open"
        @open-trash="conf.trashVisible = true"
      />
    </div>
    <custom-drawer
      :visible="conf.drawer.visible"
      :title="conf.drawer.title"
      :on-close="conf.drawer.close"
      :on-confirm="conf.drawer.confirm"
    >
      <custom-form
        v-if="conf.drawer.visible"
        :data="conf.form[conf.drawer.openType]"
        :on-init="(ins) => (conf.form.instance = ins)"
      />
    </custom-drawer>
    <trash-list v-model="conf.trashVisible" @changed="conf.tab.refreshAll" />
  </div>
</template>

<style scoped lang="less">
.file-container {
  min-width: 0;
  padding: 0 2px 24px;
}

.file-workspace {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.05);
}

.workspace-tabs {
  height: 45px;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-subtle);
}

.workspace-tabs__scroller {
  min-width: 0;
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.path-tab {
  min-width: 138px;
  max-width: 220px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  position: relative;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;

  &::after {
    content: '';
    height: 2px;
    position: absolute;
    right: 10px;
    bottom: -1px;
    left: 10px;
    border-radius: 2px 2px 0 0;
    background: transparent;
  }

  &:hover {
    color: var(--text-primary);
    background: rgba(var(--primary-color), 0.035);
  }

  &.active {
    color: var(--text-primary);
    background: var(--surface-card);

    &::after {
      background: rgb(var(--primary-color));
    }
  }
}

.path-tab-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-btn {
  width: 45px;
  flex: 0 0 45px;
  border: 0;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font: inherit;
  font-size: 21px;
  background: transparent;
  cursor: pointer;

  &:hover {
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.06);
  }
}

@media (max-width: 768px) {
  .file-container {
    padding-inline: 0;
  }

  .file-workspace {
    border-radius: 10px;
  }

  .path-tab {
    min-width: 122px;
  }
}
</style>
