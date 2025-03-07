<template>
  <x-page pageType="black">
    <template #title>Fortune</template>
    <template #right>
      <div class="arrow flex-center" style="margin-right: 30rem;" @click="conf.gomytask">
        <van-icon size="20rem" color="#fff" name="info-o" />
      </div>
    </template>
    <div class="f-box">
      <div class="content">
        <div class="top-his">
          <div class="history" @click="conf.goPage('/user/YuE-Bao/myYueBao')">
            <img src="/static/theme/black/fortune-his.png" />
            <span>History</span>
          </div>
        </div>
        <div class="top-title">Total Amount</div>
        <div class="top-num">
          <span>{{ conf.coinlist.coinSymbol }}</span>
          <span>{{ sutil.dataHandling(conf.tableData.totalBalance || 0, 4, 4) || '0.00' }}</span>
        </div>
        <div class="type-list">
          <div class="type-item">
            <div class="top-title">Total Earnings</div>
            <div class="top-num">
              <span>{{ conf.coinlist.coinSymbol }}</span>
              <span>{{ conf.tableData.totalIncome < 0 ? '0.00' : conf.tableData.totalIncome || '0.00' }}</span>
            </div>
          </div>
          <div class="type-item">
            <div class="top-title">Annualized</div>
            <div class="top-num">{{ conf.tableData.fixYearRate || '0.00' }}</div>
          </div>
        </div>
      </div>
      <div class="transfer-btn">
        <div class="btn-item">
          <greenBtn @click="conf.modalName = 'in'">
            <div class="btn-txt">
              <img src="/static/theme/black/fortune-in.png" />
              <span>Transfer In</span>
            </div>
          </greenBtn>
        </div>
        <div class="btn-item flex-center btn-with" @click="conf.modalName = 'out'">
          <div class="btn-txt">
            <img src="/static/theme/black/fortune-out.png" />
            <span>Transfer Out</span>
          </div>
        </div>
      </div>
      <div class="content" v-if="!conf.tableData.totalNum">
        <div class="no-yet">
          <img class="coin-img" src="/static/theme/black/fortune-coin.png" />
          <div class="no-yet">No Amount yet</div>
          <div>Start earning by transferring assets to BG Fortune</div>
        </div>
      </div>
      <div class="content">
        <div class="questions">
          <div class="title">Frequently Asked Questions</div>
          <div class="questions-item">
            <div class="flex-b-c">
              <div class="l-ques">How is the deposit and withdrawal of funds in BG Fortune protected?</div>
              <div class="arrow flex-center">
                <van-icon size="20rem" color="#fff" name="arrow" />
              </div>
            </div>
          </div>
          <div class="questions-item">
            <div class="flex-b-c">
              <div class="l-ques">How is the deposit and withdrawal of funds in BG Fortune protected?</div>
              <div class="arrow flex-center">
                <van-icon size="20rem" color="#fff" name="arrow" />
              </div>
            </div>
          </div>
          <div class="questions-item">
            <div class="flex-b-c">
              <div class="l-ques">How is the deposit and withdrawal of funds in BG Fortune protected?</div>
              <div class="arrow flex-center">
                <van-icon size="20rem" color="#fff" name="arrow-down" />
              </div>
            </div>
            <div class="asked">
              Absolutely! BGAME ensures that the funds in BG Fortune are safeguarded and will not be accessed by anyone
              other
              than the depositor. Your funds areentirely yours, and they will always remain secure foryour use.
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 转入 -->
    <transferPopup
      :show="conf.modalName == 'in'"
      :defaultCoin="conf.coinlist"
      :walletlist="conf.walletlist"
      :tableData="conf.tableData"
      @close="conf.modalName = ''"
      @change="conf.getInfo"
    />
    <!-- 转出 -->
    <transferPopup
      :show="conf.modalName == 'out'"
      :active="1"
      :defaultCoin="conf.coinlist"
      :walletlist="conf.walletlist"
      :tableData="conf.tableData"
      @close="conf.modalName = ''"
      @change="conf.getInfo"
    />
  </x-page>
</template>

<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import transferPopup from './components/transferPopup.vue'
import { index } from './yueBao'
import sutil from '@/sstore/sutil'

const conf = index()
</script>

<style lang="less" scoped>
.arrow {
  width: 44rem;
  height: 44rem;
  background: #464F50;
  border-radius: 10rem;
  flex-shrink: 0;
}

.f-box {
  padding: 24rem;

  .content {
    background: #323738;
    border-radius: 20rem;
    padding: 20rem 24rem;
    margin-bottom: 20rem;
  }

  .top-his {
    display: flex;
    justify-content: flex-end;

    .history {
      background: #464F50;
      border-radius: 10rem;
      height: 42rem;
      display: flex;
      align-items: center;
      font-size: 20rem;
      color: #B3BEC1;
      padding: 0rem 16rem;

      img {
        height: 16rem;
        margin-right: 12rem;
      }
    }
  }

  .top-title {
    color: #FFFFFF;
    font-size: 28rem;
    font-weight: 600;
  }

  .top-num {
    color: #FFFFFF;
    font-size: 52rem;
    font-weight: 700;
    margin-top: 20rem;
  }

  .type-list {
    display: flex;
    margin-top: 40rem;

    .type-item {
      flex: 1;

      .top-title {
        color: #BFBFBF;
      }

      .top-num {
        font-size: 40rem;
      }
    }
  }
}

.transfer-btn {
  display: flex;
  margin-bottom: 20rem;

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

.no-yet {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #BFBFBF;
  font-size: 24rem;

  .coin-img {
    height: 84rem;
    margin-top: 10rem;
  }

  .no-yet {
    color: #FFFFFF;
    font-size: 28rem;
    font-weight: 700;
    margin-top: 30rem;
    margin-bottom: 10rem;
  }
}

.questions {
  color: #fff;
  font-size: 24rem;

  .title {
    font-size: 28rem;
    font-weight: 700;
    margin-top: 10rem;
  }

  .questions-item {
    padding: 20rem 0rem;
  }

  .asked {
    font-size: 20rem;
    color: #BFBFBF;
    margin-top: 16rem;
    padding-right: 30rem;
  }
}
</style>
