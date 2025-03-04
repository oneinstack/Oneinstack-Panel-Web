<template>
    <van-popup class="popup-bottom-center" :show="show" position="bottom" borderRadius='16' :round="true"
        @close="emit('close')">
        <div class="popup-content">
            <div class="title flex-center">
                <span>Select</span>
                <div class="arrow flex-center" @click.stop="emit('close')">
                    <van-icon size="28rem" color="#fff" name="cross" />
                </div>
            </div>
            <div class="transfer-content">
                <div class="lable">Amount</div>
                <div class="t-item flex-b-c">
                    <input
                        class="input"
                        inputmode="decimal"
                        v-model="conf.changeMoney"
                        @input="conf.vfFun($event, 'changeMoney')"
                        :placeholder="$t('common.PleaseEnter')"
                    />
                    <div class="r-arrow flex-center" @click="conf.walletShow = false">
                        <div class="r-name">
                            <img src="/static/img/USDT.png" v-if="conf.defaultItem.walletCoin == 'USDT'" />
                            <img :src="conf.defaultItem.nationalFlag" v-else />
                            <span>{{ conf.defaultItem.coinCode }}</span>
                        </div>
                        <van-icon size="24rem" color="#fff" name="arrow-down" />
                    </div>
                </div>
                <div class="lable">Available: <span style="color: #fff;">{{ defaultCoin.coinSymbol + '' + tableData.totalBalance }}</span></div>
                <div class="lable flex-b-c" style="margin-top: 50rem;">
                    <span>Daily real-time return:</span>
                    <div class="l-txt">
                        <span>0INRFIAT</span>
                        <div class="odds">APR 5%</div>
                    </div>
                </div>
                <div class="transfer-btn">
                    <greenBtn @click="conf.submit">
                        <span style="font-size: 32rem;">{{ active ? 'Withdraw to Wallet' : 'Transfer to Fortune'}}</span>
                    </greenBtn>
                </div>
            </div>
        </div>
    </van-popup>
    <!-- 钱包选择 -->
    <coinPopup :show="conf.walletShow" :dataArr="conf.walletArr" :selectId="conf.defaultItem.id" @close="conf.walletShow = false"
        @change="conf.changeCoin" />
</template>

<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue';
import coinPopup from '../../wallet/com/black/coinPopup.vue';
import { computed, onMounted, reactive, watch } from 'vue';
import i18n from '@/lang';
import System from '@/utils/System';
import sconfig from '@/sstore/sconfig';
import { apis } from '@/api';
import svf from '@/sstore/svf';


const props = defineProps({
    show: {
        default: false
    },
    walletlist: {
        default: [] as any[]
    },
    defaultCoin: {
        default: (): any => { }
    },
    active: {
        default: 0
    },
    tableData: {
        default: (): any => {}
    }
})

const emit = defineEmits(['close', 'change'])

const conf = reactive({
    walletShow: false,
    changeMoney: '' as any,
    walletArr: [] as any[],
    defaultItem: {} as any,
    vf: {} as any,
    //金额输入事件
    vfFun: (e: any, name: string) => {
      conf.vf[name](e)
      if (props.active == 0 && parseFloat(conf.changeMoney) > parseFloat(conf.defaultItem.walletMoney)) {
        conf.changeMoney = conf.defaultItem.walletMoney
      } else if (props.active == 1 && parseFloat(conf.changeMoney) > parseFloat(props.tableData.totalBalance)) {
        conf.changeMoney = props.tableData.totalBalance
      }
    },
    changeCoin(e: any) {
        conf.defaultItem = e
        conf.walletShow = false
        if(props.active == 0) conf.changeMoney = Number(conf.defaultItem.walletMoney)
    },
    //请求提交 转入转出
    submit: async () => {
        let money = conf.changeMoney

        let infoTip = '',
            isShowTip = false

        if (!money) {
            isShowTip = true
            infoTip = i18n.t('common.PleaseEnter')
        }
        if (parseFloat(conf.changeMoney) == 0 && !props.active) {
            isShowTip = true
            infoTip = i18n.t('yueb.tip1')
        }

        if (parseFloat(conf.changeMoney) == 0 && props.active) {
            isShowTip = true
            infoTip = i18n.t('yueb.tip2')
        }

        if (isShowTip) {
            System.toast(infoTip)
            return
        }

        //转出的金额为负数
        if (props.active == 1) {
            // 转出
            money = '-' + conf.changeMoney
        }
        let obj = {
            uid: sconfig.userInfo.uid,
            changeMoney: Number(money)
        }

        System.loading()
        const { code } = await apis.submit({
            ...obj,
            final: () => {
            System.loading(false)
            }
        })
        System.toast(i18n.t(`code.${code}`), 'success')

        setTimeout(() => {
            emit('change')
        }, 300)
    }
})

watch(
	() => props.walletlist,
	(val: any) => {
        conf.walletArr = props.walletlist
	},
	{ deep: true }
)
watch(
	() => props.defaultCoin,
	(val: any) => {
        conf.defaultItem = props.defaultCoin 
        if(props.active == 0) conf.changeMoney = Number(conf.defaultItem.walletMoney)
	},
	{ deep: true }
)

onMounted(() => {
    conf.vf = svf.getVf(conf, {
      changeMoney: {
        float: true,
        fixed: 4
      }
    })

})

</script>

<style lang="less" scoped>
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

    .transfer-content {
        padding: 24rem;

        .lable {
            color: #BFBFBF;
            font-size: 24rem;

            .l-txt {
                display: flex;
                align-items: center;
                color: #fff;

                .odds {
                    color: #1CF187;
                    background: #2E3131;
                    border-radius: 8rem;
                    font-size: 24rem;
                    padding: 2rem 10rem;
                    margin-left: 12rem;
                }
            }
        }

        .t-item {
            background: #363B3C;
            border: 2rem solid #4B5253;
            height: 80rem;
            padding: 0rem 5rem 0rem 20rem;
            border-radius: 12rem;
            color: #fff;
            font-size: 28rem;
            font-weight: 700;
            font-family: Poppins;
            margin: 20rem 0rem 30rem;

            .r-arrow {
                padding: 0rem 20rem;
                height: 64rem;
                background: #464F50;
                border-radius: 12rem;

                .r-name {
                    display: flex;
                    align-items: center;
                    margin-right: 20rem;

                    img {
                        height: 40rem;
                        margin-right: 12rem;
                    }
                }
            }

            .input {
                flex: 1;
                font-size: 32rem;

                &::placeholder {
                    color: #BFBFBF;
                    font-size: 24rem;
                }
            }

            .disabled,
            [disabled] {
                opacity: 1 !important;
            }
        }

        .transfer-btn {
            height: 88rem;
            margin: 60rem 0rem 20rem;
        }
    }
}
</style>