<template>
  <div class="download-notice" @click="notice.open">
    <el-badge :value="notice.num" :max="99" :class="notice.num ? 'item' : ''" :hidden="notice.num ? false : true">
      <slot name="icon" :data="notice">
        <el-icon class="icon" size="24"><Download /></el-icon>
      </slot>
    </el-badge>
  </div>
  <custom-dialog
    :show="notice.show"
    title="下载任务"
    width="1022px"
    height="722px"
    body-bg-color="rgb(var(--category-item-bg-color))"
    footer-bg-color="rgb(var(--category-item-bg-color))"
    :show-close="false"
    @update:show="notice.close"
  >
    <div class="content">
      <el-collapse
        v-model="notice.currentNotice"
        accordion
        v-if="notice.list.length > 0"
      >
        <el-collapse-item title="" :name="item.id" v-for="item in notice.list">
          <template #title> {{ item.content }} </template>
          <template #icon="{ isActive }">
            <div class="icon-ele">
              <span class="time">{{ timeFormat(item.create_time) }}</span>
              <el-icon v-if="isActive"><ArrowUp /></el-icon>
              <el-icon v-else><ArrowDown /></el-icon>
              <span>
                {{ isActive ? "收起" : "展开" }}
              </span>
            </div>
          </template>
          <div class="collapse-content">
            {{ item.content }}
          </div>
          <div class="collapse-content-footer">
            <el-button type="danger" plain @click="notice.delete(item)"
              >删除</el-button
            >
            <div class="icon-ele" @click="notice.currentNotice = ''">
              <el-icon v-if="notice.currentNotice == item.id"
                ><ArrowUp
              /></el-icon>
              <el-icon v-else><ArrowDown /></el-icon>
              <span>
                {{ notice.currentNotice == item.id ? "收起" : "展开" }}
              </span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div v-else class="empty">
        <el-empty description="暂无数据" />
      </div>
    </div>
    <template #footer> </template>
  </custom-dialog>
</template>
<script setup lang="ts">
import { ref, reactive } from "vue";
import CustomDialog from "@/components/custom-dialog.vue";
import { ElMessage } from "element-plus";
import { Api } from "@/api/Api";
import { timeFormat } from "@/utils/index";
import { notice } from "@/sstore/notice";
</script>
<style lang="less" scoped>
.download-notice {
  background: rgb(var(--primary-color));
  position: fixed;
  bottom: 20px;
  right: 10px;
  z-index: 9999;
  border-radius: 50%;
  height: 50px;
  width: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  .item{
    margin-top: 10px;
  }
  .icon {
    color: #ffffff;
    // color: var(--font-color-gray-light);
  }
}

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
