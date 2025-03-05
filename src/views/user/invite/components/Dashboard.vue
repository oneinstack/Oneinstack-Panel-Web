<template>
  <div class="content box-one">
    <div class="title">Invite a Friend to Get</div>
    <div class="rewards-container">
      <div class="reward-item">
        <div class="amount">$1,000.00</div>
        <div class="label">Referral Rewards</div>
      </div>
      <div class="reward-item">
        <div class="amount">25%</div>
        <div class="label">Commission Rewards</div>
      </div>
    </div>
    <div class="description">
      Get $1,000.00 for each friend you invite, plus up to 25% commission on their wagers. Enjoy consistent commission, whether they win or lose, in our Casinoand Sportsbook. Start earning now!
    </div>
    <div class="referral-section">
      <div class="section-title">Referral Link</div>
      <div class="copy-container">
        <span class="link">{{conf.qrcode + mconf.userInfo?.userInvitationCode || ''}}</span>
        <button class="copy-btn" @click="conf.copyToClipboard('link')">Copy</button>
      </div>
    </div>
    <div class="referral-section">
      <div class="section-title">Referral Code</div>
      <div class="copy-container">
        <span class="code">{{mconf.userInfo?.userInvitationCode || ''}}</span>
        <button class="copy-btn" @click="conf.copyToClipboard('code')">Copy</button>
      </div>
    </div>
    <!-- <div class="social-share">
      <div class="share-title">Share via socials</div>
      <div class="share-buttons">
        <button v-for="platform in socialPlatforms" :key="platform.name" class="share-btn" @click="share(platform)">
          <img :src="platform.icon">
        </button>
      </div>
    </div>
    <div class="terms">
      <a href="#" class="terms-link">Referral Terms & Conditions</a>
    </div> -->
  </div>

  <div class="content box-two">
    <div class="stats-container">
      <div class="stat-item">
        <div class="icon">
          <img src="@public/static/theme/black/totalReward.png" alt="">
        </div>
        <div class="label">Total Reward</div>
        <div class="value">{{ conf.totalReward }}</div>
      </div>
      <div class="stat-item">
        <div class="icon">
          <img src="@public/static/theme/black/totalFriends.png" alt="">
        </div>
        <div class="label">Total Friends</div>
        <div class="value">{{ conf.totalFriends }}</div>
      </div>
    </div>
  </div>


  <div class="content box-three">
    <div class="rewards-container">
      <div class="reward-item">
        <div class="icon">
          <img src="@public/static/theme/black/referralReward.png" alt="">
        </div>
        <div class="label">Referral Reward</div>
        <div class="amount">{{ conf.referralReward }}</div>
      </div>
      <div class="reward-item">
        <div class="icon">
          <img src="@public/static/theme/black/commissionReward.png" alt="">
        </div>
        <div class="label">Commission Rewards</div>
        <div class="amount">{{ conf.commissionReward }}</div>
      </div>
    </div>
  </div>

  <div class="content box-four">
    <div class="live-rewards">
      <div class="header">
        <div class="title">
          <div class="dot"></div>
          Live Rewards
        </div>
      </div>
      <div class="total-reward">
        <div class="label">Total Reward Sent To-Date</div>
        <div class="amount">{{ conf.totalReward }}</div>
      </div>
      <div class="rewards-list">
        <div v-for="(reward, index) in conf.rewardsList" :key="index" class="reward-item">
          <div class="user">{{ reward.username }}</div>
          <div class="reward">
            {{ reward.amount > 0 ? '+' : '' }}{{ reward.amount }}
            <img src="" alt="">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Scope } from 'tools-vue3'
import { index } from './Dashboard'
const conf = index()

const mconf = Scope.getConf()
</script>

<style scoped lang="less">
.content {
  background: #323738;
  border-radius: 20rem;
  padding: 40rem 24rem;
  color: #FFFFFF;
  font-size: 24rem;
  line-height: 34rem;
}

