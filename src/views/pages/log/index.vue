<script setup lang="ts">
import CardTabs from "@/components/card-tabs.vue";
import { reactive } from "vue";
import Panel from "./components/panel.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const conf = reactive({
  list: [
    {
      name: t("log.panel"),
      index: 0,
      component: Panel,
    },
    {
      name: t('log.website'),
      index: 1,
    },
    {
      name: t('log.audit'),
      index: 2,
    },
    {
      name: t('log.ssh'),
      index: 3,
    },
    {
      name: t('log.software'),
      index: 4,
    },
  ],
  activeIndex: 0,
  clickActive: (item: any) => {
    conf.activeIndex = item.index;
  },
});
</script>

<template>
  <div class="log-container">
    <card-tabs
      :list="conf.list"
      :active-index="conf.activeIndex"
      :click-active="conf.clickActive"
    />
    <component :is="conf.list[conf.activeIndex].component" />
  </div>
</template>

<style scoped lang="less"></style>
