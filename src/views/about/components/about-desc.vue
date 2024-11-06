<script setup></script>

<template>
  <div class="about-desc-container">
    <div class="content">
      <h1 class="title">
        <span>About</span>
        <span class="bg-gradient">BG</span>
      </h1>
      <div class="desc">
        <h3>线上游戏开发霸主</h3>
        <p>
          BG夺宝电子以开发老虎机(角子机)起家，并拥有亚洲最大老虎机台制造商独家授权，首开亚洲先锋整合线下到线上娱乐，指尖上便能享受如同亲临赌场般的刺激游玩体验，并以捕鱼机、老虎机、宾果、棋牌、街机游戏等多元游戏种类制霸市场！BG夺宝电子以稳定、可靠且值得信赖的全方位服务品质引以为傲，也深受玩家及合作伙伴的青睐与喜爱。持续开发创新的游戏玩法，提供玩家流畅游玩环境及卓越的游戏体验是我们坚持努力的目标，BG夺宝电子是您在线上娱乐领域的最佳合作伙伴！
        </p>
      </div>
      <div class="desc">
        <h3>线上游戏开发商第一首选！</h3>
        <p>
          BG夺宝电子积极进军国际市场，并陆续获得市场上的广大回响。我们能够为合作伙伴提供全面且专业的服务，包括全年无休技术支援、安全可靠API快速串接、透过大数据分析提升玩家游戏体验等等。
          BG夺宝电子相信，与合作伙伴共同创造更优秀的产品和服务，将能够为玩家带来更多美好的游玩历程，进而创造出更大的商机！
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-desc-container {
  --bs-gutter-x: 1.5rem;
  --bs-gutter-y: 0;
  padding: calc(120px + var(--nav-heaght)) calc(var(--bs-gutter-x) * 15) 124px;
  background: url('/images/banner-bg.png') center center no-repeat;
  background-size: cover;

  .content {
    max-width: 1320px;
    width: 100%;
    padding-right: calc(var(--bs-gutter-x) * 0.5);
    padding-left: calc(var(--bs-gutter-x) * 0.5);
    margin-right: auto;
    margin-left: auto;

    .title {
      font-size: 72px;
      margin-bottom: 120px;
      margin-top: 0;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;

      .bg-gradient {
        padding: 0 20px;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        background-image: var(--gradient-color);
      }
    }
  }

  .desc {
    & > h3 {
      font-size: 40px;
      margin-bottom: 1rem;
      font-weight: 700;
      line-height: 1.2;
    }

    & > p {
      color: #fffc;
      line-height: 32px;
      margin: 0 0 56px;
    }
  }
}
</style>
