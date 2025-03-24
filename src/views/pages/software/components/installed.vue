<script setup lang="ts">
import { Api } from '@/api/Api'
import { ChildProps } from '../index.vue'
import { dayjs } from 'element-plus'
import sapp from '@/sstore/sapp'
const props = withDefaults(defineProps<ChildProps>(), {
  list: () => []
})

const handleCheckRunState = async (id: number) => {
  const { data: isRun } = await Api.getSoftRunState({ id })
  return isRun
}

props.list.forEach(async (item) => {
  item.isRun = await handleCheckRunState(item.id)
})
const handleStart = () => {
  
}
const handleRestart = () => {
  
}
const handleStop = () => {
  
}
const handleUninstall = () => {
  
}
const handleSync = () => {
  
}
const handleChangeLayout = ()=>{
  sapp.setLayout(sapp.layout == 'grid'? 'list' : 'grid')
}
const columns = [
  {
    prop: 'name',
    label: '软件名称',
    width: 280
  },
  {
    prop: 'describe',
    label: '简介',
  },
  {
    prop: 'status',
    label: '是否安装',
    width: 180
  },
  {
    prop: 'version',
    label: '安装版本',
    width: 180
  },
  {
    prop: 'operation',
    label: '操作',
    width: 180,
    align: 'center'
  }
]
</script>

<template>
  <div>
    <div class="title">
      <p>已安装</p>
      <div class="right">
        <el-button type="primary" class="btn" @click="handleStart">一键启动</el-button>
        <el-button type="primary" class="btn" @click="handleRestart">一键重启</el-button>
        <el-button type="primary" class="btn" @click="handleStop">一键停止</el-button>
        <el-button type="primary" class="btn" @click="handleUninstall">一键卸载</el-button>
        <el-button type="primary" class="btn" @click="handleSync">同步</el-button>
        <v-s-icon name="layout" size="22" class="cursor-pointer icon" @click="handleChangeLayout"/>
      </div>
      </div>
    <div v-if="sapp.layout == 'grid'" class="list">
      <template v-if="list.length">
        <div v-for="item in list" class="item">
          <div style="padding: 28px 30px">
            <div class="sundry">
              <div class="icon">
                <img :src="item.icon" alt="" />
              </div>
              <div class="content">
                <div class="flex justify-between" style="gap: 16px">
                  <div>
                    <span class="menuTitle">{{ item.name }}</span>
                    <span class="remark" :class="{ stop: !item.isRun }">
                      {{ item.isRun ? '（已启动）' : '（未启动）' }}
                    </span>
                  </div>
                  <div class="flex" style="gap: 16px">
                    <div class="btn primary">安装目录</div>
                    <div class="btn primary">日志</div>
                  </div>
                </div>
                <div class="tip">
                  <div class="btn">版本：1.21.4</div>
                  <div class="btn">服务端口：80</div>
                  <div class="btn">服务端口：443</div>
                </div>
                <span style="color: var(--font-color-gray); margin-top: 10px">
                  已安装：{{ `${dayjs().diff(item.install_time, 'd')}天`
                  }}{{ `${dayjs().diff(item.install_time, 'h') - dayjs().diff(item.install_time, 'd') * 24}小时` }}
                </span>
              </div>
            </div>
            <div class="xian" />
            <div class="below">
              <div class="btn round">同步</div>
              <div class="btn round">重建</div>
              <div class="btn round">重启</div>
              <div class="btn round">启动</div>
              <div class="btn round">停止</div>
              <div class="btn round">卸载</div>
              <div class="btn round">参数</div>
              <div class="btn round">备份</div>
              <div class="btn round">导入重启</div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="no-data">
        <img src="/static/images/empty.webp" alt="" />
        <span>尚未安装任何应用</span>
      </div>
    </div>
    <div v-else class="table-content">
      <custom-table :columns="columns" :data="list" :pagination="false">
        <template #status="{ row }">
        </template>
        <template #operation="{ row }">
        </template>
      </custom-table>
    </div>
  </div>
</template>

<style scoped lang="less">
.title {
  font-weight: 500;
  font-size: 18px;
  color: var(--font-color-black);
  display: flex;
  justify-content: space-between;
  align-items: center;
  .right{
      display: flex;
      align-items: center;
      .icon{
        margin-left: 12px;
      }
  }
}

.list {
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 20px;

  .item {
    width: 49%;
    height: 220px;
    background: rgb(var(--bg-hover-color));
    border-radius: 8px;
    margin-left: 2%;
    margin-bottom: 22px;
    border: 2px solid transparent;

    &:hover {
      border-color: var(--el-color-primary);
      cursor: pointer;

      .menuTitle {
        color: var(--el-color-primary);
      }
    }

    .menuTitle {
      font-size: 22px;
      color: var(--font-color-black);
    }

    .remark {
      color: rgb(var(--success-color));
      font-size: 14px;

      &.stop {
        color: rgb(var(--error-color));
      }
    }

    .sundry {
      margin-bottom: 20px;
      display: flex;
      flex-direction: row;
      align-items: center;

      .icon {
        width: 86px;
        height: 86px;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
        }
      }

      .content {
        display: flex;
        flex-flow: column nowrap;
        width: 100%;
        margin-left: 28px;

        .tip {
          color: var(--font-color-gray-light);
          font-size: 16px;
          display: flex;
          gap: 16px;
        }
      }
    }

    .xian {
      border-bottom: 1px solid rgba(186, 186, 186, 0.32);
    }

    .below {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin-top: 20px;
      color: var(--font-color-gray-light);
    }
  }

  .item:nth-of-type(2n - 1) {
    margin-left: 0;
  }

  .no-data {
    width: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    color: var(--font-color-gray-light);
  }

  .btn {
    padding-inline: 8px;
    margin-bottom: 0;
    min-width: 69px;
    height: 34px;
    background: transparent;
    border: 1px solid var(--el-color-primary);
    border-radius: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    border-color: rgba(var(--border-color-gray));
    color: var(--font-color-gray);

    &.round {
      border-radius: 22px;
    }

    &.primary {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);

      &:hover {
        background-color: var(--el-color-primary);
        color: var(--font-color-white);
      }
    }

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
}
.table-content{
  margin-top: 24px;
}
</style>