.box-one{
  margin-top: 32rem;

  .title {
    font-family: Poppins;
    font-weight: 600;
    font-size: 32rem;
    line-height: 48rem;
  }

  .rewards-container {
    display: flex;
    gap: 20px;
    margin-top: 20rem;

    .reward-item {
      flex: 1;

      &:first-child {
        border-right: 2rem solid #3B4041
      }
      .amount {
        color: #1CF187;
        font-family: Poppins;
        font-weight: 600;
        font-size: 36rem;
        line-height: 54rem;
        letter-spacing: 0%;

      }

      .label {
        font-family: PingFang SC;
        font-weight: 600;
        // font-size: 24rem;
        // line-height: 34rem;
        letter-spacing: 0%;
      }
    }
  }

  .description {
    font-family: PingFang SC;
    font-weight: 500;
    // font-size: 24rem;
    // line-height: 34rem;
    letter-spacing: 0%;
    margin-top: 20rem;
    color: #BFBFBF;
  }

  .referral-section {
    margin-top: 20rem;

    .section-title {
      color: #BFBFBF;
      font-family: PingFang SC;
      font-weight: 600;
      // font-size: 24rem;
      // line-height: 34rem;
      letter-spacing: 0%;
    }

    .copy-container {
      margin-top: 12rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #3A4142;
      height: 72rem;
      border-radius: 20rem;
      font-family: PingFang SC;
      font-weight: 600;
      // font-size: 24rem;
      // line-height: 34rem;
      letter-spacing: 0%;
      color: #FFFFFF;

      .link,.code{
        margin-left: 24rem;
      }

      .copy-btn {
        margin-right: 6rem;
        height: 56rem;
        border-radius: 16rem;
        background: #4A5354;
        padding: 0 6rem;
      }
    }
  }

  .social-share {
    margin-top: 32rem;
    .share-title {
      font-family: PingFang SC;
      font-weight: 600;
      letter-spacing: 0%;
      text-align: center;
    }

    .share-buttons {
      display: flex;
      gap: 18rem;
      flex-wrap: wrap;
      margin-top: 20rem;

      .share-btn {
        width: 56rem;
        height: 56rem;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 56rem;
          height: 56rem;
          border-radius: 50%;
        }
      }
    }
  }

  .terms {
    margin-top: 40rem;
    text-align: center;

    .terms-link {
      color: #1CF187;
      font-family: Poppins;
      font-weight: 600;
      letter-spacing: 0%;
    }
  }
}

.box-two{
  margin-top: 20rem;
  background: #323738;

  .stats-container {
    display: flex;

    .stat-item {
      flex: 1;
      padding: 42rem 20rem;
      text-align: center;

      &:first-child {
        border-right: 2rem solid #3B4041
      }

      .icon {
        width: 70rem;
        height: 76rem;
        margin: auto;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      .label {
        color: #BFBFBF;
        font-family: PingFang SC;
        font-weight: 600;
        font-size: 20rem;
        line-height: 28rem;
        letter-spacing: 0%;
        margin-top: 20rem;
      }

      .value {
        margin-top: 20rem;
        font-family: Poppins;
        font-weight: 700;
        font-size: 28rem;
        line-height: 42rem;
        letter-spacing: 0%;
      }
    }
  }
}

.box-three{
  margin-top: 20rem;
  background: #323738;

  .rewards-container {
    display: flex;

    .reward-item {
      flex: 1;
      &:last-child {
       margin-left: 50rem;
      }

      .icon {
        width: 32rem;
        height: 32rem;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      .label {
        color: #BFBFBF;
        font-family: PingFang SC;
        font-weight: 600;
        font-size: 20rem;
        line-height: 28rem;
        letter-spacing: 0%;
        margin-top: 20rem;
      }

      .amount {
        font-family: Poppins;
        font-weight: 700;
        font-size: 28rem;
        line-height: 42rem;
        letter-spacing: 0%;
        margin-top: 20rem;
      }
    }
  }
}

.box-four{
  margin: 20rem 0 40rem;
  background: #323738;

  .live-rewards {
    // background: rgba(255, 255, 255, 0.05);
    // border-radius: 8px;
    // padding: 16px;

    .header {
      .title {
        display: flex;
        align-items: center;
        font-family: Poppins;
        font-weight: 600;
        font-size: 24rem;
        line-height: 36rem;
        letter-spacing: 0%;


        .dot {
          width: 38rem;
          height: 38rem;
          background: #00FF7F;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
          border: 10rem solid #384c2e !important;
          margin-right: 8rem;
        }
      }
    }

    .total-reward {
      border-radius: 20rem;
      background: #3A4142;
      margin-top: 20rem;
      display: flex;
      justify-content: space-between;
      padding: 28rem 22rem;

      .label {
        font-family: PingFang SC;
        font-weight: 600;
        font-size: 24rem;
        line-height: 34rem;
        letter-spacing: 0%;
      }

      .amount {
        color: #1CF187;
        font-family: Poppins;
        font-weight: 700;
        font-size: 32rem;
        line-height: 48rem;
        letter-spacing: 0%;
      }
    }

    .rewards-list {
      margin-top: 40rem;
      display: flex;

      .reward-item {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap !important;
        gap: 15rem;
        .user {
          font-family: PingFang SC;
          font-weight: 600;
          font-size: 20rem;
          line-height: 28rem;
          letter-spacing: 0%;
          width: 40% !important;
          white-space: normal; /* 允许文本换行 */
          overflow-wrap: break-word; /* 或 word-wrap: break-word; */
        }

        .reward {
          display: flex;
          align-items: center;
          font-family: PingFang SC;
          font-weight: 600;
          font-size: 24rem;
          line-height: 34rem;
          letter-spacing: 0%;
          color: #1CF187;
          
          img {
            width: 28rem;
            height: 28rem;
            margin-left: 4rem;
          }
        }

       &:first-child {
         margin-right: 12rem;
       }
      }
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
    border: 10rem solid red;
  }
  100% {
    opacity: 1;
  }
}


</style>
  