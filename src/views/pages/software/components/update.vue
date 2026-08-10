<script setup lang="ts">
import { ChildProps } from '../index.vue'
import i18n from '@/lang'

withDefaults(defineProps<ChildProps>(), {
  list: () => []
})

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}
</script>

<template>
  <div>
    <div class="title">{{ t('software.tabs.upgradeable', '可升级') }}</div>
    <div class="list">
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
                    <span class="remark">{{ t('software.installedPage.started', '（已启动）') }}</span>
                  </div>
                  <div class="flex" style="gap: 16px">
                    <div class="btn primary">{{ t('software.installedPage.installDir', '安装目录') }}</div>
                    <div class="btn primary">{{ t('software.installedPage.logs', '日志') }}</div>
                  </div>
                </div>
                <div class="tip">
                  <div class="btn">{{ t('software.installedPage.version', '版本：{version}', { version: '1.21.4' }) }}</div>
                  <div class="btn">{{ t('software.installedPage.servicePort', '服务端口：{port}', { port: 80 }) }}</div>
                  <div class="btn">{{ t('software.installedPage.servicePort', '服务端口：{port}', { port: 443 }) }}</div>
                </div>
                <span style="color: var(--font-color-gray); margin-top: 10px">{{ t('software.installedPage.installedDuration', '已安装：{days}天{hours}小时', { days: 194, hours: 1 }) }}</span>
              </div>
            </div>
            <div class="xian" />
            <div class="below">
              <div class="btn round">{{ t('software.upgrade', '升级') }}</div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="no-data">
        <img src="/static/images/empty.webp" alt="" />
        <span>{{ t('software.noUpgradeableApps', '暂无需要升级的应用') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.title {
  font-weight: 500;
  font-size: 18px;
  color: var(--font-color-black);
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
      justify-content: flex-end;
      margin-top: 20px;
      color: var(--font-color-gray-light);
    }
  }

  .item:nth-of-type(3n-2) {
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
</style>
