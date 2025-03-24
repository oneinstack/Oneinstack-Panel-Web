<template>
  <custom-dialog
    :show="show"
    title="备忘录"
    width="624px"
    body-bg-color="rgb(var(--category-item-bg-color))"
    footer-bg-color="rgb(var(--category-item-bg-color))"
    :show-close="false"
    @update:show="close"
  >
    <div>
      <el-collapse v-model="activeName" accordion>
        <el-collapse-item title="" :name="i" v-for="i in 4">
          <template #title> Consistency{{ i }} </template>
          <template #icon="{ isActive }">
            <div class="icon-ele">
              <el-icon v-if="isActive"><ArrowUp /></el-icon>
              <el-icon v-else><ArrowDown /></el-icon>
              <span>
                {{ isActive ? "收起" : "展开" }}
              </span>
            </div>
          </template>
          <div class="collapse-content">
            Consistent with real life: in line with the process and logic of
            real life, and comply with languages and habits that the users are
            used to;
          </div>
          <div class="collapse-content-footer">
            <el-button type="danger" plain @click="conf.memo.open"
              >删除</el-button
            >
            <div class="icon-ele" @click="activeName = 0">
              <el-icon v-if="activeName == i"><ArrowUp /></el-icon>
              <el-icon v-else><ArrowDown /></el-icon>
              <span>
                {{ activeName == i ? "收起" : "展开" }}
              </span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="conf.memo.open">新建</el-button>
    </template>
  </custom-dialog>
  <memo
    :show="conf.memo.show"
    :memo="conf.memo.data"
    :close="conf.memo.close"
    :update="conf.memo.update"
  />
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import Memo from "./memo.vue";
import CustomDialog from "@/components/custom-dialog.vue";
import { ElMessage } from "element-plus";
import { Api } from "@/api/Api";
const activeName = ref(1);
interface Props {
  show: boolean;
  memo: {
    id: number;
    content: string;
  };
  close: () => void;
  update: () => void;
}

defineProps<Props>();
const conf = reactive({
  memo: {
    data: {
      id: 1,
      content: "",
    },
    list: [],
    show: false,
    open: async () => {
      await conf.memo.getData();
      conf.memo.show = true;
    },
    close: () => (conf.memo.show = false),
    getData: async () => {
      const { data: res } = await Api.getSysRemark();
      // conf.memo.data = res;
      conf.memo.list = res;
    },
    update: async () => {
      await Api.updateSysRemark(conf.memo.data);
      ElMessage.success("保存成功");
      //   conf.memo.getData();
      conf.memo.show = false;
    },
  },
});
</script>
<style lang="less" scoped>
.icon-ele {
  margin: 0 8px 0 auto;
  color: rgb(var(--primary-color));
  display: flex;
  align-items: center;
  cursor:pointer;
  span{
    margin-left: 6px;
    font-weight: bolder;
  }
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
:deep(.el-collapse-item__header) {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  padding: 20px 22px;
  margin-top: 12px;
}
:deep(.el-collapse-item__wrap) {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  padding: 12px 22px;
}
:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
</style>
