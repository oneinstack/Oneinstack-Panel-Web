<template>
    <x-page>
        <template #title>
			Rules
		</template>
        <div class="rules" v-html="conf.rules.lotteryRuleurl"></div>
    </x-page>
</template>
<script setup lang="ts">
import slottery from '@/sstore/slottery';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';


const conf = reactive({
    rules: {} as any
})

onMounted(async () => {
    const { lotteryId } = System.getRouterParams();
    const list = await slottery.findLotteryList('ANIMALS_RUNNING')
    if(lotteryId) conf.rules = list.find((v: any) => v.id == lotteryId)
})

</script>
<style lang="less" scoped>
.rules{
    padding: 20rem;
}
</style>