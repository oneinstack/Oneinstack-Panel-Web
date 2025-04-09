<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox, FormInstance } from "element-plus";
import {
  Refresh,
  VideoPlay,
  VideoPause,
  Warning,
} from "@element-plus/icons-vue";
import { Api } from "@/api/Api";
import AddTask from "./add-task.vue";
import formatCron from "@/utils/cronutils";
import System from "@/utils/System";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const tableRef =
  ref<InstanceType<(typeof import("element-plus"))["ElTable"]>>();

interface RuleForm {
  name: string;
  region: string;
  count: string;
  desc: string;
}

interface Task {
  id: number;
  enabled: boolean;
  // 其他属性...
}

const multipleSelection = ref<Task[]>([]);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 清空表格选中状态的方法
const clearTableSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection();
  }
};

let searchValue = ref("");
const tableData = ref([]);

const getData = async () => {
  multipleSelection.value = [];
  try {
    const { data: res } = await Api.getPlanTaskList({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      q: searchValue.value,
    });
    console.log(res, "res");
    if (res) {
      tableData.value = res.data || [];
      pagination.total = res.total || 0;
    } else {
      ElMessage.error(res?.message || "获取数据失败");
    }
  } catch (error) {
    ElMessage.error("获取数据失败");
    tableData.value = [];
    pagination.total = 0;
  }
};

const category = ref([
  "传统项目",
  "swoole异步项目",
  "thinkphp异步项目",
  "异步项目",
  "一键部署",
  "批量创建",
]);

const formInline = reactive({
  user: "",
  region: "",
  date: "",
});

const onSubmit = () => {
  console.log("submit!");
  pagination.pageSize = 10;
  pagination.currentPage = 1;
  searchValue.value = "";
  getData();
};

const enabledClick = () => {
  ElMessageBox.confirm(
    "计划任务暂停后将无法继续运行，您真的要停用这个计划任务吗？",
    "设置计划任务状态",
    {
      confirmButtonText: t("commons.button.confirm"),
      cancelButtonText: t("commons.button.cancel"),
      type: "warning",
    }
  )
    .then(() => {
      ElMessage({
        type: "success",
        message: "退出成功",
      });
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "取消退出",
      });
    });
};

const ruleFormRef = ref<FormInstance>();
const ruleForm = reactive<RuleForm>({
  name: "Hello",
  region: "",
  count: "",
  desc: "",
});
let action_type = ref(true);
let rulesForm = ref({
  name: "",
  cron_type: "",
  schedule: "",
  created_at: "",
  deleted_at: "",
  id: "",
  command: "",
  enabled: true,
  updated_at: "",
});

