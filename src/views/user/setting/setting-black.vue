<template>
    <x-page :headerBgColor="conf.bgcolor" :topfill="false" backColor="#1F3E30" pageType="black">
        <!-- 顶部个人信息 -->
        <topInfo />
        <div></div>
        <div class="content">
            <div class="total-tilte flex-b-c">
                <div class="l-name">
                    <img src="/static/img/home/black/ct-money.png" />
                    <span>Total Amount</span>
                </div>
                <div>$0.00</div>
            </div>
            <div class="menu-box">
                <div class="top-btn">
                    <div class="btn-item">
                        <greenBtn @click="conf.handle({ url: '/user/wallet/Recharge' })">
                            <div class="btn-txt">
                                <img src="/static/img/home/black/ct-deposit.png" />
                                <span>Deposit</span>
                            </div>
                        </greenBtn>
                    </div>
                    <div class="btn-item flex-center btn-with" @click="conf.handle({ url: '/user/wallet/withDraw' })">
                        <div class="btn-txt">
                            <img src="/static/img/home/black/ct-with.png" />
                            <span>Withdrawal</span>
                        </div>
                    </div>
                </div>
                <div class="change-list">
                    <template v-for="item in conf.blackMenuList.slice(0, 4)" :key="item.name">
                        <div class="change-item" @click="conf.handle(item)">
                            <img :src="`/static/img/home/black/${item.imgUrl}.png`" />
                            <span>{{ item.name }}</span>
                        </div>
                    </template>
                </div>
            </div>
            <div class="menu-box">
                <template v-for="item in conf.blackMenuList.slice(4, 7)" :key="item.name">
                    <div style="height: 80rem;" @click="conf.handle(item)">
                        <menuItem :menuInfo="item" />
                    </div>
                </template>
            </div>
            <div class="menu-box">
                <template v-for="item in conf.blackMenuList.slice(7, 11)" :key="item.name">
                    <div style="height: 80rem;" @click="conf.handle(item)">
                        <menuItem :menuInfo="item" />
                    </div>
                </template>
            </div>
            <div class="menu-box">
                <div class="gift">
                    <img class="gift-img" src="/static/img/home/black/ct-gift.png" />
                    <div class="gift-box">
                        <div>Referral & get <span style="color: #fff;">$86,626.20 + 25%</span> commission</div>
                        <div class="website flex-b-c">
                            <div class="url">
                                <span>{{ conf.hrefUrl.slice(0, 4) }}</span>
                                <van-text-ellipsis :content="conf.hrefUrl.slice(4)" />
                            </div>
                            <div class="copy flex-center" @click="conf.copyTxt">Copy</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="menu-box" v-for="item in conf.blackMenuList.slice(11)" :key="item.name">
                <div style="height: 80rem;" @click="conf.handle(item)">
                    <menuItem :menuInfo="item" />
                </div>
            </div>

            <div class="out flex-center" @click="conf.goOutLogin">
                <img class="gift-img" src="/static/img/home/black/login-out.png" />
                <span>Sign Out</span>
            </div>
        </div>
        <!-- 多语言和主题弹框 -->
        <van-popup class="popup-bottom-center" :show="conf.popup.show && conf.popup.type != 'wallet'" position="bottom"
            borderRadius='16' :round="true" @close="conf.popup.close">
            <div v-if="conf.popup.type == 'lang'" class="popup-content">
                <div class="title flex-center">
                    <span>{{ $t('me.switchLanguage') }}</span>
                    <div class="arrow flex-center" @click.stop="conf.popup.close">
                        <van-icon size="28rem" color="#fff" name="cross" />
                    </div>
                </div>
                <div class="select-list">
                    <template v-for="item of conf.langArr" :key="item.id">
                        <div class="select-item flex-b-c" :class="{ 'select-active': item.id == conf.language }"
                            @click="conf.changeLang(item)">
                            <div class="lang-left">
                                <img class="left-img" :src="`/static/img/me/${item.id}.png`" />
                                <span>{{ item.name }}</span>
                            </div>
                            <div class="icon"></div>
                        </div>
                    </template>
                </div>
            </div>
            <div v-else-if="conf.popup.type == 'theme'" class="popup-content">
                <div class="title flex-center">
                    <span>{{ $t('me.Theme') }}</span>
                    <div class="arrow flex-center" @click.stop="conf.popup.close">
                        <van-icon size="28rem" color="#fff" name="cross" />
                    </div>
                </div>
                <div class="select-list">
                    <template v-for="item of conf.themeArr" :key="item.id">
                        <div class="select-item flex-b-c" :class="{ 'select-active': item.id == conf.currentTheme }"
                            @click="conf.changeTheme(item)">
                            <span>{{ $t(item.name) }}</span>
                            <div class="icon"></div>
                        </div>
                    </template>
                </div>
            </div>
            <div v-else-if="conf.popup.type == 'refer'" class="popup-content">
                <div class="title flex-center">
                    <span></span>
                    <div class="arrow flex-center" @click.stop="conf.popup.close">
                        <van-icon size="28rem" color="#fff" name="cross" />
                    </div>
                </div>
                <refer />
            </div>
        </van-popup>

        <!-- 选择默认钱包 -->
        <coinPopup :show="conf.popup.type == 'wallet'" :dataArr="conf.walletList" :selectId="conf.defaultWallet.id"
            @close="conf.popup.close" @change="conf.handleDefaultwallet" />
    </x-page>
