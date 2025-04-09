<script setup lang="ts">
import { Api } from "@/api/Api";
import { ChildProps } from "../index.vue";
import { dayjs } from "element-plus";
import sapp from "@/sstore/sapp";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = withDefaults(defineProps<ChildProps>(), {
  list: () => [],
});
console.log("安装列表", props.list);

const installedList = ref<any[]>([]);

props.list.forEach((item) => {
  if (item.installed) {
    installedList.value.push(item);
  }
});
console.log("已安装", installedList.value);
const hanldeCheckRunState = async (id: number) => {
  const { data: isRun } = await Api.getSoftRunState({ id });
  return isRun;
};

props.list.forEach(async (item) => {
  item.isRun = await hanldeCheckRunState(item.id);
});
const handleChangeLayout = () => {
  sapp.setLayout(sapp.layout == "grid" ? "list" : "grid");
};
const columns = [
  {
    prop: "name",
    label: t("software.name"),
    width: 280,
  },
  {
    prop: "describe",
    label: t("software.describe"),
  },
  {
    prop: "status",
    label: t("software.isInstalled"),
    width: 180,
  },
  {
    prop: "version",
    label: t("software.installedVersion"),
    width: 180,
  },
  {
    prop: "operation",
    label: t("commons.action"),
    width: 180,
    align: "center",
  },
];
const handleStart = () => {};
const handleRestart = () => {};
const handleStop = () => {};
const handleUninstall = () => {};
const handleSync = () => {};
</script>

<template>
  <div style="flex:1">
    <div class="title">
      <p>{{ $t("software.installed") }}</p>
      <div class="right">
        <!-- <el-button type="primary" class="btn" @click="handleStart">一键启动</el-button>
        <el-button type="primary" class="btn" @click="handleRestart">一键重启</el-button>
        <el-button type="primary" class="btn" @click="handleStop">一键停止</el-button>
        <el-button type="primary" class="btn" @click="handleUninstall">一键卸载</el-button>
        <el-button type="primary" class="btn" @click="handleSync">同步</el-button> -->
        <v-s-icon
          name="layout"
          size="22"
          class="cursor-pointer icon"
          @click="handleChangeLayout"
        />
      </div>
    </div>
    <div v-if="sapp.layout == 'grid'" class="list">
      <template v-if="installedList.length">
        <div v-for="item in installedList" class="item">
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
                      {{
                        item.isRun
                          ? `（${$t("software.started")}）`
                          : `（${$t("software.notStarted")}）`
                      }}
                    </span>
                  </div>
                  <div class="flex" style="gap: 16px">
                    <div class="btn primary">
                      {{ $t("commons.button.installedDir") }}
                    </div>
                    <div class="btn primary">
                      {{ $t("commons.button.log") }}
                    </div>
                  </div>
                </div>
                <div class="tip">
                  <div class="btn">
                    {{ $t("software.version") }}：{{ item.versions[0] }}
                  </div>
                  <div class="btn">{{ $t("software.serverPort") }}：80</div>
                  <div class="btn">{{ $t("software.serverPort") }}：443</div>
                </div>
                <span style="color: var(--font-color-gray); margin-top: 10px">
                  {{ $t("software.installed") }}：{{
                    `${dayjs().diff(item.install_time, "d")}${$t("commons.units.day")}`
                  }}{{
                    `${dayjs().diff(item.install_time, "h") - dayjs().diff(item.install_time, "d") * 24}${$t("commons.units.hour")}`
                  }}
                </span>
              </div>
            </div>
            <div class="xian" />
            <div class="below">
              <div class="btn round">{{ $t("commons.button.sync") }}</div>
              <div class="btn round">{{ $t("commons.button.rebuild") }}</div>
              <div class="btn round">{{ $t("commons.button.restart") }}</div>
              <div class="btn round">{{ $t("commons.button.start") }}</div>
              <div class="btn round">{{ $t("commons.button.stop") }}</div>
              <div class="btn round">{{ $t("commons.button.uninstall") }}</div>
              <div class="btn round">{{ $t("commons.button.arg") }}</div>
              <div class="btn round">{{ $t("commons.button.backups") }}</div>
              <div class="btn round">
                {{ $t("commons.button.importRestart") }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="no-data">
        <img src="/static/images/empty.webp" alt="" />
        <span>{{ $t("software.noInstalledApps") }}</span>
      </div>
    </div>
    <div v-else class="installed-table">
      <custom-table
        :columns="columns"
        :data="installedList"
        :pagination="false"
      >
        <template #status="{ row }"> </template>
        <template #operation="{ row }"> </template>
      </custom-table>
    </div>
  </div>
</template>

<style scoped lang="less">
.installed-table{
  margin-top:24px;
}
.title {
  font-weight: 500;
  font-size: 18px;
  color: var(--font-color-black);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.right {
  display: flex;
  align-items: center;
  .icon {
    margin-left: 12px;
  }
}
.list {
  width: 100%;
  // display: grid;
  // grid-template-columns: repeat(2, 1fr);
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  margin-top: 20px;
  overflow: hidden; // 新增

  .item {
    width: calc((100% - (2 - 1) * 22px) / 2);
    // height: 220px;
    background: rgb(var(--bg-hover-color));
    border-radius: 8px;
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
          object-fit: contain;
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
      gap: 12.7px;
      margin-top: 20px;
      color: var(--font-color-gray-light);
      flex-wrap: wrap;
    }
  }
  @media screen and (max-width: 1600px) {
    .item {
      width: 100%;
    }
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
