<template>
    <div class="info">
        <img class="logo-img" src="/static/img/home/black/logo-img.png" />
        <div class="wallet">
            <div class="w-money">
                <div class="money">
                    <img class="cion-img" src="/static/img/home/black/profit.png" />
                    <span>20.00</span>
                </div>
                <van-icon size="24rem" color="#bfbfbf" name="arrow-down" />
            </div>
            <div class="w-btn">
                <greenBtn>
                    <span style="font-size: 36rem;">+</span>
                </greenBtn>
            </div>
        </div>
        <div class="nav">
            <div class="nav-item">
                <img class="nav-img" src="/static/img/home/black/notice.png" />
            </div>
            <div class="line"></div>
            <div class="nav-item">
                <img class="nav-img" src="/static/img/home/black/gift.png" />
            </div>
            <div class="badge">2</div>
        </div>
        <img class="user-img" src="/static/img/default-header.png" />
    </div>
</template>
<script setup lang="ts">
import greenBtn from './greenBtn.vue';
</script>
<style lang="less" scoped>
.info {
    height: 104rem;
    display: flex;
    align-items: center;
    width: 100%;

    .logo-img {
        height: 60rem;
    }
    .wallet{
        display: flex;
        align-items: center;
        border: 4rem solid #FFFFFF1A;
        height: 70rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16rem;
        margin: 0rem 20rem;
        flex: 1;
        padding-right: 2rem;
        .w-money{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16rem;
            flex: 1;
            .money{
                display: flex;
                align-items: center;
                color: #fff;
                font-size: 28rem;
                .cion-img{
                    height: 30rem;
                    margin-right: 16rem;
                    border-radius: 2rem;
                }
            }
        }
        .w-btn{
            width: 56rem;
            height: 56rem;
        }
    }
    .nav{
        display: flex;
        align-items: center;
        height: 70rem;
        width: 140rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16rem;
        position: relative;
        margin-right: 50rem;
        .nav-item{
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            .nav-img{
                height: 36rem;
                width: 36rem;
            }
        }
        .line{
            background: rgba(255, 255, 255, 0.1);
            width: 2rem;
            height: 40rem;
        }
        .badge{
            position: absolute;
            top: 0rem;
            right: -25rem;
            background: #9FE871;
            padding: 2rem 14rem;
            border-radius: 8rem;
            color: #1F1F1F;
            font-size: 18rem;
        }
    }
    .user-img{
        width: 64rem;
        height: 64rem;
        border-radius: 50%;
    }
}
</style>