const filterDirection = ref("");
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${t('commons.units.year')}${month}${t('commons.units.month')}${day}${t('commons.units.day')} ${hours}:${minutes}:${seconds}`;
};

const addTaskVisible = ref(false);
const addTask = () => {
  action_type.value = true;
  addTaskVisible.value = true;
  rulesForm.value = {
    name: "",
    cron_type: "",
    schedule: "",
    created_at: "",
    deleted_at: "",
    id: "",
    command: "",
    enabled: true,
    updated_at: "",
  };
};

const handleTaskAdded = (data: any) => {
  console.log("接收到子组件传递的数据:", data);
  // addTaskVisible.value = false
  getData();
};
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  getData();
};

// 处理表格选中项变化的方法
const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val;
};

// 批量删除方法
const batchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning("请选择要删除的任务");
    return;
  }
  ElMessageBox.confirm(t('commons.msg.delConfirmSelectTask'), t("commons.tip"), {
    confirmButtonText: t("commons.button.confirm"),
    cancelButtonText: t("commons.button.cancel"),
    type: "warning",
  })
    .then(async () => {
      const ids = multipleSelection.value.map((item: Task) => item.id);
      try {
        await Api.deletePlanTask({ ids });
        ElMessage.success(t("commons.msg.delSuccess"));
        getData();
      } catch (error) {
        ElMessage.error(t("commons.msg.delFailed"));
      }
    })
    .catch(() => {
      ElMessage.info(t("commons.msg.delCancel"));
    });
};

// 批量禁止方法
const batchDisable = async () => {
  const validSelection = multipleSelection.value.filter(
    (item) => item.enabled === true
  );
  if (validSelection.length === 0) {
    ElMessage.warning(t('commons.msg.disSelectRunningTask'));
    return;
  }
  ElMessageBox.confirm(t("commons.msg.disableConfirmSelectTask"), t("commons.tip"), {
    confirmButtonText: t("commons.button.confirm"),
    cancelButtonText: t("commons.button.cancel"),
    type: "warning",
  })
    .then(async () => {
      const ids = validSelection.map((item) => item.id);
      try {
        await Api.disablePlanTask({ ids });
        ElMessage.success(t("commons.msg.disableSuccess"));
        getData();
        clearTableSelection();
      } catch (error) {
        ElMessage.error(t("commons.msg.disableFailed"));
      }
    })
    .catch(() => {
      ElMessage.info(t("commons.msg.disableCancel"));
    });
};

// 批量开启方法
const batchEnable = async () => {
  const validSelection = multipleSelection.value.filter(
    (item) => item.enabled === false
  );
  if (validSelection.length === 0) {
    ElMessage.warning(t("commons.msg.openSelectDisTask"));
    return;
  }
  ElMessageBox.confirm(t('commons.msg.openConfirmSelectTask'), t('commons.tip'), {
    confirmButtonText: t("commons.button.confirm"),
    cancelButtonText: t("commons.button.cancel"),
    type: "warning",
  })
    .then(async () => {
      const ids = validSelection.map((item) => item.id);
      try {
        await Api.enablePlanTask({ ids });
        ElMessage.success(t("commons.msg.openSuccess"));
        getData();
        clearTableSelection();
      } catch (error) {
        ElMessage.error(t("commons.msg.openFailed"));
      }
    })
    .catch(() => {
      ElMessage.info(t("commons.msg.openCancel"));
    });
};

// 单条数据删除方法
const deleteSingleTask = async (row: any) => {
  ElMessageBox.confirm(t('commons.msg.delConfirmTask'), t('commons.tip'), {
    confirmButtonText: t("commons.button.confirm"),
    cancelButtonText: t("commons.button.cancel"),
    type: "warning",
  })
    .then(async () => {
      try {
        await Api.deletePlanTask({ ids: [row.id] });
        ElMessage.success(t("commons.msg.deleteSuccess"));
        getData();
        clearTableSelection();
      } catch (error) {
        ElMessage.error(t("commons.msg.deleteFailed"));
      }
    })
    .catch(() => {
      ElMessage.info(t("commons.msg.deleteCancel"));
    });
};

// 单条数据禁用方法
const disableSingleTask = async (row: any) => {
  if (row.enabled === false) {
    ElMessage.warning(t('commons.msg.alreadyDisabledTask'));
    return;
  }
  ElMessageBox.confirm(t('commons.msg.disableConfirmTask'), t("commons.tip"), {
    confirmButtonText: t("commons.button.confirm"),
    cancelButtonText: t("commons.button.cancel"),
    type: "warning",
  })
    .then(async () => {
      try {
        await Api.disablePlanTask({ ids: [row.id] });
        ElMessage.success(t("commons.msg.disableSuccess"));
        getData();
      } catch (error) {
        ElMessage.error(t("commons.msg.disableFailed"));
      }
    })
    .catch(() => {
      ElMessage.info(t("commons.msg.disableCancel"));
    });
};

// 单条数据开启方法
const enableSingleTask = async (row: any) => {
  if (row.enabled === true) {
    ElMessage.warning(t('commons.msg.alreadyRunningTask'));
    return;
  }
  ElMessageBox.confirm(t("commons.msg.openConfirmTask"), t("commons.tip"), {
    confirmButtonText: t("commons.button.confirm"),
    cancelButtonText: t("commons.button.cancel"),
    type: "warning",
  })
    .then(async () => {
      try {
        await Api.enablePlanTask({ ids: [row.id] });
        ElMessage.success(t("commons.msg.openSuccess"));
        getData();
      } catch (error) {
        ElMessage.error(t("commons.msg.openFailed"));
      }
    })
    .catch(() => {
      ElMessage.info(t("commons.msg.openCancel"));
    });
};

// 更新单条数据方法
const updateSingleTask = async (row: any) => {
  action_type.value = false;
  addTaskVisible.value = true;
  rulesForm.value = {
    name: row.name,
    cron_type: row.cron_type,
    schedule: row.schedule,
    created_at: row.created_at,
    deleted_at: row.deleted_at,
    id: row.id,
    command: row.command,
    enabled: row.enabled,
    updated_at: row.updated_at,
  };
  // 这里可以传递 row 数据到子组件进行编辑
  // 例如：addTaskVisible.value = { ...row }
};
// 查看单条数据日志方法
const updateSingleTaskLog = async (row: any) => {
  System.router.push("/task/log");
  // router.push({
  //   name: 'taskLog',
  //   query: {
  //     id: row.id
  //   }
  // })
  let { data: res } = await Api.getPlanTaskLog({ id: row.id });
  console.log(res, "res");
};
// 选择过滤函数，控制选择逻辑
const selectFilter = (row: any) => {
  return true;
};

// 全选过滤函数，控制全选逻辑
const selectAllFilter = (rows: any[]) => {
  return rows.filter((row) => selectFilter(row));
};

// 上一页
const prevPage = () => {
  if (pagination.currentPage > 1) {
    pagination.currentPage--;
    getData();
  }
};

// 下一页
const nextPage = () => {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  if (pagination.currentPage < totalPages) {
    pagination.currentPage++;
    getData();
  }
};

// 处理每页数量变化
const handlePageSizeChange = (newSize: number) => {
  pagination.pageSize = newSize;
  pagination.currentPage = 1;
  getData();
};

const collectionHeaderCellClassName = (row: any) => {
  if (row.columnIndex != row.row.length - 1) {
    return {
      "border-right": "1px solid #8B8B8B30",
      height: "40px",
      "text-align": "center",
    };
  } else {
    return { height: "40px", "text-align": "center" };
  }
};

onMounted(() => {
  getData();
});
</script>
<template>
  <div class="container">
    <div class="card-box">
      <el-card>
        <div class="card-content">
          <el-space class="btn-group">
            <el-button class="large-btn" type="primary" @click="addTask">{{
              $t("task.addTask")
            }}</el-button>
            <!-- <el-button type="primary">执行任务</el-button> -->
            <el-button class="large-btn" type="primary" @click="batchEnable">{{
              $t("task.startTask")
            }}</el-button>
            <el-button class="large-btn" type="primary" @click="batchDisable">{{
              $t("task.stopTask")
            }}</el-button>
            <el-button class="large-btn" type="primary" @click="batchDelete">{{
              $t("task.deleteTask")
            }}</el-button>
          </el-space>
          <div class="demo-form-inline flex" style="margin-left: auto">
            <!-- <el-dropdown>
          <el-button type="primary" class="mr-2">
            <span class="el-dropdown-link">
              全部分类
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>分类</el-dropdown-item>
            </el-dropdown-menu>
          </template>
</el-dropdown> -->
            <search-input
              :placeholder="$t('task.searchPlaceholder')"
              style="margin-right: 18px"
              v-model="searchValue"
              @search="getData()"
            />
            <!-- <el-button
              :icon="Refresh"
              type="primary"
              @click="onSubmit"
              style="margin-left: auto"
            /> -->
            <el-button
              class="refresh-btn"
              icon="RefreshRight"
              @click="onSubmit"
            />
            <!-- <download-notice /> -->
            <!-- <el-button :icon="Setting" type="primary" @click="onSubmit" /> -->
          </div>
        </div>
      </el-card>
    </div>
    <div class="box2">
      <el-table
        ref="tableRef"
        class="fileTable"
        :data="tableData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        :select-on-indeterminate="false"
        :row-selectable="selectFilter"
        :row-key="(row: any) => row.id"
        :empty-text="$t('commons.noData')"
      >
        <el-table-column
          type="selection"
          width="55"
          :reserve-selection="true"
          :selectable="selectFilter"
          align="center"
        />
        <el-table-column
          prop="name"
          :label="$t('task.taskName')"
          width="180"
        ></el-table-column>
        <el-table-column prop="enabled" label="状态" width="180">
          <template #default="scope">
            <div
              style="
                display: flex;
                flex-direction: row;
                align-items: center;
                cursor: pointer;
              "
            >
              <a
                style="
                  color: #64ffc9;
                  text-decoration: underline;
                  display: flex;
                "
                class="abox"
                v-if="scope.row.enabled"
                @click="disableSingleTask(scope.row)"
              >
                {{ $t("task.running") }}
                <el-icon>
                  <VideoPlay />
                </el-icon>
              </a>
              <a
                style="color: #ff4848; text-decoration: underline"
                class="abox"
                v-else-if="!scope.row.enabled"
                @click="enableSingleTask(scope.row)"
              >
                <el-icon>
                  <VideoPause />
                </el-icon>
                {{ $t("task.stop") }}
              </a>
              <!-- <a style="color: #ff8888; text-decoration: underline"  class="abox" v-else>
                <el-icon><Warning /></el-icon>
                运行异常
              </a> -->
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="address" :label="$t('task.exeCycle')">
          <template #default="scope">
            <div
              style="
                display: flex;
                flex-direction: row;
                align-items: center;
                cursor: pointer;
              "
            >
              <span v-html="formatCron(scope.row.schedule)"></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" :label="$t('task.lastExeTime')">
          <template #default="scope">
            <div
              style="
                display: flex;
                flex-direction: row;
                align-items: center;
                cursor: pointer;
              "
            >
              <span>{{ formatDate(scope.row.updated_at) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="address"
          :label="$t('commons.action')"
          align="center"
        >
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="enableSingleTask(scope.row)"
              v-if="!scope.row.enabled"
            >
              {{ $t("commons.button.start") }}
            </el-button>
            <el-button
              link
              type="primary"
              @click="disableSingleTask(scope.row)"
              v-if="scope.row.enabled"
            >
              {{ $t("commons.button.disable") }}
            </el-button>
            <el-button link type="primary" @click="deleteSingleTask(scope.row)">
              {{ $t("commons.button.delete")}}
            </el-button>
            <el-button link type="primary" @click="updateSingleTask(scope.row)">
              {{ $t("commons.button.update") }}
            </el-button>
            <el-button
              link
              type="primary"
              @click="updateSingleTaskLog(scope.row)"
            >
              {{ $t("commons.button.viewLog") }}
            </el-button>
          </template>
        </el-table-column>
        <!-- 自定义表格底部栏用于分页 -->
        <template #footer>
          <tr>
            <td colspan="6">
              <div class="table-pagination">
                <el-select
                  v-model="pagination.pageSize"
                  @change="handlePageSizeChange"
                >
                  <el-option label="10" value="10"></el-option>
                  <el-option label="20" value="20"></el-option>
                  <el-option label="50" value="50"></el-option>
                </el-select>
                <span>条/页</span>
                <el-button
                  @click="prevPage"
                  :disabled="pagination.currentPage === 1"
                  >上一页</el-button
                >
                <span
                  >{{ pagination.currentPage }} /
                  {{ Math.ceil(pagination.total / pagination.pageSize) }}</span
                >
                <el-button
                  @click="nextPage"
                  :disabled="
                    pagination.currentPage ===
                    Math.ceil(pagination.total / pagination.pageSize)
                  "
                  >下一页</el-button
                >
                <span>共 {{ pagination.total }} 条记录</span>
              </div>
            </td>
          </tr>
        </template>
      </el-table>
    </div>
    <AddTask
      v-model="addTaskVisible"
      :type="action_type"
      @taskAdded="handleTaskAdded"
      :formData="rulesForm"
    />
  </div>
</template>
<style scoped lang="less">
.container {
  margin-top: 0;
  :deep(.el-card__body) {
    padding: 0 16px;
    .card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 64px;
    }
  }
}
.abox {
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
}
.demo-form-inline {
  align-items: center;
}
.refresh-btn {
  width: 38px;
  height: 38px;
  margin-right: 20px;
}
</style>
