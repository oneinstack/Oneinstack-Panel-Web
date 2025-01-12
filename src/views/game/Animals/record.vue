<template>
    <x-page>
        <template #title>
            Record
        </template>
        <div class="record">
            <div class="record-item" v-for="(item, index) in 3" :key="index">
                <div class="title">
                    <div class="issue">
                        202501080682
                        <div class="type">1st</div>
                    </div>
                    <div class="status" :class="{ 'success': index == 2 }">{{ index == 2 ? 'Success' : 'Failed' }}</div>
                </div>
                <div class="content">
                    <div class="line">MyGuess: <span :class="{ 'success': index == 2 }">Freshippo</span></div>
                    <div class="line">Points: <span>20</span></div>
                    <div class="line">Result: <span>Exiaobao</span></div>
                    <div class="time">01/08/2025 11:31:32</div>
                </div>
            </div>
        </div>
    </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue';


const conf = reactive({

})
</script>
<style lang="less" scoped>
.record {
    padding: 20rem;

    .record-item {
        background: #fff;
        border-radius: 16rem;
        margin-bottom: 20rem;

        .title {
            padding: 20rem 30rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2rem solid #E4E4E4;

            .issue {
                display: flex;
                align-items: center;
                color: #666;
                font-size: 25rem;

                .type {
                    color: #333;
                    margin-left: 20rem;
                }
            }

            .status {
                color: #333;
                font-size: 28rem;
            }

            .success {
                color: #E02F35;
            }
        }

        .content {
            padding: 20rem 30rem;

            .line {
                color: #999;
                font-size: 28rem;
                margin-bottom: 10rem;

                span {
                    color: #333;
                    font-size: 500;
                }

                .success {
                    color: #E02F35;
                }
            }

            .time {
                font-size: 22rem;
                color: #999;
                margin-top: 20rem;
            }
        }

    }
}
</style>