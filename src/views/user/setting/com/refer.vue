<template>
    <div class="refer-content">
        <div class="refer-info">
            <img class="refer-img" src="/static/theme/black/refer.png" />
            <div class="r-txt">
                <div class="r-title">REFER A FRIEND AND GET</div>
                <div class="r-num">
                    <span>$86,663.72</span>
                    <span class="add">+</span>
                    <span>15%</span>
                </div>
                <div class="com">COMMISSION</div>
                <div class="invite">Invite friends, earn money.</div>
            </div>
        </div>
        <div class="link-title">Referral link</div>
        <div class="r-website flex-b-c">
            <div class="url">
                <van-text-ellipsis :content="conf.qrcode" />
            </div>
            <div class="copy flex-center" @click="conf.handleCopy(conf.InvitationCode)">Code</div>
        </div>
        <div class="copy-btn">
            <greenBtn @click="conf.handleCopy(conf.InvitationCode)">
                <span style="font-size: 32rem;">Copy link</span>
            </greenBtn>
        </div>
    </div>
</template>
<script setup lang="ts">
import i18n from '@/lang';
import sconfig from '@/sstore/sconfig';
import System from '@/utils/System';
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue';
import { onMounted, reactive } from 'vue';

const conf = reactive({
    InvitationCode: '',
    qrcode: '', //二维码的内容链接
    hrefUrl: '',
    //复制邀请码推广链接
    handleCopy(str: any) {
      StrUtil.copyText(str)
      System.toast(i18n.t('invite.CopySuccessful'), 'success')
    },
})

const init = async () => {
    conf.InvitationCode = sconfig.userInfo.userInvitationCode.toUpperCase()
    conf.hrefUrl = location.origin
    conf.qrcode = location.origin + '/#/register?code=' + conf.InvitationCode
}
onMounted(init)
</script>
<style lang="less" scoped>
.refer-content {
    padding: 24rem;

    .refer-info {
        background: #1E2121;
        border-radius: 16rem;
        padding: 24rem;
        display: flex;
        align-items: center;
        color: #fff;
        font-size: 24rem;

        .refer-img {
            height: 220rem;
        }

        .r-txt {
            font-family: Poppins;
            font-weight: 700;
            margin-left: 30rem;

            .r-title {
                font-size: 36rem;
            }

            .r-num {
                color: #FF9820;
                font-size: 44rem;

                .add {
                    color: #fff;
                    font-size: 32rem;
                    margin: 0rem 6rem;
                }

                span:last-of-type {
                    color: #1CF187;
                }
            }

            .com {
                font-size: 32rem;
            }

            .invite {
                color: #1CF187;
                font-size: 24rem;
                font-weight: 500;
                margin-top: 20rem;
            }
        }
    }

    .link-title {
        color: #BFBFBF;
        margin: 20rem 0rem;
    }

    .r-website {
        background: #292D2E;
        border: 1px solid #383E3E;
        border-radius: 14rem;
        height: 80rem;
        display: flex;
        width: 100%;
        padding: 0rem 8rem 0rem 16rem;
        margin-bottom: 30rem;

        .url {
            color: #1CF187;
            flex: 1;
        }

        .copy {
            background: #373E3F;
            height: 68rem;
            border-radius: 12rem;
            padding: 0rem 10rem;
            color: #fff;
            font-weight: 600;
            font-size: 24rem;
        }
    }

    .copy-btn {
        height: 80rem;
        margin: 20rem 0rem;
    }
}
</style>