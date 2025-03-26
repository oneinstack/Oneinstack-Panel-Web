<script setup lang="ts">
import { computed, reactive, toRaw, onMounted } from 'vue'
import SearchInput from '@/components/search-input.vue'
import { Refresh } from '@element-plus/icons-vue'
import CardTabs from '@/components/card-tabs.vue'
import CustomTable from '@/components/custom-table.vue'
import { Api } from '@/api/Api'
import type { FormItem } from '@/components/custom-form.vue'
import InstallMask from '@/components/InstallMask.vue'
import { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import sapp from '@/sstore/sapp'
const conf = reactive({
  tabs: {
    activeIndex: 0,
    list: [
      {
        name: 'PHP项目',
        index: 0,
        value: 'php'
      },
      // {
      //   name: 'JAVA项目',
      //   index: 1
      // },
      // {
      //   name: 'Node项目',
      //   index: 2
      // },
      // {
      //   name: 'Go项目',
      //   index: 3
      // },
      // {
      //   name: 'Python项目',
      //   index: 4
      // },
      {
        name: '反向代理',
        index: 5,
        value: 'proxy'
      },
      {
        name: 'HTML项目',
        index: 6,
        value: 'static'
      }
      // {
      //   name: '其他项目',
      //   index: 7
      // }
    ],
    clickActive: (item: any) => {
      conf.tabs.activeIndex = item.index
      conf.website.params.type = item.value
      conf.website.getData()
    }
  },
  website: {
    data: [],
    total: 0,
    selection: [], // 存储选中的行
    columns: [
      { prop: 'name', label: '网站名', width: 200 },
      // { prop: 'domain', label: '其他域名', width: 250 },
      { prop: 'dir', label: '目录', width: 400 },
      {
        prop: 'type', label: '类型', width: 200, formatter: (row: any) => {
          const typeMap = {
            php: 'PHP',
            proxy: '代理',
            static: '静态'
          }
          return typeMap[row.type as keyof typeof typeMap] || row.type
        }
      },
      { prop: 'remark', label: '备注' },
      {
        prop: 'create_time', label: '创建时间', width: 200,
        // 添加格式化方法
        formatter: (row: any) => {
          return row.create_time ? dayjs(row.create_time).format('YYYY-MM-DD HH:mm:ss') : '-'
        }
      },
      { prop: 'action', label: '操作', align: 'center', width: 240, fixed: 'right' },
    ],
    handleSelectionChange: (selection: any[]) => {
      conf.website.selection = selection as never[]
    },
    params: {
      type: 'php',
      page: 1,
      pageSize: 10
    } as any,
    loading: true,
    getData: async () => {
      conf.website.loading = true
      const { data: res } = await Api.getWebsiteList(conf.website.params)
      conf.website.loading = false
      conf.website.total = res.total
      conf.website.data = res.data
    },
    handleAdd: () => {
      conf.drawer.open('add')
      conf.form.data.value.type = conf.website.params.type
    },
    websiteInfo: sapp.websiteInfo, // 添加状态
    getWebsiteInfo: async () => {
      try {
        const { data } = await Api.getWebsiteInfo();
        // 添加数据校验
        if (data === false && !sapp.installDialogHasShown) {
          conf.website.websiteInfo = data;
          sapp.installDialogHasShown = true; // 标记为已显示
          // console.log(installDialog.visible)
        }
        sapp.setWebsiteInfo(data); //将数据存储到pinia
        conf.website.websiteInfo = data;
        console.log("网站依赖状态：已安装", data);
        // return data;
      } catch (error) {
        ElMessage.error("获取网站信息失败");
        return false;
      }
    }
  },
  drawer: {
    show: false,
    title: '创建网站',
    type: 'add',
    loading: false,
    open: (type: 'add' | 'edit', row?: any) => {
      conf.drawer.title = '创建网站'
      conf.drawer.type = type
      if (type === 'edit') {
        conf.drawer.title = '设置网站'
        const cloneRow = structuredClone(toRaw(row))
        const domain = cloneRow.domain?.split(',')
        conf.form.data.value = cloneRow
        conf.form.data.value.hostDomain = domain[0].trim()
        domain.shift()
        conf.form.data.value.otherDomain = domain.join('\n')
      }
      conf.drawer.show = true
    },
    onConfirm: () => {
      conf.form.instance?.validate(async (valid) => {
        if (!valid) return
        // let domain = ''
        // if (conf.form.data.value.domain) {
        //   domain = conf.form.data.value.domain?.split('\n')
        // } else {
        //   domain = ''
        // }


        // conf.form.data.value.domain = domain != ''
        //   ? `${conf.form.data.value.domain.trim()},${domain}`
        //   : conf.form.data.value.domain

        try {
          conf.drawer.loading = true

          const api = conf.drawer.type === 'add' ? Api.addWebsite : Api.updateWebsite
          const { data } = await api(conf.form.data.value)
          console.log('message', data)
          ElMessage({
            type: 'success',
            message: conf.drawer.type === 'add' ? '创建网站成功' : '更新网站成功'
          })
          conf.drawer.show = false
          conf.website.getData()
        } catch (error: any) {
          // ElMessage({
          //   type: 'error',
          //   message: error.message || '操作失败'
          // })
        } finally {
          conf.drawer.loading = false
        }

      })
    },
    onClose: () => {
      conf.form.data.value = {}
      conf.form.instance?.resetFields()
      conf.form.instance?.clearValidate()
      conf.drawer.show = false
    }
  },
  form: {
    instance: null as FormInstance | null,
    data: {
      value: {} as any,
      items: computed<FormItem[]>(() => {
        switch (conf.website.params.type) {
          case 'php':
          case 'static':
            return [
              {
                label: '主域名',
                type: 'input',
                placeholder: '支持域名:端口',
                prop: 'name',
                rules: [
                  { required: true, message: '请输入主域名', trigger: 'blur' },
                  // {
                  //   pattern: /^(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(:\d{1,5})?$/,
                  //   message: '域名格式错误',
                  //   trigger: 'blur'
                  // }
                ],
                change: (value: string) => {  // 使用 change 替代 input
                  if (!value || value.length === 0) {  // 添加长度判断
                    conf.form.data.value.dir = "";
                    return;
                  }
                  const domainWithoutPort = value.split(':')[0];
                  conf.form.data.value.dir = `${domainWithoutPort}`;
                },
              },
              // {
              //   label: '其他域名',
              //   type: 'textarea',
              //   placeholder: '一行一个域名，支持*和IP地址，支持"域名:端口"',
              //   prop: 'domain'1
              // },
              {
                label: '目录',
                type: 'input',
                prop: 'dir',
                rules: [
                  { required: true, message: '请选择根目录', trigger: 'blur' },
                  // { pattern: /^\/(?:[^/]+\/)*[^/]+$/, message: '路径格式错误' }
                ]
              },
              {
                label: '备注',
                type: 'textarea',
                prop: 'remark'
              }
            ]
          case 'proxy':
            conf.form.data.value.pact = 'http'
            conf.form.data.value.tar_url = '$http_host'
            return [
              {
                label: '主域名',
                type: 'input',
                placeholder: '支持域名:端口',
                prop: 'name',
                rules: [
                  { required: true, message: '请输入主域名', trigger: 'blur' },
                  // { pattern: /^([0-9a-zA-Z-]{1,}\.)+([a-zA-Z]{2,})$/, message: '域名格式错误', trigger: 'blur' }
                ]
              },
              // {
              //   label: '其他域名',
              //   type: 'textarea',
              //   placeholder: '一行一个域名，支持*和IP地址，支持"域名:端口"',
              //   prop: 'domain'
              // },
              // {
              //   label: '代理地址',
              //   type: 'custom',
              //   placeholder: '例：127.0.0.1:8080',
              //   prop: 'send_url',
              //   rules: [{ required: true, message: '请输入代理地址', trigger: 'blur' }]
              // },
              {
                label: '备注',
                type: 'textarea',
                prop: 'remark'
              }
            ]
          default:
            return []
        }
      })
    }
  },
  dialog: {
    show: false,
    title: '网站删除确认',
    type: 'delete',
    row: {} as any,
    open: (type: 'delete', row?: any) => {
      conf.dialog.type = type
      conf.dialog.row = row
      switch (type) {
        case 'delete':
          conf.dialog.title = '网站删除确认'
          break
      }
      conf.dialog.show = true
    },
    close: () => {
      conf.dialog.show = false
    },
    confirm: async () => {
      await Api.delWebsite({ id: conf.dialog.row.id })
      conf.website.getData()
      conf.dialog.show = false
    },

  }
})

const handleInstall = () => {
  // installDialog.visible = true
  conf.website.websiteInfo = true
  ElMessage({
    type: 'warning',
    message: '功能开发中...'
  })
}
// const handleInstallConfirm = () => {
//   conf.website.websiteInfo = true
//   ElMessage({
//     type: 'success',
//     message: '安装成功'
//   })
// }
onMounted(() => {
  conf.website.getWebsiteInfo() // 添加这行来初始化获取网站信息
})

conf.website.getData()
</script>

<template>
  <div class="website-container">
    <card-tabs :list="conf.tabs.list" :active-index="conf.tabs.activeIndex" :click-active="conf.tabs.clickActive" />
    <div class="main-content">
      <install-mask :is-installed="conf.website.websiteInfo" @install="handleInstall">
        <div :class="{ 'blur-mask': !conf.website.websiteInfo }">
          <div class="tool-bar">
            <el-space class="btn-group" :size="14">
              <el-button type="primary" @click="conf.website.handleAdd">添加站点</el-button>

              <!-- <el-dropdown>
            <el-button type="primary">
              <span class="el-dropdown-link">
                高级设置
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>修改默认页面</el-dropdown-item>
                <el-dropdown-item>默认站点</el-dropdown-item>
                <el-dropdown-item>PHP命令行版本</el-dropdown-item>
                <el-dropdown-item>HTTPS防窜站</el-dropdown-item>
                <el-dropdown-item>TLS设置</el-dropdown-item>
                <el-dropdown-item>全局设置</el-dropdown-item>
                <el-dropdown-item>关联数据库</el-dropdown-item>
              </el-dropdown-menu>
            </template>
</el-dropdown>
<el-button type="primary">
  <span>漏洞扫描（0）</span>
</el-button>
<el-button type="primary">
  <span style="font-size: 14px; margin-right: 8px">nignx</span>
  <el-icon>
    <CaretBottom />
  </el-icon>
</el-button>
<el-dropdown>
  <el-button type="primary">
    <span class="el-dropdown-link">
      全部分类
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
  </el-button>
  <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>修改默认页面</el-dropdown-item>
                <el-dropdown-item>默认站点</el-dropdown-item>
                <el-dropdown-item>PHP命令行版本</el-dropdown-item>
                <el-dropdown-item>HTTPS防窜站</el-dropdown-item>
                <el-dropdown-item>TLS设置</el-dropdown-item>
                <el-dropdown-item>全局设置</el-dropdown-item>
                <el-dropdown-item>关联数据库</el-dropdown-item>
              </el-dropdown-menu>
            </template>
</el-dropdown> -->

            </el-space>
            <div class="demo-form-inline">
              <el-space class="btn-group" :size="14">
                <search-input v-model="conf.website.params.name" placeholder="请输入域名" style="margin-right: 18px"
                  @search="conf.website.getData()" />
                <el-button :icon="Refresh" type="primary" @click="conf.website.getData()" />
                <!-- <el-button :icon="Setting" type="primary" /> -->
              </el-space>
            </div>
          </div>
          <div class="box2">
            <custom-table v-model:page="conf.website.params.page" :loading="conf.website.loading" empty-text="暂无数据"
              :data="conf.website.data" :columns="conf.website.columns" :auto-pagination="false"
              :total="conf.website.total" :page-size="conf.website.params.pageSize" :selection="true"
              @selection-change="conf.website.handleSelectionChange" @update:page="conf.website.getData">
              <template #action="{ row }">
                <el-button type="primary" link style="margin-right: 8px">统计</el-button>
                <span style="border-right: 1px solid #D9D9D9; height: 12px; margin-right: 8px"></span>
                <el-button type="primary" link style="margin-right: 8px">WAF</el-button>
                <span style="border-right: 1px solid #D9D9D9; height: 12px; margin-right: 8px"></span>
                <el-button type="primary" link style="margin-right: 8px"
                  @click="conf.drawer.open('edit', row)">设置</el-button>
                <span style="border-right: 1px solid #D9D9D9; height: 12px; margin-right: 8px"></span>
                <el-button type="danger" link
                  style="color: #FF4D4F;--el-button-hover-text-color: #D9363E;--el-button-disabled-text-color: #FFCCC7"
                  @click="conf.dialog.open('delete', row)">
                  删除
                </el-button>
              </template>
            </custom-table>
            <!-- 添加提示信息 -->
          </div>
        </div>
      </install-mask>
    </div>

    <!-- <div v-if="!conf.website.websiteInfo" class="mask-tip">
      <img src="./../../../../public/static/images/ins-Plugin.png" alt="" class="tip-image">
      <div class="tip-text">
        未安装运行环境，请点击下方按钮<span class="highlight">安装Nginx</span>否则无法使用改页面
      </div>
      <el-button type="primary" class="install-btn" @click="handleInstall">
        安装Nginx
        <el-icon class="el-icon--right">
          <Download />
        </el-icon>
      </el-button>
    </div> -->

    <!--创建网站弹窗-->
    <custom-drawer :visible="conf.drawer.show" :title="conf.drawer.title" empty-text="暂无数据"
      :loading="conf.drawer.loading" :on-close="conf.drawer.onClose" :on-confirm="conf.drawer.onConfirm">
      <custom-form v-if="conf.drawer.show" :data="conf.form.data" :on-init="(el) => (conf.form.instance = el)">
        <template #send_url="{ row }">
          <el-input v-model="conf.form.data.value.send_url" :placeholder="row.placeholder">
            <template #prepend>
              <el-select v-model="conf.form.data.value.pact" style="width: 80px">
                <el-option label="http" value="http://" />
                <el-option label="https" value="https://" />
              </el-select>
            </template>
          </el-input>
        </template>
      </custom-form>
    </custom-drawer>

    <custom-dialog v-model="conf.dialog.show" :title="conf.dialog.title">
      <template v-if="conf.dialog.type === 'delete'">
        <el-alert title="确定删除所选网站？" type="warning" show-icon :closable="false" />
      </template>
      <template #footer>
        <el-button @click="conf.dialog.close">取消</el-button>
        <el-button type="primary" @click="conf.dialog.confirm">确认</el-button>
      </template>
    </custom-dialog>
    <!--安装插件弹窗-->
    <!-- <install-dialog v-model:visible="installDialog.visible" @confirm="handleInstallConfirm" /> -->
  </div>
</template>

<style scoped lang="less">
:deep(.el-dialog) {
  padding: 0px !important;

  .el-dialog__header {
    padding: 0 !important;
  }
}

.main-content {
  position: relative; // 添加相对定位
}

.blur-mask {
  filter: blur(10px);
  pointer-events: none;
  user-select: none;
}

.mask-tip {
  position: absolute;
  top: 22%;
  left: 6%;
  // transform: translate(-50%, -50%);
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
