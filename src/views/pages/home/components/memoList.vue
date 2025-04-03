<template>
  <custom-dialog
    :show="conf.memoList.show"
    :title="$t('home.memo')"
    width="1022px"
    height="722px"
    body-bg-color="rgb(var(--category-item-bg-color))"
    footer-bg-color="rgb(var(--category-item-bg-color))"
    :show-close="false"
    @update:show="conf.memoList.close"
  >
    <div class="content">
      <el-collapse
        v-model="conf.memoList.activeName"
        accordion
        v-if="conf.memoList.list.length > 0"
      >
        <el-collapse-item
          title=""
          :name="item.id"
          v-for="item in conf.memoList.list"
        >
          <template #title> {{ item.content }} </template>
          <template #icon="{ isActive }">
            <div class="icon-ele">
              <span class="time">{{ timeFormat(item.create_time) }}</span>
              <el-icon v-if="isActive"><ArrowUp /></el-icon>
              <el-icon v-else><ArrowDown /></el-icon>
              <span>
                {{ isActive ? $t('commons.button.collapse') : $t('commons.button.expand') }}
              </span>
            </div>
          </template>
          <div class="collapse-content">
            {{ item.content }}
          </div>
          <div class="collapse-content-footer">
            <el-button type="danger" plain @click="conf.memoList.delete(item)"
              >{{ $t('commons.button.delete') }}</el-button
            >
            <el-button
              type="warning"
              plain
              @click="memoRef.open({ content: item.content, id: item.id })"
              >{{ $t('commons.button.edit') }}</el-button
            >
            <div class="icon-ele" @click="conf.memoList.activeName = 0">
              <el-icon v-if="conf.memoList.activeName == item.id"
                ><ArrowUp
              /></el-icon>
              <el-icon v-else><ArrowDown /></el-icon>
              <span>
                {{ conf.memoList.activeName == item.id ? $t('commons.button.collapse') : $t('commons.button.expand') }}
              </span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div v-else class="empty">
        <el-empty description="暂无数据" />
      </div>
    </div>

    <template #footer>
      <el-button @click="conf.memoList.close">{{$t('commons.button.cancel')}}</el-button>
      <el-button type="primary" @click="memoRef.open(conf.memoList.data)"
        >{{$t('commons.button.new')}}</el-button
      >
    </template>
  </custom-dialog>
  <memo ref="memoRef" @update="conf.memoList.getMemoList()" />
</template>
<script setup lang="ts">
import { ref, reactive } from "vue";
import { ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import Memo from "./memo.vue";
import CustomDialog from "@/components/custom-dialog.vue";
import { ElMessage } from "element-plus";
import { Api } from "@/api/Api";
import { timeFormat } from "@/utils/index";
const memoRef = ref();
const conf = reactive({
  memoList: {
    data: {
      id: null,
      content: "",
    },
    list: [] as any,
    show: false,
    activeName: 0,
    open: async () => {
      conf.memoList.show = true;
      conf.memoList.getMemoList();
    },
    close: () => (conf.memoList.show = false),
    // changeCollapse: (val: any) => {
    //   conf.memoList.activeName = val;
    //   if (val) {
    //     conf.memoList.data = conf.memoList.list.find(
    //       (item: any) => item.id == conf.memoList.activeName
    //     )!;
    //   }
    // },
    getMemoList: async () => {
      conf.memoList.data = {
        id: null,
        content: "",
      };
      const { data: res } = await Api.getRemarkList();
      conf.memoList.list = res;
      if (conf.memoList.list && conf.memoList.list.length > 0) {
        conf.memoList.activeName = conf.memoList.list[0].id;
      }
    },
    delete: async (item: any) => {
      if (!item.id) return;
      await Api.deleteRemark(item.id);
      ElMessage.success("删除成功");
      conf.memoList.getMemoList();
    },
  },
});
defineExpose({
  open: conf.memoList.open,
});
</script>
<style lang="less" scoped>
.icon-ele {
  margin: 0 8px 0 auto;
  color: rgb(var(--primary-color));
  display: flex;
  align-items: center;
  cursor: pointer;
  .time {
    color: var(--font-color-gray-light);
    margin-right: 21px;
  }
  span {
    margin-left: 6px;
    font-weight: bolder;
  }
}
.content {
  height: 500px;
  overflow-y: scroll;
}
.collapse-content {
  margin-top: 12px;
  border-bottom: 1px solid rgb(var(--category-item-bg-color));
  padding-bottom: 12px;
}
.collapse-content-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.empty {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
:deep(.el-collapse-item__header) {
  border-radius: 6px;
  padding: 0 22px;
  margin-top: 12px;
}
:deep(.is-active) {
  .el-collapse-item__header {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}
:deep(.el-collapse-item__wrap) {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  padding: 12px 22px;
}
:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
:deep(.custom-dialog__body) {
  height: 600px;
}
</style>
