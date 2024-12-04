<script setup lang="ts">
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import selfInfo from "./self-info.vue"

interface Amount {
  /** 单位 */
  unit: string
  /** 总数 */
  total: number | string
  /** 剩余 */
  pending: number | string
}

interface Props {
  amount: Amount
}

withDefaults(defineProps<Props>(), {
  amount: () => ({ unit: '', total: 0, pending: 0 })
})

async function hanldeCopyLink() {
  const userInvitationCode = sconfig.userInfo.userInvitationCode.toUpperCase()
  await StrUtil.copyText(location.origin + '/#/register?code=' + userInvitationCode)
  System.toast(i18n.t('invite.CopySuccessful'), 'success')
}
</script>

<template>
  <div class="share-link">
    <div class="tips">
      <span>
        {{ $t('luckyWheel.shareLinkTip') }}
      </span>
    </div>
    <div class="card">
      <selfInfo />
      <div class="subTitle">
        {{
          $t('luckyWheel.shareLinkShortOf', {
            amount: `${amount.unit}${amount.unit.length > 3 ? ' ' : ''}${amount.total}`
          })
        }}
      </div>
      <div class="current-amount" style="margin-top: 32rem">
        <span class="unit">{{ amount.unit }}</span>
        <span>{{ amount.pending }}</span>
      </div>
      <div class="button primary" @click.stop="hanldeCopyLink">{{ $t('luckyWheel.shareLink') }}</div>
      <!-- <div class="button" @click.stop="hanldeCopyLink">Copy link</div> -->
    </div>
  </div>
</template>

<style scoped lang="less">
.current-amount {
  padding-top: 64rem;
  text-align: center;
  font-size: 96rem;
  font-weight: 600;
  color: #ef1017;

  .unit {
    font-size: 40rem;
  }
}

.share-link {
  width: 572rem;

  .tips {
    width: 100%;
    font-size: 40rem;
    font-weight: 600;
    text-align: center;
    color: #fef3d2;
    margin-bottom: 90rem;
  }

  .card {
    padding: 84rem 44rem 60rem;
    width: 100%;
    height: 662rem;
    border-radius: 32rem;
    background-color: #fff;
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
  }

  .subTitle {
    text-align: center;
    font-size: 30rem;
    font-weight: 500;
    color: #cd5e2c;
  }

  .button {
    margin-top: 36rem;
    height: 88rem;
    border-radius: 74rem;
    border: 1px solid #ff7502;
    color: #ff7502;
    font-size: 40rem;
    font-weight: 500;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
      color: #fff;
    }
  }
}
</style>
