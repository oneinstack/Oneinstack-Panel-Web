<template>
  <el-collapse v-model="activeNames" @change="handleChange">
    <el-collapse-item :title="t('Panel')" name="1" :icon="CaretRight">
      <div>
        Operation feedback: enable the users to clearly perceive their
        operations by style updates and interactive effects;
      </div>
      <div>
        Visual feedback: reflect current state by updating or rearranging
        elements of the page.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('System')" name="2" :icon="CaretRight" >
      <div>
        Simplify the process: keep operating process simple and intuitive;
      </div>
      <div>
        Definite and clear: enunciate your intentions clearly so that the
        users can quickly understand and make decisions;
      </div>
      <div>
        Easy to identify: the interface should be straightforward, which helps
        the users to identify and frees them from memorizing and recalling.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('Unable')" name="3" :icon="CaretRight">
      <div>
        Decision making: giving advices about operations is acceptable, but do
        not make decisions for the users;
      </div>
      <div>
        Controlled consequences: users should be granted the freedom to
        operate, including canceling, aborting or terminating current
        operation.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('ViewAccountPassword')" name="4" :icon="CaretRight">
      <div>
        Decision making: giving advices about operations is acceptable, but do
        not make decisions for the users;
      </div>
      <div>
        Controlled consequences: users should be granted the freedom to
        operate, including canceling, aborting or terminating current
        operation.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('Offline')" name="5" :icon="CaretRight">
      <div>
        Decision making: giving advices about operations is acceptable, but do
        not make decisions for the users;
      </div>
      <div>
        Controlled consequences: users should be granted the freedom to
        operate, including canceling, aborting or terminating current
        operation.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('homeMade')" name="6" :icon="CaretRight">
      <div>
        Decision making: giving advices about operations is acceptable, but do
        not make decisions for the users;
      </div>
      <div>
        Controlled consequences: users should be granted the freedom to
        operate, including canceling, aborting or terminating current
        operation.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('InstallationFailure')" name="7" :icon="CaretRight">
      <div>
        Decision making: giving advices about operations is acceptable, but do
        not make decisions for the users;
      </div>
      <div>
        Controlled consequences: users should be granted the freedom to
        operate, including canceling, aborting or terminating current
        operation.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('PanelPrompt')" name="8" :icon="CaretRight">
      <div>
        Decision making: giving advices about operations is acceptable, but do
        not make decisions for the users;
      </div>
      <div>
        Controlled consequences: users should be granted the freedom to
        operate, including canceling, aborting or terminating current
        operation.
      </div>
    </el-collapse-item>
    <el-collapse-item :title="t('Network')" name="10" :icon="CaretRight">
      <div>
        Decision making: giving advices about operations is acceptable, but do
        not make decisions for the users;
      </div>
      <div>
        Controlled consequences: users should be granted the freedom to
        operate, including canceling, aborting or terminating current
        operation.
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup>
  import {ref} from'vue';
  import { CaretRight } from '@element-plus/icons-vue'
  import {
    useI18n
  } from 'vue-i18n'
  const {
    t
  } = useI18n()
  const activeNames = ref([]); // 绑定当前展开的面板名称

  const handleChange = (value) => {
    activeNames.value = value; // 更新当前选中的面板名称
  };
</script>

<style scoped lang="scss">


  ::v-deep(.el-collapse-item__header) {
     color: #686868;
     font-size: 20px !important;
     font-weight: 400;
     line-height: 22px;
     text-align: left;
   }
  ::v-deep(.el-collapse-item__arrow ){
    margin: 0 8px 0;
  }
  /* 选中时的标题样式 */
  ::v-deep(.el-collapse-item__header.is-active) {
    color: var(--footer-button); /* 金色 */
    font-weight: 400; /* 可选：加粗 */
  }
  html[lang="en"] {
  }


</style>
