<template>
    <template v-for="item in conf.list" :key="item.name">
        <div class="general-item" :style="{background: item.bg}" @click="conf.handle(item)">
            <img class="l-img" :src="`/static/theme/black/bonus/${item.imgUrl}.png`" />
            <div class="r-txt">
                <div>
                    <div class="name">{{ item.name }}</div>
                    <div class="explain" v-if="item.explain">{{ item.explain }}</div>
                    <div class="explain" v-else>
                        <div>My Holdings: <span>$0.00</span></div>
                        <div>Total Return: <span>$0.00</span></div>
                    </div>
                </div>
                <div class="btn-list flex-b-c">
                    <div class="coin flex-center" v-if="item.earn">{{ item.earn }}</div>
                    <span v-else></span>
                    <div class="btn flex-center">{{ item.btnTxt }}</div>
                </div>
            </div>
        </div>
    </template>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import { reactive } from 'vue';


const conf = reactive({
    list: [
        {
            name: 'Email Verification',
            imgUrl: 'task-email',
            explain: 'Verify your email now to protect you account.',
            earn: 'Earn $10.00INR',
            btnTxt: 'Go Verify',
            bg: 'linear-gradient(270deg, #323738 0%, #323738 57.49%, #7C582B 100%)'
        },
        {
            name: 'Phone Verification',
            imgUrl: 'task-phone',
            explain: 'Verify your phone now to protect you account.',
            earn: 'Earn $10.00INR',
            btnTxt: 'Go Verify',
            bg: 'linear-gradient(270deg, #323738 0%, #323738 57.49%, #864955 100%)'
        },
        {
            name: 'Vault Pro',
            imgUrl: 'task-vault',
            explain: '',
            earn: '',
            btnTxt: 'Transfer In',
            bg: 'linear-gradient(270deg, #323738 0%, #323738 57.49%, #723333 100%)'
        },
        {
            name: 'Task',
            imgUrl: 'task-tasks',
            explain: 'Come and complete the task to receive the relevant rewards',
            earn: '',
            btnTxt: 'Claim',
            bg: 'linear-gradient(270deg, #323738 0%, #323738 57.49%, #4C3797 100%)',
            url: '/user/tasks/tasks'
        }
    ],
    handle(item: any) {
      item.url && System.router.push(item.url)
      item.func && item.func()
    }
})

</script>
<style lang="less" scoped>
.general-item {
    padding: 20rem;
    background: linear-gradient(270deg, #323738 0%, #323738 57.49%, #7C582B 100%);
    border-radius: 20rem;
    display: flex;
    align-items: center;
    height: 260rem;
    margin-bottom: 20rem;

    .l-img {
        width: 160rem;
        height: 160rem;
    }

    .r-txt {
        margin-left: 20rem;
        font-family: Poppins;
        font-weight: 600;
        font-size: 24rem;
        color: #fff;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;

        .name {
            font-size: 28rem;
        }

        .explain {
            color: #BFBFBF;
            font-weight: 500;
            span{
                color: #fff;
            }
        }

        .btn-list {
            .coin {
                background: #2E6E50;
                height: 44rem;
                color: #1CF187;
                font-size: 20rem;
                border-radius: 40rem;
                padding: 0rem 20rem;
            }

            .btn {
                background: #3A4142;
                height: 68rem;
                border-radius: 12rem;
                padding: 0rem 12rem;
                font-size: 28rem;
                min-width: 160rem;
            }
        }
    }
}
</style>