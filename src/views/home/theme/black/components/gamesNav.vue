<template>
    <div class="games-title" v-scroll>
        <template v-for="(item, index) in conf.navList" :key="index">
            <div class="games-name" :class="{ 'games-active': conf.gamesIndex == item.type }"
                @click="conf.changeNav(item.type)">
                <img class="type-img" :src="`/static/img/home/black/${item.imgName}.png`" />
                <div class="name">{{ item.name }}</div>
            </div>
        </template>
    </div>
</template>
<script setup lang="ts">
import i18n from '@/lang';
import { onMounted, reactive } from 'vue';

const emit = defineEmits(['change'])

const conf = reactive({
    gamesIndex: '',
    navList: [
        {
            name: i18n.t('home.allGame'),
            url: '/user/casino/index?type=Games',
            type: '',
            imgName: 'all'
        },
        {
            name: i18n.t('home.games'),
            url: '/user/casino/index?type=Games',
            type: 'Games',
            imgName: 'slots'
        },
        {
            name: i18n.t('home.live'),
            url: '/user/casino/index?type=Live',
            type: 'Live',
            imgName: 'Casino'
        },
        {
            name: i18n.t('home.chess'),
            url: '/user/casino/index?type=Chess',
            type: 'Chess',
            imgName: 'chess'
        },
        {
            name: i18n.t('home.fish'),
            url: '/user/casino/index?type=Fishing',
            type: 'Fishing',
            imgName: 'fish'
        },
        {
            name: 'Popilar',
            url: '/user/casino/index?type=Fishing',
            type: 'Popilar',
            imgName: 'Popilar'
        }
    ],
    changeNav(type: any) {
        // if (type == conf.gamesIndex) return
        if (!Array.isArray(type)) conf.gamesIndex = type
        emit('change', type)
    },
})

onMounted(() => {
    conf.gamesIndex = conf.navList[0].type
    conf.changeNav(conf.navList)
})

</script>

<style lang="less" scoped>
.games-title {
    display: flex;
    align-items: center;
    color: #BFBFBF;
    font-size: 24rem;

    .games-name {
        margin-right: 20rem;
        display: flex;
        align-items: center;
        flex-shrink: 0;

        .type-img {
            height: 24rem;
            width: 24rem;
            margin-right: 10rem;
        }
    }

    .games-active {
        background: #394143;
        padding: 15rem 12rem;
        border-radius: 14rem;
        color: #FFF;
    }
}
</style>