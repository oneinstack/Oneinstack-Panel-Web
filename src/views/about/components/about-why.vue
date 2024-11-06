<script setup></script>

<template>
  <div class="about-why-container">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-xxl-10">
          <h2 class="why-title">必须是BG夺宝电子的最佳理由</h2>
          <div class="card-list row">
            <div class="card-item">
              <h4 class="title">因地制宜，创造双赢</h4>
              <p class="text">
                针对客户营运区域、依据游戏表现、玩家上线频率与喜好，提供游戏的调整建议与协助策略布局。
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">风险控管，保障利益</h4>
              <p class="text">
                计算落点分布与潜在风险值，严格监控与管理游戏营运状况。
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">开发预测，抢先商机</h4>
              <p class="text">
                根据历史资料与产业经验，判断新游戏开发所需具备的特点与元素来锁定目标市场，大幅提升成功率，并藉由营销活动，提高玩家对BG游戏产品的忠诚度，以保障客户期望。
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">状况比对，成效分析</h4>
              <p class="text">
                交叉比对客户状况、玩家分布、留存率评估等，定期追踪玩家行为，藉由BG专业团队与大资料分析游戏成效和玩家习性，开发更具吸引力与高黏着度产品。
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">游戏推荐，投其所好</h4>
              <p class="text">
                根据玩家与游戏主题的关联性、游玩频率、游戏黏着度、游戏调性等数据评估，提供玩家更适当的游戏选择，让JDB游戏产品更能促进玩家的游玩体验，并提高客户的经营获利。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-why-container {
  padding: 0 0 140px;
  background: linear-gradient(180deg, #020202 0%, #1f1f1d 100%);

  .container {
    width: 1320px;
  }

  @media (min-width: 1400px) {
    .col-xxl-10 {
      flex: 0 0 auto;
      width: 83.33333333%;
    }
  }

  .why-title {
    font-size: 72px;
    margin-bottom: 80px;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
  }

  .card-list {
    .card-item {
      padding: 32px;
      border-radius: 8px;
      transition: all ease-in-out 0.3s;
      position: relative;
      bottom: 0;
      margin-bottom: 1.5rem;
      flex: 0 0 auto;
      width: 50%;

      &:hover {
        background: #1f1f1d;
        transform: translateY(-25px);

        & > .title::after {
          width: 100%;
          box-shadow: 0 0 16px #ff8708;
        }
      }

      .title {
        font-size: 24px;
        line-height: 36px;
        padding: 0 0 24px;
        position: relative;
        margin-bottom: 1.5rem;
        font-weight: 700;

        &::after {
          content: '';
          height: 4px;
          width: 40px;
          background: var(--gradient-color);
          position: absolute;
          left: 0;
          bottom: 0;
          transition: all ease-in-out 0.3s;
        }
      }

      .text {
        line-height: 32px;
        margin-bottom: 0;
        color: #fffc;
      }
    }
  }
}
</style>