</template>
<script setup lang="ts">
import topInfo from './com/blackTop.vue';
import menuItem from '@/views/home/theme/black/components/menuItem.vue';
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue';
import coinPopup from '../wallet/com/black/coinPopup.vue';
import refer from './com/refer.vue';
import { index } from './index'
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';
import stheme from '@/sstore/stheme';
const conf = index()
const event = Scope.Event()
event.on(EPage.scroll, (e) => {
    if (e.top > 80) {
        conf.bgcolor = stheme.theme.black.headerBgColor()
    } else {
        conf.bgcolor = 'transparent'
    }
})
</script>
<style lang="less" scoped>
.content {
    padding: 24rem;
    margin-top: 50rem;
}

.total-tilte {
    color: #FFFFFF;
    font-size: 24rem;
    font-weight: 600;
    margin-top: 40rem;
    padding: 0rem 20rem;

    .l-name {
        display: flex;
        align-items: center;

        img {
            height: 32rem;
        }

        span {
            color: #FFFFFFB2;
            margin-left: 10rem;
        }
    }
}

.menu-box {
    border-radius: 16rem;
    background: #323738;
    margin-top: 20rem;
    padding: 20rem;
    font-size: 24rem;
    font-weight: 600;
}

.top-btn {
    display: flex;

    .btn-item {
        flex: 1;
        height: 68rem;

        .btn-txt {
            display: flex;
            align-items: center;
            font-size: 28rem;
            font-weight: 600;

            img {
                height: 32rem;
                margin-right: 12rem;
            }
        }
    }

    .btn-with {
        background: #3A4142;
        border-radius: 12rem;
        margin-left: 24rem;
        color: #fff;
    }
}

.change-list {
    display: flex;
    margin-top: 40rem;

    .change-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        img {
            height: 40rem;
        }

        span {
            margin-top: 20rem;
            font-size: 24rem;
            color: #fff;
            font-weight: 600;
        }
    }
}

.gift {
    display: flex;
    align-items: center;

    .gift-img {
        height: 102rem;
        margin-right: 10rem;
    }

    .gift-box {
        font-size: 24rem;
        color: #B2BDC0;
        flex: 1;

        .website {
            background: #292D2E;
            border: 1px solid #383E3E;
            border-radius: 14rem;
            height: 80rem;
            display: flex;
            width: 100%;
            padding: 0rem 16rem;
            margin-top: 10rem;

            .url {
                display: flex;

                span {
                    color: #1CF187;
                }
            }

            .copy {
                background: #373E3F;
                height: 52rem;
                border-radius: 12rem;
                padding: 0rem 10rem;
                color: #fff;
                font-weight: 600;
            }
        }
    }
}

.out {
    color: #fff;
    font-size: 28rem;
    margin-top: 60rem;

    img {
        height: 40rem;
        font-weight: 700;
        margin-right: 16rem;
    }
}

.popup-content {
    background: #232626;

    .title {
        height: 100rem;
        color: #fff;
        font-size: 28rem;
        position: relative;

        .arrow {
            position: absolute;
            right: 24rem;
            top: calc(50% - 28rem);
            width: 48rem;
            height: 48rem;
            background: #464F50;
            border-radius: 12rem;
            z-index: 2;
        }
    }

    .select-list {
        padding: 0 24rem 24rem;

        .select-item {
            height: 90rem;
            padding: 0rem 16rem;
            color: #fff;
            font-size: 26rem;
            margin-bottom: 10rem;

            .lang-left {
                display: flex;
                align-items: center;

                .left-img {
                    height: 42rem;
                    margin-right: 20rem;
                }
            }

            .icon {
                border: 3rem solid #36393A;
                width: 40rem;
                height: 40rem;
                border-radius: 50%;
            }
        }

        .select-active {
            background: #323738;
            border-radius: 12rem;

            .icon {
                border: 8rem solid #1CF187;
            }
        }
    }
}
</style>