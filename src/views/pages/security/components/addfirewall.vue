<template>
  <el-dialog
    v-model="drawer2"
    width="560px"
    :direction="direction"
    :show-close="true"
    @close="cancelClick"
    style="padding-top: 0"
  >
    <template #header>
      <div class="firewall-dialog-header">
        <div class="firewall-dialog-header-title">
          <span class="firewall-dialog-header-title-text">{{
            props.type ? $t('security.addFirewall') : $t('security.updateFirewall')
          }}</span>
        </div>
      </div>
    </template>

    <template #default>
      <el-form
        style="padding: 0 20px"
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        class="demo-ruleForm"
        status-icon
        label-width="50px"
      >
        <el-form-item :label="$t('security.protocol')" prop="protocol" :required="true">
          <el-select v-model="ruleForm.protocol" placeholder="请选择协议类型">
            <el-option label="TCP" value="tcp" />
            <el-option label="UDP" value="udp" />
            <!-- <el-option label="icmp" value="icmp" /> -->
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('security.port')" prop="ports" :required="true">
          <el-input
            v-model="ruleForm.ports"
            :placeholder="$t('security.ports') + $t('commons.example') + '80,88'"
          />
        </el-form-item>
        <el-form-item
          :label="$t('security.source')"
          prop="ips"
          :required="ruleForm.ips === 'true'"
        >
          <el-radio-group
            v-model="ruleForm.ips"
            @change="$refs.ruleFormRef?.validateField('ips')"
          >
            <el-radio value="">{{$t('security.allIP')}}</el-radio>
            <el-radio value="true">{{$t('security.partIP')}}</el-radio>
          </el-radio-group>
          <el-input
            v-if="ruleForm.ips === 'true'"
            v-model="ipsdata"
            :placeholder="$t('security.ports') + $t('commons.example') + '192.168.1.1,192.168.1.0/24'"
            @blur="$refs.ruleFormRef?.validateField('ips')"
          />
        </el-form-item>
        <el-form-item :label="$t('security.policy')" prop="strategy" :required="true">
          <el-select v-model="ruleForm.strategy" :placeholder="$t('security.policyPlaceholder')">
            <el-option :label="$t('security.allow')" value="allow" />
            <el-option :label="$t('security.forbid')" value="deny" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('security.direction')" prop="direction" :required="true">
          <el-select v-model="ruleForm.direction" :placeholder="$t('security.directionPlaceholder')">
            <el-option :label="$t('security.inbound')" value="in" />
            <el-option :label="$t('security.outbound')" value="out" />
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="状态" prop="state" :required="true">
      <el-select 
        v-model="ruleForm.state" 
        placeholder="请选择状态"
        :disabled="props.type"
      >
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" v-if="!props.type" />
      </el-select>
    </el-form-item> -->

        <el-form-item :label="$t('commons.remark')" prop="remark">
          <el-input v-model="ruleForm.remark" :placeholder="$t('security.remarkPlaceholder')" />
        </el-form-item>
        <div class="textbox">
          <div class="tagbox">*</div>
          {{$t('security.addPorts')}}{{$t('commons.example')}}:80,88
        </div>
        <!-- <div class="textbox">
      <div class="tagbox">* </div>
      支持添加多个端口范围,如:80，88，90-99，110-120  
    </div> -->
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">{{$t('commons.button.cancel')}}</el-button>
        <el-button type="primary" @click="confirmClick">{{$t('commons.button.confirm')}}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from "vue";
