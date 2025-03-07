<template>
  <x-page>
    <template #title>Daily Contest</template>

    <div class="container">
      <div class="prize-pool">
        <div class="trophy-section">
          <img src="/static/theme/black/dailyContest/trophy.png" alt="" />
        </div>
        <div class="pool-info">
          <div class="label">
            <img src="/static/theme/black/dailyContest/left.png" alt="Trophy" />
           <span> Daily Contest</span>
            <img src="/static/theme/black/dailyContest/right.png" alt="Trophy" />
          </div>
          <div class="sub-label">Contest prize pool</div>
          <div class="amount">${{ conf.prizePool }}</div>
        </div>
      </div>

      <div class="info-section">
        <div class="time-remaining">
          <div class="label">Time Remaining</div>
          <div class="countdown">
            <div class="time-unit">
              <div class="value">{{ conf.hours }}</div>
              <div class="unit">Hour</div>
            </div>
            <span class="separator">
              <div class="point"></div>
              <div class="point"></div>
            </span>
            <div class="time-unit">
              <div class="value">{{ conf.minutes }}</div>
              <div class="unit">Minute</div>
            </div>
            <span class="separator">
              <div class="point"></div>
              <div class="point"></div>
            </span>
            <div class="time-unit">
              <div class="value">{{ conf.seconds }}</div>
              <div class="unit">Second</div>
            </div>
          </div>
        </div>

        <div class="champion">
          <div class="label">
            <div class="winner-tag">Winner</div>
            Last Champion
          </div>
          <div class="champion-info">
            <div class="img-box">
              <img src="/static/theme/black/dailyContest/crown.png" class="avatar-top" />
              <img src="/static/img/game/animal/C.png" class="avatar-bom" />
            </div>
            <div class="details">
              <div class="name">{{ conf.lastChampion.name }}</div>
              <div class="profit">{{ conf.lastChampion.profit }}</div>
              <div class="prize">${{ conf.lastChampion.prize }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="info-box">
        <div class="my-status">
          <img src="/static/img/game/animal/C.png" class="user-avatar" alt="" />
          <div class="user-info">
            <div class="username">{{ conf.userInfo.name }}</div>
            <div class="wager">Wager ${{ conf.userInfo.wager }} To reach Top 10</div>
          </div>
        </div>
        <div class="position-info">
          <div class="wager-amount">
            <div class="label">My Position</div>
            <div class="value">{{ conf.userInfo.position }}</div>
          </div>
          <div class="wager-amount">
            <div class="label">Wager</div>
            <div class="value">${{ conf.userInfo.currentWager }}</div>
          </div>
        </div>
      </div>

      <div class="table-box">
        <div class="contest-period">
          <div class="status">
            <img src="/static/theme/black/dailyContest/loading.png" />
            Active
          </div>
          <div class="date">{{ conf.period }}</div>
          <div class="history" @click="conf.viewHistory">
            History
            <van-icon name="arrow" style="font-weight: bold; color: #d9d9d9" />
          </div>
        </div>

        <div class="leaderboard">
          <div class="header">
            <div class="col">#</div>
            <div class="col">Player</div>
            <div class="col">Wager</div>
            <div class="col">Prize</div>
          </div>
          <div class="board-content">
            <div v-for="(item, index) in conf.leaderboard" :key="index" class="row">
              <div class="col rank">
                <img v-if="index < 3" :src="conf.getRankIcon(index)" />
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="col player">{{ item.player }}</div>
              <div class="col wager">${{ item.wager }}</div>
              <div class="col prize">
                ${{ item.prize }}
                <span>{{ item.percent }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { index } from './index'

const conf = index()
</script>

<style lang="less" scoped>
.container {
  padding: 30rem;
  font-family: Poppins;
  color: #ffffff;

  .prize-pool {
    border-radius: 20rem;
    background: linear-gradient(90deg, #244e3a 0%, #323738 100%);
    display: flex;
    gap: 50rem;
    padding: 30rem 50rem;

    .trophy-section {
      img {
        width: 204rem;
        height: 172rem;
      }
    }

    .pool-info {
      text-align: center;
      .label {
        color: #1cf187;
        font-size: 28rem;
        font-style: normal;
        font-weight: 700;
        line-height: normal;
        display: flex;
        align-items: center;
        justify-content: center;

        span{
            margin-top: -10rem;
        }

        img {
          width: 44rem;
          height: 44rem;
        }
      }

      .sub-label {
        color: #bfbfbf;
        font-family: 'PingFang SC';
        font-size: 24rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
        padding: 10rem 0 15rem;
      }

      .amount {
        color: #1cf187;
        font-family: Poppins;
        font-size: 40rem;
        font-style: normal;
        font-weight: 700;
        line-height: normal;
        border-radius: 8px;
        background: #232626;
        height: 84rem;
        line-height: 84rem;
        padding: 0 40rem;
      }
    }
  }

  .info-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16rem;
    margin: 20rem 0;

    .time-remaining,
    .champion {
      background: #323738;
      border-radius: 16rem;
      padding: 0 20rem 35rem;
      position: relative;
      overflow: hidden;

      .label {
        color: #1cf187;
        font-family: Poppins;
        font-size: 28rem;
        font-style: normal;
        font-weight: 700;
        line-height: normal;
        text-align: center;
        margin: 40rem 0 25rem;

        .winner-tag {
          width: 50%;
          text-align: center;
          color: #1f1f1f;
          font-family: Poppins;
          font-size: 20rem;
          font-style: normal;
          font-weight: 700;
          line-height: normal;
          background: #1cf187;
          padding: 0rem 30rem;
          transform: rotate(-40.852deg) !important;
          position: absolute;
          top: 8%;
          left: -15%;
        }
      }
    }

    .countdown {
      display: flex;
      align-items: center;
      gap: 8rem;

      .time-unit {
        text-align: center;
        border-radius: 18rem;
        background: #232626;
        width: 84rem;
        height: 104rem;

        .value {
          color: #fff;
          font-family: Poppins;
          font-size: 32rem;
          font-style: normal;
          font-weight: 700;
          line-height: normal;
          margin-top: 10rem;
        }

        .unit {
          color: #bfbfbf;
          font-family: 'PingFang SC';
          font-size: 20rem;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
        }
      }

      .separator {
        .point {
          background: #849194;
          width: 8rem;
          height: 8rem;
          border-radius: 50%;
          &:nth-child(1) {
            margin-bottom: 8rem;
          }
        }
      }
    }

    .champion-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12rem;

      .img-box {
        display: grid;
        .avatar-top {
          margin-left: 7.5rem;
          width: 53rem;
          height: 28rem;
        }
        .avatar-bom {
          width: 68rem;
          height: 68rem;
          border-radius: 50%;
        }
      }

      .avatar {
        width: 40rem;
        height: 40rem;
        border-radius: 50%;
      }

      .details {
        font-family: 'PingFang SC';
        font-size: 20rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;

        .profit {
          color: #bfbfbf;
        }

        .prize {
          color: #1cf187;
        }
      }
    }
  }

  .info-box {
    background: #323738;
    padding: 20rem;
    border-radius: 20rem;

    .my-status {
      display: flex;
      align-items: center;
      gap: 12rem;
      margin-bottom: 25rem;
      border-bottom: 2rem solid #43494a;
      padding-bottom: 28rem;

      .user-avatar {
        width: 72rem;
        height: 72rem;
        border-radius: 50%;
      }

      .user-info {
        .username {
          font-size: 28rem;
          font-style: normal;
          font-weight: 700;
          line-height: normal;
        }

        .wager {
          color: #bfbfbf;
          font-family: 'PingFang SC';
          font-size: 20rem;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
        }
      }
    }

    .position-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16rem;

      .wager-amount {
        padding: 12rem 0 0;
        text-align: center;

        &:nth-child(1) {
          border-right: 2rem solid #43494a;
        }

        .label {
          color: #bfbfbf;
          font-family: 'PingFang SC';
          font-size: 24rem;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
        }

        .value {
            margin-top: 10rem;
          color: #1cf187;
          font-family: Poppins;
          font-size: 24rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
        }
      }
    }
  }

  .table-box {
    background: #323738;
    margin-top: 20rem;
    border-radius: 16rem;

    .contest-period {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 96rem;

      .status {
        background: #1cf187;
        color: #000000;
        border-radius: 4rem;
        font-size: 14rem;
        display: flex;
        align-items: center;
        justify-content: start;
        height: 52rem;
        padding-right: 20rem;
        color: #1f1f1f;
        font-family: 'PingFang SC';
        font-size: 24rem;
        font-style: normal;
        font-weight: 500;
        line-height: normal;
        img {
          width: 36rem;
          height: 36rem;
        }
      }

      .date {
        font-size: 24rem;
        font-style: normal;
        font-weight: 700;
        line-height: normal;
      }

      .history {
        display: flex;
        align-items: center;
        gap: 4rem;
        cursor: pointer;
        font-family: 'PingFang SC';
        font-size: 24rem;
        font-style: normal;
        font-weight: 500;
        line-height: normal;
        height: 56rem;
        border-radius: 12rem;
        background: #394143;
        margin-right: 20rem;
        padding: 0 15rem;

        img {
          width: 16rem;
          height: 16rem;
        }
      }
    }

    .leaderboard {
      .header {
        background: #323738;
        display: grid;
        grid-template-columns: 1fr 1.5fr 2fr 2fr;
        height: 80rem;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-top: 2rem solid #3a4142;

        .col {
          color: #bfbfbf;
          font-family: 'PingFang SC';
          font-size: 24rem;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
        }
      }

      .board-content {
        .row {
          display: grid;
          align-items: center;
          justify-content: center;
          grid-template-columns: 1fr 1.5fr 2fr 2fr;
          height: 80rem;
          text-align: center;

          &:nth-child(odd) {
            background: #3a4142;
          }

          .col {
            color: #fff;
            font-family: 'PingFang SC';
            font-size: 24rem;
            font-style: normal;
            font-weight: 600;
            line-height: normal;

            &.rank {
              img {
                width: 52rem;
                height: 52rem;
              }
            }

            &.wager {
              color: #1cf187;
            }

            &.prize {
              color: #1cf187;

              span {
                color: #bfbfbf;
              }
            }
          }
        }
      }
    }
  }
}
</style>
.
