<script setup></script>

<template>
  <div class="new-games-container">
    <div class="txt">
      <h1 class="title">
        <span>最新游戏</span>
        <br />
        <span>发布</span>
      </h1>
      <img src="/svg/game-split.svg" alt="" />
      <div class="desc">
        最新、最火热的全新在线娱乐游戏热腾腾上架、就等你来一探究竟！
      </div>
    </div>

    <div class="scroll-view"></div>

    <div class="footer">
      <a class="btn">全部游戏</a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.new-games-container {
  width: 100%;
  padding-top: 146px;
  padding-bottom: 160px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;

  .txt {
    max-width: 1320px;
    display: flex;
    justify-content: center;
    align-items: center;
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    width: 100%;
    padding-right: calc(var(--bs-gutter-x) * 0.5);
    padding-left: calc(var(--bs-gutter-x) * 0.5);
    margin-right: auto;
    margin-left: auto;

    .title {
      &::after {
        content: '';
        // position: absolute;
        // top: -120px;
        // bottom: 0;
        // right: 0;
        // left: -70px;
        // width: 150%;
        // height: 200%;
        // background: linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%);
        // opacity: 0.15;
        // filter: blur(50px);
        // z-index: -1;
      }
    }
  }

  .footer {
    width: 100%;
    text-align: center;

    .btn {
      display: inline-block;
      margin: 3rem auto 0;
      padding: 16px 58px;
      font-size: 1.2rem;
      position: relative;
      border: 1px solid transparent;
      background:
        linear-gradient(#1f1f1d 0 0) padding-box,
        linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) border-box;
      transition: all ease-in-out 0.3s;
      border-radius: 100px;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
          linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) padding-box,
          linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) border-box;
        border-radius: 100px;
        opacity: 0;
        transition: all ease-in-out 0.3s;
      }
    }
  }
}
</style>