import type { ComponentSize, FormInstance, FormRules } from "element-plus";
import { ElMessageBox, ElMessage } from "element-plus";
import type { DrawerProps } from "element-plus";
import { Api } from "@/api/Api";
import { log } from "console";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const drawer2 = ref(false);
const direction = ref<DrawerProps["direction"]>("rtl");
const radio1 = ref("Option 1");
const ruleForm = ref({
  id: "",
  direction: "in", // 规则方向 "in" 或 "out"
  protocol: "tcp", //协议类型 "tcp", "udp", "icmp"
  ips: "", // 支持多个 IP 地址或子网
  ports: "", //支持多个端口
  state: 1, // 默认为启用状态
  remark: "", //备注
  strategy: "allow", //策略类型 "allow", "deny"
});
const ruleFormRef = ref<FormInstance>();
const rules = ref<FormRules>({
  protocol: [{ required: true, message: t('commons.rule.protocol'), trigger: "change" }],
  ports: [
    { required: true, message: t('commons.rule.port'), trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        const portPattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
        if (!value || portPattern.test(value)) {
          callback();
        } else {
          callback(new Error(t('commons.rule.port')));
        }
      },
      trigger: "blur",
    },
  ],
  ips: [
    {
      validator: (rule, value, callback) => {
        if (ruleForm.value.ips === "true") {
          if (!ipsdata.value) {
            callback(new Error(t('commons.rule.ip')));
            return;
          }
          // 修改后的正则表达式，支持 IP 范围
          const ipPattern =
            /^((\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?|(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3})(,((\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?|(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}))*$/;
          if (!ipPattern.test(ipsdata.value)) {
            callback(new Error(t('commons.rule.ip')));
            return;
          }
          // 进一步验证 IP 范围的合理性
          const ipSegments = ipsdata.value.split(",");
          for (const segment of ipSegments) {
            if (segment.includes("-")) {
              const [startIp, endIp] = segment.split("-");
              const startIpParts = startIp.split(".").map(Number);
              const endIpParts = endIp.split(".").map(Number);
              for (let i = 0; i < 4; i++) {
                if (startIpParts[i] > endIpParts[i]) {
                  callback(new Error("IP范围格式不正确,起始IP不能大于结束IP"));
                  return;
                }
              }
            }
          }
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  strategy: [{ required: true, message: t('commons.rule.policyType'), trigger: "change" }],
  direction: [{ required: true, message: t('commons.rule.direction'), trigger: "change" }],
  state: [{ required: true, message: t('commons.rule.state'), trigger: "change" }],
});
const ipsdata = ref("");
const isValidPorts = ref(true);

const validatePorts = (value: string) => {
  const portPattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
  isValidPorts.value = portPattern.test(value);
};

const handleClose = (done: () => void) => {
  ElMessageBox.confirm("Are you sure you want to close this?")
    .then(() => {
      done();
    })
    .catch(() => {
      // catch error
    });
};
const options = ref([]);
const locationOptions = ref([]);
const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate((valid) => {
    if (valid) {
      console.log("submit!");
    } else {
      console.log("error submit!");
    }
  });
};
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};
const cancelClick = () => {
  drawer2.value = false;
  emit("close", false);
};

const props = defineProps({
  type: {
    type: Boolean,
    default: true, // true 为新增，false 为修改
  },
  formData: {
    type: Object,
    default: () => ({}),
  },
});

// 监听 formData 变化，更新表单数据
watch(
  () => props.formData,
  (newVal) => {
    if (!props.type && newVal) {
      // 修改模式且有数据时
      ruleForm.value = {
        ...ruleForm.value,
        ...newVal,
      };
      // 如果有 ips 数据，设置为部分 IP 模式
      if (newVal.ips) {
        ruleForm.value.ips = "true"; // 设置为部分 IP 模式
        ipsdata.value = newVal.ips; // 将 ips 值赋给 ipsdata
      } else {
        ruleForm.value.ips = ""; // 设置为全部 IP 模式
        ipsdata.value = ""; // 清空 ipsdata
      }
    }
  },
  { immediate: true }
);

// 监听 type 变化，确保新增时 state 为 1
watch(
  () => props.type,
  (newVal) => {
    if (newVal) {
      // 新增模式
      ruleForm.value.state = 1;
    }
  },
  { immediate: true }
);

// 定义 emit
const emit = defineEmits(["close"]);

function confirmClick() {
  if (!ruleFormRef.value) return;

  ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 构建请求数据，新增时不传id
        const { id, direction, protocol, ports, state, remark, strategy } =
          ruleForm.value;
        const requestData = {
          direction,
          protocol,
          ports,
          state,
          remark,
          strategy,
          id: props.type ? undefined : id,
          ips: ruleForm.value.ips === "true" ? ipsdata.value : "",
        };

        let res;
        if (props.type) {
          const data = await Api.addFirewallRule(requestData);
          res = data;
        } else {
          // 修改接口
          const { data } = await Api.updateFirewallRule(requestData);
          res = data;
        }
        if (res.code === 0) {
          ElMessage.success(props.type ? "添加成功" : "修改成功");
          drawer2.value = false;
          emit("close", false); // 通知父组件关闭并刷新
        } else {
          ElMessage.error(
            res.message || (props.type ? "添加失败" : "修改失败")
          );
        }
      } catch (error) {
        ElMessage.error("操作失败");
      }
    }
  });
}
</script>

<style scoped>
.tagbox {
  color: #ff4848;
  font-size: 12px;
  margin-right: 4px;
}
.textbox {
  height: 32px;
  display: flex;
  font-weight: 400;
  font-size: 12px;
}
.firewall-dialog-header-title-text {
  font-size: 18px;
}
/* .firewall-dialog-header{
  padding: 20px !important;
  background: #F1F2F6  !important;
  border-radius: 6px 6px 0 0 !important;
} */
/* Dialog 样式 */
/* :deep(.el-dialog) {
  margin: 0 !important;
  padding:0;
  background: #F1F2F6  !important;
  border-radius: 6px 6px 0 0 !important;
}
:deep(.el-dialog__header) {
  margin: 0 !important;
  padding: 20px !important;
  background: #F1F2F6  !important;
  border-radius: 6px 6px 0 0 !important;
}
:deep(.show-close) {
  margin: 0 !important;
  padding: 20px !important;
  background: #F1F2F6 !important;
  border-radius: 6px 6px 0 0 !important;
}
:deep(.el-dialog__title) {
  font-size: 16px !important;
  font-weight: 500 !important;
  color: #333 !important;
} */
</style>
