<template>
  <div class="list-card">
    <div class="card" v-for="i in 4">
      <div class="top">
        <p class="name">当前使用率</p>
        <div class="round"></div>
      </div>
      <p class="rate">38.7%</p>
      <p class="date">2024-05-21 9:46:11</p>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="less" scoped>
.list-card {
  display: flex;
  flex-wrap: wrap;
  width: 686rem;
  margin: 0 auto;
  .card {
    height: 238rem;
    background: var(--card-bg-color);
    width: 330rem;
    margin-left: 26rem;
    margin-top: 20rem;
    border-radius: 12rem;
    padding: 32rem;
    margin-top: 32rem;
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .name {
        font-size: 24rem;
        font-weight: 700;
      }
      .round{
        height: 20rem;
        width: 20rem;
        border-radius: 50%;
        border: 4rem solid var(--primary-color);
      }
    }

    .rate {
      margin-top: 40rem;
      font-size: 48rem;
      color: var(--primary-color);
      line-height: 42rem;
    }
    .date {
      margin-top: 44rem;
      color: var(--font-gray-color);
      line-height: 20rem;
      font-size: 24rem;
    }
  }
  .card:nth-of-type(odd) {
    margin-left: 0;
  }
}
</style>
