<template>
    <div class="recent">
        <div class="title">
            <div class="icon-big flex-center">
                <div class="icon-small"></div>
            </div>
            <div class="name">Recent Winners</div>
        </div>
        <div class="total flex-b-c">
            <div class="l-name">Prizes Paid Out</div>
            <div class="r-price">$1,710,987.11</div>
        </div>
        <div class="table">
            <div class="t-title flex-b-c">
                <span>Player</span>
                <span>Price</span>
            </div>
            <template v-for="item in 5">
                <div class="t-line flex-b-c">
                    <div class="l-name">
                        <img class="l-img" src="/static/img/default-header.png" />
                        <div class="user-name">Prathimarangula</div>
                    </div>
                    <div class="l-name">
                        <div class="price">$130,733.17</div>
                        <img class="l-img" src="/static/theme/black/3d.png" />
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    item: {
        default: (): any => { }
    }
})

</script>
<style lang="less" scoped>
.recent {
  background: #323738;
  border-radius: 20rem;
  color: #fff;
  font-size: 24rem;
  margin: 0rem 24rem 10rem;
  padding: 20rem;

  .title {
    display: flex;
    align-items: center;

    .icon-big {
      background: #314A40;
      width: 28rem;
      height: 28rem;
      border-radius: 50%;

      .icon-small {
        background: #1CF187;
        width: 14rem;
        height: 14rem;
        border-radius: 50%;
      }
    }

    .name {
      margin-left: 16rem;
    }
  }

  .total {
    background: #314A40;
    box-shadow: 2rem 2rem 8rem 0px #314A40,
      -2rem -2rem 8rem 0px #314A40;
    height: 80rem;
    border-radius: 8rem;
    padding: 0rem 20rem;
    margin-top: 30rem;

    .r-price {
      color: #1CF187;
      font-size: 32rem;
      font-weight: 700;
    }
  }

  .table {
    padding: 10rem;

    .t-title {
      font-size: 20rem;
      margin: 40rem 0rem;
    }

    .t-line {
      margin-bottom: 60rem;

      .l-name {
        display: flex;
        align-items: center;
        font-size: 22rem;

        .l-img {
          width: 28rem;
          height: 28rem;
          border-radius: 50%;
        }

        .user-name {
          margin-left: 20rem;
        }

        .price {
          margin-right: 12rem;
          color: #1CF187;
        }
      }
    }
  }
}
</style>