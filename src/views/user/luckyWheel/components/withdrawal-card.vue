<script setup lang="ts">
interface Props {
  /** 单位 */
  unit: string
  /** 金额 */
  amount: number | string
  /** 头像 */
  avatar: string
  /** 姓名 */
  name: string
}

defineProps<Props>()
</script>

<template>
  <div class="withdrawal">
    <div class="tips">
      <span>{{ $t('luckyWheel.withdrawalTip') }}</span>
    </div>
    <div class="card">
      <div class="head">
        <img src="/static/img/luckyWheel/Frame.png" alt="" />
        <span>{{ $t('luckyWheel.remittanceAmount') }}</span>
      </div>
      <div class="amount">
        <span class="unit">{{ unit }}</span>
        <span>{{ amount }}</span>
      </div>
      <div class="info">
        <div class="row">
          <span class="label">{{ $t('luckyWheel.remittanceAccount') }}</span>
          <div class="value flex items-center">
            <img :src="avatar" alt="" style="margin-right: 8rem" />
            <span>{{ name }}</span>
          </div>
        </div>
        <div class="row">
          <span class="label">{{ $t('luckyWheel.remittanceChannel') }}</span>
          <span class="value">{{ $t('luckyWheel.wallet') }}</span>
        </div>
      </div>
      <div class="btn" @click="$emit('confirm')">{{ $t('luckyWheel.confirm') }}</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.withdrawal {
  text-align: center;

  .tips {
    width: 540rem;
    font-size: 32rem;
    font-weight: 600;
    text-align: center;
    background: linear-gradient(176.58deg, #fefcf4 -47.7%, #fee394 146.5%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .card {
    margin: 32rem auto;
    padding: 48rem 40rem;
    width: 578rem;
    height: 662rem;
    border-radius: 32rem;
    background: #ffffff;
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    align-items: center;

    .head {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 30rem;
      font-weight: 500;
      gap: 8rem;

      img {
        width: 52rem;
        height: 52rem;
      }
    }

    .amount {
      font-size: 100rem;
      font-weight: 600;
      text-align: center;

      .unit {
        font-size: 40rem;
      }
    }

    .info {
      width: 100%;
      margin: 48rem auto;

      .row {
        height: 76rem;
        border-bottom: 2rem solid #f1f1f1;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .label {
          font-size: 24rem;
          font-weight: 500;
          color: #999999;
        }

        .value {
          font-size: 24rem;
          font-weight: 500;
          color: #000000;

          img {
            width: 48rem;
            height: 48rem;
            border-radius: 50%;
          }
        }
      }
    }

    .btn {
      width: 100%;
      height: 88rem;
      border-radius: 74rem;
      background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
      font-size: 40rem;
      font-weight: 500;
      line-height: 88rem;
      text-align: center;
      color: #fff;
    }
  }
}
</style>
