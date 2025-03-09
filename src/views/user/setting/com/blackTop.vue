<template>
    <div class="top-info" v-if="sconfig.userInfo">
        <img class="center-bg" src="/static/theme/black/center-bg.png" />
        <div class="user-info flex-b-c" @click="conf.handleNavigate('/user/myProfile/index')">
            <div class="l-user">
                <img class="user-img" :src="sconfig.userInfo && sconfig.userInfo.userImgUrl
                        ? sconfig.userInfo.userImgUrl
                        : '/static/img/default-header.png'" />
                <div class="name">
                    <div>{{
                        sconfig.userInfo.userNickname || sconfig.userInfo.userName || sconfig.userInfo.email ||
                        $t('me.userName')
                    }}</div>
                    <div class="uid">
                        <span>UID: {{ sconfig.userInfo.uid || '******' }}</span>
                        <div class="copy" @click="conf.copyTxt">
                            <div class="copy-drack"></div>
                        </div>
                    </div>
                </div>
            </div>
            <van-icon size="28rem" color="#fff" name="arrow" />
        </div>
        <div class="vip-box">
            <div class="vip-current">VIP{{ conf.userVipLevel }}</div>
            <div class="right-clup" @click="conf.handleNavigate('/user/vip/club')">
                <span style="margin-right: 6rem;">VIP Club</span>
                <van-icon size="24rem" color="#1CF187" name="arrow" />
            </div>
            <div class="vip-next flex-b-c">
                <div class="vip-tage">
                    <div class="finish" :style="{width: conf.gradedPercentage + '%'}">
                        <div class="icon-big flex-center">
                            <div class="icon-small"></div>
                        </div>
                    </div>
                </div>
                <div class="vip-tips">1 XP to <span>VIP1</span></div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { apis } from '@/api';
import sconfig from '@/sstore/sconfig';
import { onMounted, reactive } from 'vue';
import System from '@/utils/System'
import i18n from '@/lang';


const conf = reactive({
    gradedPercentage: 0,
    userVipLevel: 0,
    integral: '',
    copyTxt() {
      StrUtil.copyText(sconfig.userInfo.uid)
      System.toast(i18n.t('invite.CopySuccessful'), 'success')
    },
    async userGradedInfo() {
        if (!sconfig.userInfo) return
        const { data } = await apis.userGradedInfo()
        console.log(data);
        
        console.log(data);

        conf.gradedPercentage = data.gradedPercentage
        conf.userVipLevel = data.userVipLevel > data.theMax ? data.theMax : data.userVipLevel
        let n = parseFloat(data.integral)
        conf.integral = n.toFixed(2)
    },

    handleNavigate: (url:string) => {
      System.router.push(url)
    },
})

onMounted(() => {
    conf.userGradedInfo()
})

</script>
<style lang="less" scoped>
.top-info {
    background: linear-gradient(180deg, #204334 0%, #232626 100%);
    height: 380rem;
    position: relative;
    flex-shrink: 0;

    .center-bg {
        position: absolute;
        width: 320rem;
        height: 320rem;
        left: calc(50% - 160rem);
    }

    .user-info {
        padding: 24rem;
        margin-top: 180rem;
        position: relative;
        z-index: 2;

        .l-user {
            display: flex;
            align-items: center;

            .user-img {
                width: 100rem;
                height: 100rem;
                border-radius: 50%;
                border: 6rem solid #3A4142;
            }

            .name {
                margin-left: 20rem;
                color: #FFFFFF;
                font-size: 30rem;
                font-weight: 700;

                .uid {
                    color: #B3BEC1;
                    font-size: 24rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    margin-top: 6rem;

                    div {
                        border: 2rem solid #B3BEC1;
                        width: 18rem;
                        height: 20rem;
                        border-radius: 4rem;
                    }

                    .copy {
                        position: relative;
                        margin-left: 10rem;

                        .copy-drack {
                            position: absolute;
                            top: 2rem;
                            left: -6rem;
                            background: #B3BEC1;

                        }
                    }
                }
            }
        }
    }

    .vip-box {
        position: absolute;
        bottom: -80rem;
        left: 24rem;
        right: 24rem;
        background: #3B4747;
        border-radius: 20rem;
        padding: 20rem;
        color: #fff;

        .vip-current {
            font-size: 28rem;
        }

        .right-clup {
            position: absolute;
            top: 14rem;
            right: 0rem;
            background: #536161;
            color: #1CF187;
            font-size: 24rem;
            padding: 4rem 6rem 4rem 20rem;
            border-radius: 20rem 0rem 0rem 20rem;
            display: flex;
            align-items: center;
        }

        .vip-next {
            flex: 1;
            margin-top: 20rem;
            margin-left: 24rem;

            .vip-tage {
                width: 100%;
                height: 14rem;
                background: #2F3939;
                border-radius: 7rem;

                .finish {
                    background: #1CF187;
                    height: 100%;
                    border-radius: 7rem;
                    position: relative;

                    .icon-big {
                        background: rgba(28, 241, 135, 0.3);
                        width: 34rem;
                        height: 34rem;
                        border-radius: 50%;
                        position: absolute;
                        right: -10rem;
                        top: -10rem;

                        .icon-small {
                            background: #1CF187;
                            width: 18rem;
                            height: 18rem;
                            border-radius: 50%;
                        }
                    }
                }
            }

            .vip-tips {
                font-size: 24rem;
                flex-shrink: 0;
                margin-left: 30rem;

                span {
                    color: #FFFFFFB2;
                }
            }
        }
    }
}
</style>