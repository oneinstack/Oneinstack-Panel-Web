<template>
  <div class="head">
    <topInfo v-if="sconfig.userInfo" />
    <div class="head-daily" v-else>
      <img class="logo-img" src="/static/img/home/black/logo.png" />
      <div class="head-login">
        <div class="log" @click="conf.goPage('/login')">Login</div>
        <div class="reg">
          <greenBtn @click="conf.goPage('/register')">Register</greenBtn>
        </div>
      </div>
    </div>
    <div style="padding: 0rem 24rem;">
      <img class="head-img" src="/static/img/home/black/casino-top.png" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import greenBtn from '../components/greenBtn.vue';
import topInfo from '../components/topInfo.vue';
import sconfig from '@/sstore/sconfig';
import System from '@/utils/System';

const conf = reactive({
  goPage(url: string) {
    System.router.push(url)
  }
})

onMounted(() => {
  console.log(sconfig.userInfo);
})
</script>
<style lang="less" scoped>
.head {
  padding: 16rem 0rem 0rem;
  background: linear-gradient(180deg, #204734 0%, #222627 100%);

  .head-daily {
    padding: 0rem 24rem;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .logo-img {
      height: 68rem;
    }

    .head-login {
      display: flex;
      align-items: center;
      font-size: 28rem;
      font-weight: 600;

      .log {
        color: #fff;
        margin-right: 30rem;
      }

      .reg {
        height: 70rem;
        width: 168rem;
      }
    }
  }

  .head-img {
    width: 100%;
    height: 408rem;
    margin-top: 12rem;
  }
}
</style>