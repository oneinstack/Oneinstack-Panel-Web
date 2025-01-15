<template>
    <div class="stom-item">
        <div class="sort-contant">
            <div class="light"></div>
            <div class="light light-b"></div>
            <div class="right">
                <div class="r-top"></div>
                <div class="r-bootom"></div>
                <div class="content">
                    <img class="img" :src="`/static/img/game/animal/${imgUrl}.png`" />
                    <div class="name">{{ name }}</div>
                </div>
            </div>
            <div class="num">{{ sort }}</div>
        </div>
    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    imgUrl: {
        default: ''
    },
    name: {
        default: ''
    },
    sort: {
        default: ''
    }
})

</script>

<style lang="less" scoped>
    .stom-item {
        height: 100%;
        padding: 10rem 0;
        transform: translateX(-120px);
        animation: img-animation 0.3s linear;
        margin-top: 5rem;

        .sort-contant {
            width: 175px;
            height: 100%;
            background-image: linear-gradient(90deg, rgba(222, 110, 81, 0.00) 0%, #DE6E51 56%, rgba(222, 81, 81, 0.00) 100%);
            padding: 4rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;

            .light {
                position: absolute;
                top: calc(30% - 10rem);
                right: 30px;
                width: 58px;
                height: 20rem;
                opacity: 0.39;
                background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.00) 7%, #FFFFFF 46%, rgba(255, 255, 255, 0.00) 100%);
            }

            .light-b {
                height: 15px;
                top: calc(70% - 8px);
                right: 28px;
            }

            .right {
                width: 130px;
                height: 100%;
                background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.00) 0%, rgba(255, 255, 255, 0.57) 47%, #FFFFFF 93%);
                clip-path: polygon(0 0, 82% 0, 100% 100%, 0 100%);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;

                .r-bootom {
                    width: 100%;
                    height: 50%;
                    background-image: linear-gradient(268deg, #FFFFFF 5%, rgba(255, 255, 255, 0.00) 100%);
                }

                .content {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;

                    .img {
                        height: 100%;
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px solid #FFFFFF;
                        border-radius: 50%;
                    }

                    .name {
                        font-size: 22rem;
                        color: #8C3700;
                        font-weight: 600;
                        flex: 1;
                        text-align: center;
                        padding-right: 10%;
                    }
                }
            }

            .num {
                font-family: Arial-Black;
                font-size: 60rem;
                color: #fff;
                text-shadow: 0 3px 0 rgba(0, 0, 0, 0.24);
                font-weight: 900;
                padding-right: 20rem;
            }

        }
    }
    @keyframes img-animation {
        0% {
            transform: translateX(0px);
        }

        100% {
            transform: translateX(-120px);
        }
    }
</style>