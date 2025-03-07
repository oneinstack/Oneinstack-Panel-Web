<template>
    <x-page :fixed="false">
        <template #title>
            {{ $t('task.mytask') }}
        </template>
        <template #top>
            <search typeName="Casino" />
        </template>
        <div class="popular">
            <div class="popular-list">
                <template v-for="item in conf.popular" :key="item.name">
                    <popularItem :item="item" />
                </template>
            </div>
        </div>
    </x-page>
</template>
<script setup lang="ts">
import popularItem from '@/views/home/theme/black/lott-com/popularItem.vue';
import search from '@/views/home/theme/black/components/search.vue';
import { reactive } from 'vue';

const conf = reactive({
    popular: [
        {
            name: 'Satta king-10Mins',
            imgUrl: 'satta',
        },
        {
            name: 'PK10-3Mins',
            imgUrl: 'pk10',
        },
        {
            name: 'Marx Six-5Mins',
            imgUrl: 'six',
        },
        {
            name: 'Welfare 3D-1Min',
            imgUrl: 'w-3d',
        }
    ]
})

</script>
<style lang="less" scoped>
.popular {
    padding: 0rem 24rem;

    .popular-list {
        display: flex;
        flex-wrap: wrap;
        padding-right: 24rem;
        margin-top: 10rem;
    }
}
</style>