<template>
  <div class="task-head flex-b-c">
    <div>Expires in <span>17h 18m 12s</span></div>
    <div class="more-btn flex-center"  @click="conf.goMyTask">
      <img src="/static/theme/black/task/time.png" />
      <span>My Task</span>
      <van-icon size="24rem" name="arrow" />
    </div>
  </div>
  <div class="task-list">
    <template v-for="(item, index) in taskList" :key="index">
      <div class="task-item flex-b-c" @click="conf.handleIntoDetail(item)">
        <div class="task-left">
          <div class="left-img">
            <!-- <img mode="widthFix" class="vip-img" :src="`/static/img/VIP/v${conf.getLevel(item.userLevel)}.svg`" /> -->
            <img class="task-img" :src="item.img" />
          </div>
          <div class="left-info">
            <div class="info-name">
              <div class="task-name">{{ item.title }}</div>
              <div class="task-tips">{{ item.brief }}</div>
            </div>
          </div>
        </div>
        <div class="task-right">
          <div class="collect-btn claimed flex-center" v-if="item.isReceive">
            {{ item.isReceive ? $t('task.claimed') : $t('point.collect') }}
          </div>
          <div style="height: 80rem;width: 120rem;" v-else>
            <greenBtn>
              <span>Go</span>
            </greenBtn>
          </div>
        </div>
        <!-- <div class="task-right" v-else>
					<div class="right-line">
						<div class="get-line-100" style="width: 100%;"></div>
					</div>
					<div class="num-100">100%</div>
				</div> -->
        <!-- 0-现金、1-宝箱 -->
        <div class="task-money" v-if="item.rewardType">
          <template v-for="(b, i2) in conf.getBoxTypeNum(item.reward)" :key="b.id">
            <img class="task-coin-img" :src="`/static/img/point/box${b.boxType}.png`" />
            <span style="margin-left: 6rem">{{ b.count }}</span>
          </template>
          <!-- <span>{{$t('task.DEposit')+' '+ defalutWallet.coinSymbol + dataHandling(item.deposit)}}</span> -->
        </div>
        <div class="task-money" v-else>
          <div class="task-coin flex-center">{{ defalutWallet.coinSymbol }}</div>
          <span>{{ defalutWallet.coinSymbol + sutil.dataHandling(parseInt(item.reward)) }}</span>
          <!-- <span style="margin-left: 20rem;">{{$t('task.DEposit')+' '+ defalutWallet.coinSymbol + dataHandling(item.deposit)}}</span> -->
        </div>
        <!-- <div class="right-top" v-if="item.isReceive">
          <img class="state-img" src="/static/img/task/task-1.png" />
        </div>
        <div class="right-top" v-else-if="conf.getDeposit(item.deposit)">
          <img class="state-img" src="/static/theme/blue/task-deposit.webp" />
        </div> -->
      </div>
    </template>
    <!-- <div class="task-right">
			<div class="right-line">
				<div class="get-line" style="width: 70%;"></div>
			</div>
			<div class="num">70%</div>
		</div> -->
  </div>
</template>

<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import sutil from '@/sstore/sutil'
import { index } from '@/views/user/tasks/components/taskList'

const props = defineProps({
  taskList: {
    default: [] as any[]
  },
  defalutWallet: {
    default: {} as any
  }
})

const conf = index({ props })
</script>

<style lang="less" scoped>
.items-center {
  display: flex;
  align-items: center;
}
.task-head{
  font-size: 24rem;
  color: #BFBFBF;
  margin-top: 20rem;
  span{
    color: #fff;
  }
  .more-btn{
    background: #464F50;
    height: 56rem;
    border-radius: 10rem;
    padding: 0rem 10rem 0rem 16rem;
    img{
      width: 24rem;
      height: 24rem;
    }
    span{
      font-weight: 600;
      color: #fff;
      margin: 0rem 12rem;
    }
  }
}
.task-list {
  // margin-top: 20rem;
  padding-bottom: 20rem;

  .task-item {
    background: #323738;
    border-radius: 12rem;
    margin-top: 20rem;
    padding: 20rem;
    position: relative;
    overflow: hidden;

    .task-left {
      display: flex;
      align-items: center;

      .left-img {
        width: 140rem;
        height: 140rem;
        position: relative;

        .task-img {
          width: 100%;
          height: 100%;
          border-radius: 16rem;
        }

        .vip-img {
          width: 65rem;
          // height: 32rem;
          position: absolute;
          top: -18rem;
          left: -18rem;
          z-index: 1;
        }
      }

      .left-info {
        padding: 5rem 12rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 136rem;
        padding-left: 25rem;

        .info-name {
          width: 320rem;

          .task-name {
            color: #fff;
            font-size: 28rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: Poppins;
            font-weight: 600;
          }

          .task-tips {
            color: #bfbfbf;
            font-size: 24rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 300rem;
          }
        }
      }
    }

    .task-right {
      display: flex;
      align-items: center;

      .collect-btn {
        padding: 8rem 24rem;
        color: #006fff;
        background: #e6f2ff;
        border-radius: 12rem;
        font-size: 25rem;
      }

      .claimed {
        height: 80rem;
        color: #BFBFBF;
        background: #3A4142;

      }

      .right-line {
        height: 12rem;
        width: 100rem;
        background: #f0f0f0;
        border-radius: 6rem;
        overflow: hidden;
        margin-right: 15rem;

        .get-line {
          background: linear-gradient(88.87deg, #ffa14d 17.77%, #ff6c2c 81.21%);
          height: 100%;
        }

        .get-line-100 {
          background: linear-gradient(88.87deg, #67e16b 17.77%, #22cd28 81.21%);
          height: 100%;
        }
      }

      .num {
        font-size: 24rem;
        color: #ff7502;
      }

      .num-100 {
        font-size: 24rem;
        color: #6ee372;
      }
    }

    .task-money {
      position: absolute;
      bottom: 25rem;
      left: 180rem;
      z-index: 1;
      display: flex;
      align-items: center;
      background: #2E6E50;
      padding: 2rem 20rem 2rem 16rem;
      border-radius: 30rem;

      .task-coin-img {
        width: 36rem;
        height: 36rem;
      }

      .task-coin {
        width: 36rem;
        height: 36rem;
        background-size: 100% 100%;
        background-image: url('/static/img/coin-task.png');
        color: #faa54b;
        font-size: 16rem;
      }

      span {
        color: #1CF187;
        font-size: 24rem;
      }
    }

    .right-top {
      position: absolute;
      right: -40rem;
      top: -40rem;
      width: 80rem;
      height: 80rem;
      background: #e6f2ff;
      transform: rotate(45deg);

      .state-img {
        width: 24rem;
        height: 24rem;
        position: absolute;
        left: 30rem;
        top: 52rem;
        transform: rotate(-45deg);
      }
    }
  }
}
</style>
