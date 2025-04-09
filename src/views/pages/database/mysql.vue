<script setup lang="ts">
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { CircleClose, ArrowDown, Setting, Hide, View, CopyDocument, CaretBottom } from '@element-plus/icons-vue'
import type { ConfProps } from './index.vue'
import { ElMessage } from 'element-plus' // 添加这行导入
import InstallMask from '@/components/InstallMask.vue'
import { ref,onMounted} from 'vue'
import { Api } from '@/api/Api'
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();
const router = useRouter();
const { conf } = defineProps<ConfProps>()
conf.list.getData()
const getWebsiteInfo = async () => {
  try {
    const { data } = await Api.getMysqlInfo();
    // 添加数据校验
    console.log("数据库依赖状态：已安装", data);
    myslqstatus.value = data.mysql
    sapp.setmysqlInfo(data); //将数据存储到pinia
    // return data;
  } catch (error) {
    ElMessage.error("获取网站信息失败");
    return false;
  }
}

onMounted(() => {
  getWebsiteInfo();
})

const myslqstatus = ref(false)//判断mysql依赖是否安装

const handleInstall = () => {
  myslqstatus.value = true
  // installDialog.visible = true
  // conf.website.websiteInfo = true
  ElMessage({
    type: 'warning',
    message: '功能开发中...'
  })
}
</script>

<template>
  <div>
    <install-mask :is-installed="myslqstatus" :installText="`${t('database.install')}MySQL`"  @install="handleInstall">
      <div v-if="conf.showTips" class="tip">
        <div class="flex items-center">
          <v-s-icon name="warning" size="22" :color="conf.themeColor[sapp.theme]" />
          <span class="ellipsis" style="margin-left: 32px; flex: 1;">
            {{ $t('database.tipLeft') }}
            <span style="color: var(--el-color-primary)" @click="router.push('/task')">{{ $t('database.tipSpan') }}</span>
            {{ $t('database.tipRight')  }}
          </span>
        </div>
        <el-icon class="cursor-pointer" size="26" color="#A2A2A2" @click="conf.showTips = false"
          style="margin-left: 24px;">
          <CircleClose />
        </el-icon>
      </div>
      <div class="container">
        <div class="tool-bar">
          <el-space class="btn-group" :size="14">
            <el-button type="primary" @click="conf.drawer.open('add')">{{ $t('database.addDatabase') }}</el-button>
            <!-- <el-button type="primary">root密码</el-button> -->
            <el-button type="primary" @click="System.router.push('/database/remote')">{{ $t('database.remoteDatabase') }}</el-button>
            <!-- <el-button type="primary">phpMyAdmin</el-button>
        <el-dropdown>
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
  <span style="font-size: 14px; margin-right: 8px">nignx</span>
  <el-icon>
    <CaretBottom />
  </el-icon>
</el-button>
<el-dropdown>
  <el-button type="primary">
    <span class="el-dropdown-link">
      全部
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
  </el-button>
  <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>分类1</el-dropdown-item>
              <el-dropdown-item>分类2</el-dropdown-item>
            </el-dropdown-menu>
          </template>
</el-dropdown> -->
          </el-space>
          <div class="demo-form-inline">
            <search-input v-model="conf.list.params.name" :placeholder="$t('database.searchPlaceholder')" style="margin-right: 18px"
              @search="conf.list.getData" />
            <el-button :icon="Setting" type="primary" />
          </div>
        </div>
        <div class="box2">
          <custom-table v-model:page="conf.list.params.page" :loading="conf.list.loading" :data="conf.list.data"
            :auto-pagination="false" :total="conf.list.total" :page-size="conf.list.params.pageSize"
            :columns="conf.list.columns" @update:page="conf.list.getData">
            <template #empty>
              <div>
                <span>
                  {{ $t('database.tableNoData') }}
                  <a class="cursor-pointer" style="color: var(--el-color-primary); text-decoration: underline"
                    @click="conf.drawer.open('add')">
                    {{ $t('database.tableNoDataAdd')  }}
                  </a>
                </span>
              </div>
            </template>
            <template #password="{ row, index }">
              <div class="flex items-center" style="gap: 8px">
                <span>
                  {{ conf.password.show[index] ? row.password : ''.padEnd(row.password.length, '*') }}
                </span>
                <el-icon class="hover-opacity cursor-pointer" :size="18"
                  @click="conf.password.show[index] = !conf.password.show[index]">
                  <View v-if="conf.password.show[index]" />
                  <Hide v-else />
                </el-icon>
                <el-icon class="hover-opacity cursor-pointer" @click="conf.password.copy(row.password)">
                  <CopyDocument />
                </el-icon>
              </div>
            </template>
          </custom-table>
        </div>
      </div>

    </install-mask>
  </div>
</template>

<style scoped lang="less">

.database-container {
  .tip {
    width: 100%;
    height: 58px;
    background: rgb(var(--bg-card-color));
    margin-top: 20px;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .flex {
      width:95%;
    }
    span {
      font-size: 16px;
      color: var(--font-color-gray-light);
    }
  }
}
</style>
