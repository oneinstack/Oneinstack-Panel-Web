<template>
  <div class="top">
    <div class="title">
      <img class="glass-img" src="/static/theme/black/glass.png" />
      <div class="name">Top Winning Lotteries</div>
    </div>
    <template v-for="(item,index) in 4" :key="index">
      <div class="top-item flex-b-c">
        <div class="l-content">
          <div class="sort">{{ item }}</div>
          <div class="info">
            <div class="game">
              <img class="game-img" src="/static/theme/black/3d.png" />
              <span>Color</span>
            </div>
            <div class="dram">Next draw:00h01m08s</div>
            <div class="price">$1,710,987.11</div>
          </div>
        </div>
        <div class="r-btn">
          <greenBtn>
            <span style="font-size: 28rem;">Bet Now</span>
          </greenBtn>
        </div>
      </div>
      <div v-if="index < 2" class="wind-line"></div>
    </template>
  </div>
</template>
<script setup lang="ts">
import greenBtn from '../components/greenBtn.vue';

const props = defineProps({
  item: {
    default: (): any => { }
  }
})

</script>
<style lang="less" scoped>
.top {
  background: #323738;
  border-radius: 20rem;
  color: #fff;
  font-size: 24rem;
  margin: 0rem 24rem 10rem;
  padding: 20rem 20rem 40rem;

  .title {
    display: flex;
    align-items: center;

    .glass-img {
      width: 28rem;
      height: 28rem;
    }

    .name {
      margin-left: 16rem;
    }
  }

  .top-item {
    padding: 0rem 10rem 20rem;
    margin-top: 20rem;
    // border-bottom: 2rem solid #FFFFFF1A;

    .l-content {
      display: flex;
      align-items: center;
      color: #fff;

      .sort {
        font-size: 80rem;
        margin-right: 40rem;
      }

      .info {
        font-size: 24rem;

        .game {
          display: flex;
          align-items: center;

          .game-img {
            width: 48rem;
            height: 48rem;
            margin-right: 16rem;
          }
        }

        .dram {
          color: #BFBFBF;
          margin: 6rem 0rem;
        }

        .price {
          color: #1CF187;
          font-size: 28rem;
        }
      }
    }

    .r-btn {
      height: 56rem;
      width: 160rem;
    }
  }

  .wind-line {
    height: 2rem;
    width: 100%;
    background: #FFFFFF1A;
  }
}
</style>