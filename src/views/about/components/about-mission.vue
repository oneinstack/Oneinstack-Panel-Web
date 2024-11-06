<script setup></script>

<template>
  <div class="about-mission-container">
    <div class="container row">
      <div class="desc">
        <h4 class="mission-title">我们的使命</h4>
        <h3 class="mission-slogan">
          “Just Do the Best“ 是BG夺宝电子的座右铭。
        </h3>
        <div class="mission-texts">
          <p class="text">
            为持续成为产业的领先者，我们以更高的标准鞭策自己。我们将BG夺宝电子的三大核心要素注入成为品牌的血液，Innovate
            / Challenge / Evolve
            持续创新、拥抱挑战、展翅进化，贯彻品牌核心目标。
          </p>
          <p class="text">
            期许BG夺宝电子成为你不可或缺的线上娱乐解决方案伙伴，共同在国际上闪耀光芒！
          </p>
        </div>
      </div>
      <div class="list">
        <div class="list-item">
          <h4 class="title">创新</h4>
          <ul>
            <li class="text">点燃游戏中的新可能。</li>
          </ul>
        </div>
        <div class="list-item">
          <h4 class="title">挑战</h4>
          <ul>
            <li class="text">突破界限，缔造难忘体验。</li>
          </ul>
        </div>
        <div class="list-item">
          <h4 class="title">进化</h4>
          <ul>
            <li class="text">拥抱变革，迈向游戏进化的下一个层次。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-mission-container {
  padding: 160px 0 120px;
  background: url('/images/mission-bg.png') center center no-repeat;
  background-size: cover;

  .container {
    margin: 0 auto;
    width: 1320px;
    display: flex;

    .desc {
      flex: 0.5;

      .mission-title {
        font-size: 40px;
        text-align: center;
        margin-bottom: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .mission-slogan {
        font-size: 55px;
        background-image: var(--gradient-color);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .text {
        padding: 32px;
        line-height: 28px;
        text-align: center;
        margin-bottom: 0;
        color: #fffc;
      }
    }

    .list {
      padding: 32px;
      margin: 0 0 32px;
      flex: 0.5;
      display: flex;
      flex-flow: column nowrap;

      &-item {
        padding: 32px;
        background: rgba(46, 46, 44, 0.6);
        box-shadow:
          0 0 2px #ffffff3d,
          0 0 16px #0000007a;
        border-radius: 8px;
        border: 2px solid rgba(46, 46, 44, 0.6);
        transition: all ease-in-out 0.3s;
        margin-bottom: 1rem;

        &:hover {
          background: #141413;
          border: 2px solid #ff8708;
          box-shadow: 0 0 16px #ff8708;
        }

        .title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 1rem;
          line-height: 1.2;
          margin-top: 0;
        }

        ul {
          margin-top: 0;
          margin-bottom: 1rem;
          padding-left: 2rem;
          color: #fffc;
          list-style-type: disc;

          .text {
            position: relative;
            line-height: 32px;
            margin-bottom: 0.5rem;
            display: list-item;
            text-align: -webkit-match-parent;
            unicode-bidi: isolate;

            &::marker {
              content: '';
              unicode-bidi: isolate;
              font-variant-numeric: tabular-nums;
              text-transform: none;
              text-indent: 0px !important;
              text-align: start !important;
              text-align-last: start !important;
            }

            &::after {
              content: '';
              border: 2px solid #ff8708;
              border-radius: 50%;
              width: 12px;
              height: 12px;
              position: absolute;
              top: 8px;
              left: -22px;
            }
          }
        }
      }
    }
  }
}
</style>
