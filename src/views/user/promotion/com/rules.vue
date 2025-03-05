<template>
    <div class="rule-content">
        <template v-for="item in bonusList" :key="item.imgUrl">
            <div class="deposit-item flex-b-c">
                <div class="l-name">
                    <div class="name">{{ item.lable }} Deposit Bonus</div>
                    <div class="num">{{ item.name }}</div>
                    <div class="money">Min.deposit: {{ item.money }}</div>
                </div>
                <img class="deposit-img" :src="`/static/theme/black/bonus/deposit${item.imgUrl}.png`" />
                <div class="float-num">{{ item.name }}</div>
            </div>
        </template>
        <div class="txt">
            <div class="txt-title">
                BCGAME.IM offers an outstanding bonus for <span>4 consecutive
                    deposits</span>. Each deposit earns you a higher bonus
                percentage and a higher maximum limit than the last.
                Enjoy increasing rewards with every deposit, supporting any currency of your choice. Take advantage of
                this
                opportunity
                to maximize your benefits with BCGAME.IM's generous bonuses!
            </div>
            <div class="txt-item">·The first deposit earns you<span>180%</span>(or<span>300%</span>for new registrations
                within
                7 minutes), up to a maximum of $20,000.00 or an equivalent amount in other currencies.</div>
            <div class="txt-item">·The second deposit earns you<span>240%</span>, up to a maximum of $40,000.00 or an
                equivalent
                amount in other currencies.</div>
            <div class="txt-item">·The third deposit earns you<span>300%</span>, up to a maximum of $60,000.00 or an
                equivalent
                amount in other currencies.</div>
            <div class="txt-item">·The fourth deposit earns you<span>360%</span>, up to a maximum of $100,000.00 or an
                equivalent amount in other currencies.</div>
        </div>
    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    bonusList: {
        default: ():any => []
    }
})

</script>
<style lang="less" scoped>
.rule-content {
    padding: 20rem;
    max-height: 90vh;
    overflow-y: auto;

    .deposit-item {
        background: linear-gradient(90deg, #323738 0%, #6A5F3E 100%);
        height: 128rem;
        overflow: hidden;
        padding: 0rem 30rem;
        border-radius: 16rem;
        position: relative;
        margin-bottom: 20rem;

        .l-name {
            padding-right: 30rem;
            font-family: Poppins;
            font-weight: 600;
            font-size: 24rem;
            color: #fff;

            .num {
                color: #1CF187;
                font-size: 28rem;
            }

            .money {
                color: #BFBFBF;
                font-size: 20rem;
                font-weight: 500;
            }
        }

        .deposit-img {
            height: 128rem;
        }

        .float-num {
            position: absolute;
            top: 38rem;
            right: 50rem;
            transform: skew(-20deg);
            color: #1f1f1f;
            font-family: Poppins;
            font-weight: 600;
            font-size: 24rem;
        }
    }

    .txt {
        font-weight: 600;
        font-size: 24rem;
        color: #BFBFBF;
        margin-top: 30rem;

        .txt-title {
            margin-bottom: 20rem;
            padding-right: 40rem;
        }

        span {
            color: #1CF187;
        }

        .txt-item {
            padding-left: 40rem;
            padding-right: 30rem;
        }
    }
}
</style>