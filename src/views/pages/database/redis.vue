<script setup lang="ts">
import { reactive ,ref, onMounted} from 'vue'
import { ConfProps } from './index.vue'
import { Api } from '@/api/Api'
import { WarningFilled } from '@element-plus/icons-vue'
import System from '@/utils/System'
import sapp from '@/sstore/sapp'
import { ElMessage } from 'element-plus' // 添加这行导入
import InstallMask from '@/components/InstallMask.vue'
const { conf: parentConf } = defineProps<ConfProps>()

const conf = reactive({
  ...parentConf,
  server: {
    options: [] as { label: string; value: number }[],
    getOptions: async () => {
      const { data } = await Api.getConnlist(conf.list.params)
      conf.server.options = data.map((item: any) => ({
        label: item.remark ? `${item.remark}(${item.addr})` : item.addr,
        value: item.id
      }))
    },
    onChange: (value: number) => {
      conf.list.params.id = value
      conf.dbList.params.id = value
      conf.dbList.getData()
      handleTabClick({ paneName: conf.dbList.data[0] })
    }
  },
  dbList: {
    params: {
      page: 1,
      pageSize: 999,
      id: 0,
      type: 'redis'
    },
    data: [] as any[],
    getData: async () => {
      const { data: res } = await Api.getDatabaseList(conf.list.params)
      conf.dbList.data = res.data
    }
  }
})

conf.list.loading = false
!conf.server.options.length && conf.server.getOptions()

const handleTabClick = ({ paneName }: { paneName: string | number | undefined }) => {
  conf.list.params.r_db = paneName
  conf.list.getData()
}

const redistatus = ref(sapp.mysqlInfo?.redis ?? false) // 判断redis依赖是否安装
const getWebsiteInfo = async () => {
  try {
    const { data } = await Api.getMysqlInfo();
    // 添加数据校验
    console.log("数据库依赖状态：已安装", data);
    redistatus.value = data.redis
    sapp.setmysqlInfo(data); //将数据存储到pinia
    // return data;
  } catch (error) {
    ElMessage.error("获取网站信息失败");
    return false;
  }
}
const handleInstall = () => {
  redistatus.value = true
  ElMessage({
    type: 'warning',
    message: '功能开发中...'
  })
}
onMounted(() => {
  getWebsiteInfo()
})
</script>

<template>
  <div class="content flex-col">
    <install-mask :is-installed="redistatus" installText="安装Redis"  @install="handleInstall">
      
    <div class="tool-bar">
      <el-space class="btn-group">
        <!-- <el-button type="primary" @click="conf.drawer.open('add')">添加key</el-button> -->
        <el-button type="primary" @click="System.router.push('/database/remote')">{{ $t('database.remoteServer') }}</el-button>
        <!-- <el-button type="primary">备份列表</el-button>
        <el-button type="primary">清空数据库</el-button> -->
      </el-space>
      <div class="demo-form-inline flex" style="gap: 16px">
        <span class="flex items-center" style="color: var(--el-color-primary); gap: 8px">
          <el-icon :size="18"><WarningFilled /></el-icon>
          {{ $t('database.relevance') }}
        </span>
        <el-select
          v-model="conf.list.params.id"
          placeholder="请选择一个服务器"
          style="width: 200px"
          :no-data-text="$t('commons.noData')"
          @change="conf.server.onChange"
        >
          <el-option v-for="item in conf.server.options" v-bind="item" />
        </el-select>
      </div>
    </div>
    <div class="box2 flex-col" style="flex:1">
      <el-tabs v-if="conf.dbList.data.length" v-model="conf.list.params.r_db" @tab-click="handleTabClick">
        <el-tab-pane v-for="item in conf.dbList.data" :key="item.index" :label="`DB${item.name}`" :name="item.name" />
      </el-tabs>
      <custom-table
        v-model:page="conf.list.params.page"
        :loading="conf.list.loading"
        :data="conf.list.data"
        :auto-pagination="false"
        :total="conf.list.total"
        :page-size="conf.list.params.pageSize"
        :columns="conf.list.columns"
        @update:page="conf.list.getData"
      >
        <template #empty>
          <div class="no-data">
            <img src="/static/images/empty.webp" alt="" />
            <span>{{ $t('commons.noData') }}</span>
          </div>
        </template>
      </custom-table>
    </div>
  </install-mask>
  </div>
</template>

<style scoped lang="less">
.content{
  flex: 1;
}
.no-data {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  color: var(--font-color-gray-light);
}
</style>
