<template>
  <x-page noHeader>
    <div class="navbar">
      <img class="logo" src="/static/img/game/animal/open/logo-lg2p9VKN.svg" />
    </div>
    <div class="cardinfo">
      <!-- 游戏标题 -->
      <div class="card-title">
        <div class="card-text">
          <img
            src="data:image/svg+xml,%3csvg%20width='1470'%20height='1466'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20overflow='hidden'%3e%3cdefs%3e%3clinearGradient%20x1='1419.76'%20y1='473.546'%20x2='2948.81'%20y2='1872.94'%20gradientUnits='userSpaceOnUse'%20spreadMethod='reflect'%20id='fill0'%3e%3cstop%20offset='0'%20stop-color='%23FFB800'%20stop-opacity='0.4'/%3e%3cstop%20offset='0.5'%20stop-color='%23FFB000'%20stop-opacity='0.4'/%3e%3cstop%20offset='1'%20stop-color='%23FFA800'%20stop-opacity='0.4'/%3e%3c/linearGradient%3e%3c/defs%3e%3cg%20transform='translate(-1449%20-440)'%3e%3cpath%20d='M1806.56%201236.57C1769.82%201240.19%201700.95%201256.42%201663.24%201289.61%201550.12%201387.77%201617.86%201567.23%201846.41%201567.23%201979.18%201567.23%202111.99%201482.5%202216.17%201347.03%202068.28%201274.81%201942.54%201223.1%201806.56%201236.57ZM2659.32%201360.62C2870.82%201431.24%202918.79%201434.93%202918.79%201434.93L2918.79%20675.633C2918.79%20644.794%202912.7%20614.259%202900.89%20585.771%202889.08%20557.282%202871.77%20531.399%202849.95%20509.599%202828.15%20487.774%202802.26%20470.461%202773.75%20458.646%202745.24%20446.831%202714.69%20440.747%202683.83%20440.744L1684.73%20440.744C1622.42%20440.744%201562.66%20465.492%201518.6%20509.541%201474.54%20553.591%201449.78%20613.336%201449.78%20675.633L1449.78%201670.96C1449.79%201701.8%201455.87%201732.32%201467.68%201760.82%201479.49%201789.32%201496.8%201815.19%201518.62%201837%201540.44%201858.8%201566.34%201876.09%201594.84%201887.89%201623.34%201899.68%201653.89%201905.74%201684.73%201905.74L2683.54%201905.74C2714.38%201905.74%202744.93%201899.68%202773.43%201887.89%202801.92%201876.09%202827.83%201858.8%202849.63%201837%202871.45%201815.19%202888.76%201789.3%202900.56%201760.82%202912.36%201732.32%202918.45%201701.79%202918.45%201670.96L2918.45%201661.28C2918.45%201661.28%202536.41%201502.52%202343.43%201410.04%202214.03%201568.7%202047.08%201665.09%201873.57%201665.09%201580.5%201665.09%201480.95%201409.45%201619.67%201241.07%201649.96%201204.44%201701.49%201169.38%201781.35%201149.75%201906.3%201119.13%202105.25%201168.9%202291.6%201230.19%202326.28%201166.15%202354%201098.58%202374.29%201028.64L1800.01%201028.64%201800.01%20970.54%202095.87%20970.54%202095.87%20866.131%201737.93%20866.131%201737.93%20808.704%202096.6%20808.704%202096.6%20660.202C2096.56%20656.876%202097.2%20653.576%202098.46%20650.502%202099.73%20647.427%202101.62%20644.64%202103.98%20642.308%202106.36%20639.978%202109.18%20638.15%202112.27%20636.937%202115.37%20635.723%202118.69%20635.149%202122%20635.248L2266.78%20635.248%202266.78%20808.704%202621.46%20808.704%202621.46%20866.718%202266.78%20866.718%202266.78%20971.119%202556.35%20971.119C2530.26%201079.3%202488.98%201183.25%202433.74%201279.85%202521.67%201311.49%202600.45%201341.52%202659.32%201361.2L2659.32%201360.62Z'%20fill='url(%23fill0)'%20fill-rule='evenodd'/%3e%3c/g%3e%3c/svg%3e"
            alt="logo2"
          />
          彩票频道主办
        </div>
        <div class="card-player">
          <img src="/static/img/game/animal/open/player-BxBjoPF0.svg" alt="参赛选手" />
          <h1 class="player-title">参赛选手</h1>
        </div>
      </div>
      <!-- 参赛选手 -->
      <div class="card-container">
        <div class="card" v-for="(item, index) in conf.player.list">
          <div class="photo column">
            <img :src="`/static/img/game/animal/open/${item.img}.png`" />
            <div class="absolute-bottom text-center" style="margin-left: -6rem">
              <h1 class="photo-title">{{ item.title }}</h1>
              <h1 class="photo-Etitle">{{ item.Etitle }}</h1>
            </div>
          </div>
          <div class="col relative fit-height">
            &nbsp;
            <div class="conten-photo">
              <img class="conten-number" src="/static/img/game/animal/open/player-DeFBy5WI.gif" />
              <img class="conten-playernum" :src="playerImg[index]" />
            </div>
            <div class="player-content absolute-bottom-left">
              <h1 class="content-title">{{ item.title }}</h1>
              <h1 class="content-Etitle">{{ item.Etitle }}</h1>
              <p>{{ item.content }}</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 游戏信息 -->
      <div class="row headtags">
        <div class="flex flex-center relative" style="width: 80rem">
          <img class="absolute" src="/static/img/game/animal/open/images/3d.svg" style="width: 40rem" />
          <img class="absolute" src="/static/img/game/animal/open/images/button.png" style="width: 100%" />
        </div>
        <div class="col column flex-center" style="font-size: 26rem; font-weight: bolder">
          <div>2025/01/10 星期五</div>
          <div>10:00:05</div>
        </div>
        <div class="col column flex-center">
          <div style="font-size: 28rem; color: #531dc1">赛场实况(60秒/场)</div>
          <div style="font-size: 18rem">(35秒竞猜+20秒比赛+5秒颁奖)</div>
        </div>
      </div>
      <!-- 游戏动画 -->
      <div style="background: linear-gradient(to top, #f7e1ac, #fdf4e1); padding: 20rem 10rem">
        <div style="height: 810rem"></div>
      </div>
      <!-- 往期数据 -->
      <div class="row items-center hisdata justify-between">
        <div class="row items-center">
          <img class="left-img" src="/static/img/game/animal/open/player-DxPp290A.png" />
          <div class="left-title">往期数据</div>
        </div>
        <div class="row right-box">
          <div class="date-item">今天</div>
          <div class="date-item">昨天</div>
          <div class="chosedate">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
              <path
                fill="currentColor"
                d="M128 384v512h768V192H768v32a32 32 0 1 1-64 0v-32H320v32a32 32 0 0 1-64 0v-32H128v128h768v64zm192-256h384V96a32 32 0 1 1 64 0v32h160a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h160V96a32 32 0 0 1 64 0zm-32 384h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64"
              ></path>
            </svg>
            <div class="date-text">2025-01-10</div>
          </div>
        </div>
      </div>

      <div style="background: linear-gradient(to top, #fdf4e1, #f7e1ac)">
        <!-- 参赛动物队列号 -->
        <div class="title-line">
          <div class="line"></div>
          <div>参赛动物队列号</div>
          <div class="line"></div>
        </div>
        <div class="row playerinfo">
          <div class="column items-center" v-for="(item, index) in conf.player.list">
            <div class="flex justify-center items-end playerimg">
              <img :src="`/static/img/game/animal/open/${item.img}.png`" style="height: 92%" />
            </div>
            <div class="playertitle flex items-center">
              <div class="player-round flex flex-center" :class="`t-${index + 1}`">
                {{ index + 1 }}
              </div>
              <div class="col flex flex-center" style="font-size: 22rem">{{ item.title }}</div>
            </div>
          </div>
        </div>

        <!-- 开奖记录 -->
        <div class=""></div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'

const playerImg = {
  0: `data:image/svg+xml,%3csvg%20width='115'%20height='115'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20overflow='hidden'%3e%3cg%20transform='translate(-760%20-526)'%3e%3cpath%20d='M796%20539.127%20833.589%20539C834.61%20558.033%20833.394%20599.737%20833.505%20630%20825.37%20629.663%20818.959%20629.916%20808.474%20629.831%20808.474%20629.831%20808.252%20583.762%20808.14%20561.149%20803.802%20561.149%20801.618%20561.88%20796.167%20560.938%20795.764%20553.105%20796.821%20546.538%20796%20539.127Z'%20fill='%23FFFFFF'%20fill-rule='evenodd'/%3e%3c/g%3e%3c/svg%3e`,
  1: `data:image/svg+xml,%3csvg%20width='115'%20height='115'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20overflow='hidden'%3e%3cg%20transform='translate(-1550%20-503)'%3e%3cpath%20d='M1598.32%20546.771C1593.27%20546.446%201575.69%20546.715%201570.24%20546.941%201569.36%20538.758%201570.92%20531.933%201573.99%20526.214%201577.05%20520.494%201582.55%20515.453%201588.62%20512.622%201594.69%20509.79%201603.48%20508.431%201610.4%20509.224%201617.32%20510.016%201625.14%20513.698%201630.13%20517.379%201635.12%20521.06%201638.64%20525.76%201640.34%20531.311%201642.04%20536.861%201641.82%20544.846%201640.34%20550.679%201638.87%20556.512%201635.41%20561.213%201631.49%20566.31%201627.58%20571.407%201621.06%20578.996%201616.86%20581.261%201625.14%20581.261%201637.34%20582.082%201641.7%20581.261%201641.8%20588.822%201641.9%20596.382%201642%20603.943L1573.45%20605C1582.99%20592.759%201593.16%20577.964%201609.04%20557.815%201611.19%20552.038%201614.37%20544.641%201614.22%20540.485%201614.08%20536.33%201610.64%20534.241%201608.14%20532.882%201606.5%20532.372%201602.59%20531.502%201600.95%20533.817%201599.32%20536.131%201597.41%20541.363%201598.32%20546.771Z'%20fill='%23FFFFFF'%20fill-rule='evenodd'/%3e%3c/g%3e%3c/svg%3e`,
  2: `data:image/svg+xml,%3csvg%20width='115'%20height='115'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20overflow='hidden'%3e%3cg%20transform='translate(-1969%20-539)'%3e%3cpath%20d='M2018.83%20577.839C2014.51%20578.551%201999.19%20578.024%201994.58%20578.651%201994.39%20571.761%201996.06%20564.053%202000%20559.156%202004.98%20552.551%202010.4%20549.433%202017.02%20547.455%202023.63%20545.476%202032.66%20545.611%202039.69%20547.284%202046.72%20548.956%202052.33%20553.355%202055.4%20558.771%202058.48%20564.188%202058.77%20571.967%202058.14%20579.782%202057.51%20587.598%202051.19%20588.836%202050.35%20591.569%202053.38%20593.505%202056.15%20594.971%202058.4%20598.445%202060.64%20601.918%202063.32%20607.861%202063.83%20612.409%202064.34%20616.957%202063.73%20621.392%202061.47%20625.733%202059.22%20630.075%202055.53%20635.1%202050.31%20638.459%202045.08%20641.819%202036.97%20645.335%202030.12%20645.89%202023.28%20646.445%202015.35%20644.865%202009.22%20641.791%202003.1%20638.716%201996.75%20632.908%201993.38%20627.442%201990.01%20621.975%201989.22%20613.036%201989%20608.993%201998.33%20609.221%202009.79%20608.708%202016.98%20609.676%202016.96%20612.231%202016.6%20614.171%202017.88%20616.274%202019.16%20618.377%202021.96%20621.602%202024.67%20622.296%202027.37%20622.99%202031.93%20622.086%202034.1%20620.438%202036.28%20618.79%202037.69%20615.157%202037.71%20612.409%202037.73%20609.662%202036.09%20605.804%202034.21%20603.954%202032.34%20602.103%202028.52%20601.551%202026.46%20601.306%202024.4%20601.06%202022.46%20603.676%202021.84%20602.48%202022.18%20596.217%202021.18%20588.416%202021.49%20583.37%202023.4%20583.939%202026.16%20584.11%202028.16%20583.37%202030.17%20582.63%202032.72%20580.985%202033.49%20578.928%202034.27%20576.871%202034.2%20572.8%202032.82%20571.028%202031.44%20569.256%202027.65%20568.181%202025.24%20568.295%202022.82%20568.409%202021.08%20569.48%202020.01%20571.071%202018.94%20572.661%202018.31%20572.644%202018.83%20577.839Z'%20fill='%23FFFFFF'%20fill-rule='evenodd'/%3e%3c/g%3e%3c/svg%3e`,
  3: `data:image/svg+xml,%3csvg%20width='115'%20height='115'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20overflow='hidden'%3e%3cg%20transform='translate(-1687%20-496)'%3e%3cpath%20d='M1750.55%20528.664%201732.33%20558.894%201750.13%20558.48C1750.27%20548.542%201750.41%20538.603%201750.55%20528.664ZM1772.27%20507%201773.02%20559.343C1778.71%20559.274%201781.49%20559.447%201783.83%20559.447%201783.89%20565.928%201783.94%20572.408%201784%20578.889L1773.27%20579.303C1773.38%20585.708%201773.5%20591.595%201773.61%20598%201769.02%20597.848%201756.92%20597.11%201749.1%20597.441%201749.03%20591.45%201748.96%20585.46%201748.89%20579.469L1706.17%20579.759C1706.08%20574.168%201706.09%20569.303%201706%20563.712%201712.52%20552.987%201726.15%20529.631%201741.57%20507.104Z'%20fill='%23FFFFFF'%20fill-rule='evenodd'/%3e%3c/g%3e%3c/svg%3e`,
  4: `data:image/svg+xml,%3csvg%20width='115'%20height='115'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20overflow='hidden'%3e%3cg%20transform='translate(-2101%20-539)'%3e%3cpath%20d='M2136.98%20546.464%202141.19%20546.464%202186.27%20546%202186.75%20568.886%202155.21%20568.466C2154.74%20570.707%202154.78%20573.36%202154.13%20576.073%202159.28%20575.837%202164.79%20575.148%202169.14%20576.471%202173.48%20577.794%202181.43%20581.299%202185.48%20586.001%202189.52%20590.704%202192.23%20598.963%202193.42%20604.686%202194.6%20610.41%202193.81%20615.732%202192.58%20620.342%202191.36%20624.953%202189.19%20628.859%202186.07%20632.349%202182.94%20635.839%202179.23%20639.174%202173.83%20641.283%202168.43%20643.391%202160.57%20644.92%202153.69%20644.997%202146.81%20645.075%202137.83%20643.302%202132.55%20641.747%202127.27%20640.192%202124.32%20637.523%202122%20635.666%202123.3%20629.497%202125.57%20613.605%202125.99%20607.937%202131.26%20612.89%202136.48%20617.198%202142.22%20619.037%202147.97%20620.876%202156.47%20620.865%202160.45%20618.971%202164.43%20617.077%202166.18%20611.136%202166.11%20607.672%202166.04%20604.207%202163.78%20600.264%202160.03%20598.185%202156.28%20596.107%202149.4%20595.082%202143.6%20595.2%202137.81%20595.318%202133.19%20597.75%202127.15%20599.888L2136.98%20546.464Z'%20fill='%23FFFFFF'%20fill-rule='evenodd'/%3e%3c/g%3e%3c/svg%3e`,
  5: `data:image/svg+xml,%3csvg%20width='114'%20height='115'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20overflow='hidden'%3e%3cg%20transform='translate(-2143%20-758)'%3e%3cpath%20d='M2199.81%20817.922C2192.46%20817.922%202186.5%20823.856%202186.5%20831.176%202186.5%20838.496%202192.46%20844.43%202199.81%20844.43%202207.16%20844.43%202213.12%20838.496%202213.12%20831.176%202213.12%20823.856%202207.16%20817.922%202199.81%20817.922ZM2195.35%20768.088C2206.08%20768.385%202222.84%20768.155%202226.12%20768%202222.74%20771.726%202203.6%20794.141%202199.67%20798.474%202203.27%20797.261%202209.58%20795.921%202214.65%20796.822%202219.72%20797.723%202225.89%20799.243%202230.09%20803.881%202234.28%20808.52%202239.02%20817.181%202239.81%20824.654%202240.6%20832.127%202238.91%20842.181%202234.83%20848.718%202230.75%20855.255%202223.57%20861.255%202215.32%20863.877%202207.08%20866.499%202193.57%20866.695%202185.36%20864.45%202177.16%20862.206%202170.33%20856.715%202166.11%20850.411%202161.9%20844.106%202159.58%20834.542%202160.06%20826.623%202160.55%20818.704%202163.15%20812.653%202169.03%20802.897%202174.92%20793.141%202187.31%20779.764%202195.35%20768.088Z'%20fill='%23FFFFFF'%20fill-rule='evenodd'/%3e%3c/g%3e%3c/svg%3e`
} as any

const conf = reactive({
  player: {
    list: [
      {
        title: '饿小宝',
        Etitle: 'Exiaobao',
        content: '在正规的比赛中，它也能饿着肚子冲线吗？',
        img: 'p1'
      },
      {
        title: '盒 马',
        Etitle: 'Freshipoo',
        content: '它会是稳健的黑马呢，又或者是速度之星呢？',
        img: 'p2'
      },
      {
        title: '票 票',
        Etitle: 'Exiaobao',
        content: '在正规的比赛中，它也能饿着肚子冲线吗？',
        img: 'p3'
      },
      {
        title: '虾 仔',
        Etitle: 'Xiazai',
        content: '速度飞快的小虾仔还会不会再次冲破重围？',
        img: 'p4'
      },
      {
        title: '支小宝',
        Etitle: 'Zhixiaobao',
        content: '聪明的支小宝，在赛场上会有怎样的表现？',
        img: 'p5'
      },
      {
        title: '欢 猩',
        Etitle: 'Huanxing',
        content: '总是带来欢笑的欢猩，这次是否能笑到最后？',
        img: 'p6'
      }
    ]
  }
})

const rem = (val: number) => {
  return val * 2.1 + 'rem'
}
onMounted(() => {
  H5Util.maxWidth = 750
  H5Util.refresh()
})
onUnmounted(() => {
  H5Util.maxWidth = 500
  H5Util.refresh()
})
</script>
<style lang="less" scoped>
.navbar {
  background-image: url(/static/img/game/animal/open/logobackground-C5_PvL0a.png);
  background-size: cover;
  position: relative;
  z-index: 1000;
  padding-left: v-bind('rem(8)');
  height: v-bind('rem(40)');
  min-height: v-bind('rem(40)');
  display: flex;
  align-items: center;
  font-family: Arial, Helvetica, sans-serif;
}
.logo {
  height: v-bind('rem(30)');
}

.cardinfo {
  .card-title {
    background: #f7e1ac;
    height: v-bind('rem(70)');
  }
  .card-text {
    margin: 0 auto;
    padding: v-bind('rem(5)');
    text-align: center;
    color: #61350b;
    font-weight: 500;
    font-size: v-bind('rem(16)');
    display: block;
    border-bottom-left-radius: v-bind('rem(30)');
    border-bottom-right-radius: v-bind('rem(30)');
    width: v-bind('rem(200)');
    height: auto;
    background: linear-gradient(to left, #f9c768, #fae299);
    box-shadow: v-bind('rem(1)') v-bind('rem(1)') v-bind('rem(2)') #00000080;

    img {
      position: relative;
      top: v-bind('rem(3)');
      width: v-bind('rem(23)');
      height: 100%;
    }
  }
  .card-player {
    margin-left: v-bind('rem(18)');
    display: flex;
    align-items: center;
    color: #61350b;

    img {
      margin-right: v-bind('rem(10)');
      width: v-bind('rem(30)');
      height: v-bind('rem(30)');
    }
    .player-title {
      font-size: v-bind('rem(16)');
    }
  }
}

.card-container {
  position: relative;
  padding: 0 v-bind('rem(10)');
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  background: linear-gradient(to top, #fdf4e1, #f7e1ac);
  .card {
    color: #61350b;
    display: flex;
    align-items: center;
    flex: 0 0 calc(33% - v-bind('rem(3)'));
    border: v-bind('rem(3)') solid #ffffff;
    border-radius: v-bind('rem(10)');
    margin-bottom: v-bind('rem(8)');
    box-shadow: 0 v-bind('rem(2)') v-bind('rem(5)') #0000004d;
    overflow: hidden;
    background-size: cover;
    background-position: center;
    height: v-bind('rem(70)');
    max-height: v-bind('rem(70)');
    position: relative;
    cursor: pointer;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #fff0, #fffc, #fff0);
      transition: left 0.3s ease-in-out;
      -webkit-transition: left 0.3s ease-in-out;
      z-index: 0;
    }

    .photo {
      width: v-bind('rem(50)');
      min-width: v-bind('rem(50)');
      height: 100%;
      position: relative;
      display: flex;
      align-items: end;
      justify-content: end;
    }
    .photo > div {
      width: v-bind('rem(50)');
    }
    .photo img {
      width: v-bind('rem(50)');
      transform: scale(1) translate(-8rem, 0rem);
      transition: all 0.1s ease;
    }
    .photo-title {
      font-size: v-bind('rem(10)');
      transition: all 0.1s ease;
      line-height: v-bind('rem(8)');
      opacity: 0;
      transform: translateY(v-bind('rem(30)'));
    }
    .photo-Etitle {
      font-size: v-bind('rem(8)');
      transition: all 0.1s ease;
      opacity: 0;
      transform: translateY(v-bind('rem(30)'));
    }

    .player-content {
      .content-title {
        font-size: v-bind('rem(12.5)');
        transition: all 0.1s ease;
        line-height: v-bind('rem(12.5)');
        opacity: 1;
        transform: translate(-16rem, -10rem);
      }
      .content-Etitle {
        font-size: v-bind('rem(9.8)');
        font-weight: 300;
        margin-top: 1rem;
        letter-spacing: 0.1em;
        transition: all 0.1s ease;
        opacity: 1;
        transform: translate(-16rem, -10rem);
      }
      p {
        position: absolute;
        bottom: 6rem;
        transform: translate(-16rem, 0rem);
        font-size: v-bind('rem(6)');
        opacity: 0;
        transition: all 0.1s ease;
      }
    }

    .conten-photo {
      position: absolute;
      right: 0;
      top: 0;
      .conten-number {
        width: v-bind('rem(28)');
        height: auto;
        position: absolute;
        right: 0;
        top: -4rem;
      }
      .conten-playernum {
        width: v-bind('rem(13)');
        height: v-bind('rem(13)');
        position: absolute;
        right: 15rem;
        top: 14rem;
      }
    }
  }
  .card:hover {
    &::before {
      left: 100%;
    }
    .photo img {
      transform: scale(0.8) translate(-8rem, -43rem);
      border-radius: 50%;
    }
    .photo-title {
      transform: translateY(0);
      opacity: 1;
    }
    .photo-Etitle {
      transform: translateY(0);
      opacity: 1;
    }
    .player-content {
      width: 100%;
      .content-title {
        transform: translate(-16rem, 10rem);
        opacity: 0;
      }
      .content-Etitle {
        transform: translate(-16rem, 10rem);
        opacity: 0;
      }
      p {
        opacity: 1;
      }
    }
  }
}

.headtags {
  background: #eac97fa6;
  color: #61350b;
  font-weight: bolder;
  height: 80rem;
  font-size: 16rem;
}

.hisdata {
  background: #eac97fa6;
  padding: 10rem;
  color: #fff;
  .left-img {
    width: 100%;
    height: 60rem;
    width: 60rem;
    margin-left: 20rem;
  }
  .left-title {
    font-size: 30rem;
    font-weight: bolder;
    margin-left: 10rem;
  }
  .right-box {
    font-size: 26rem;
    .date-item {
      padding: 0 10rem;
    }
    .date-item:hover {
      color: #61350b;
      cursor: pointer;
    }
  }

  .chosedate {
    background: #fff;
    padding: 0 10rem;
    color: #5f5d5d;
    height: 40rem;
    display: flex;
    align-items: center;
    margin-left: 10rem;
    .icon {
      width: 30rem;
    }
    .date-text {
      font-size: 22rem;
      font-weight: bolder;
      margin-left: 10rem;
    }
  }
}

.title-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rem 30rem;
  color: #61350b;
  font-size: 24rem;
  font-weight: bolder;
  .line {
    border: 1px rgba(97, 53, 11, 0.3) solid;
    width: 200rem;
    display: inline-block;
    position: relative;
  }
}

.playerinfo {
  .playerimg {
    width: 80rem;
    height: 80rem;
    border-radius: 50%;
    background: #f3cbcb;
    overflow: hidden;
    margin-bottom: 6rem;
  }
  .playertitle {
    background: linear-gradient(to right, #edb02c, #fbdc92);
    border-radius: 125rem;
    width: 125rem;
    height: 50rem;
    position: relative;
    .player-round {
      width: 50rem;
      height: 50rem;
      border-radius: 50%;
      color: #fff;
      font-size: 30rem;
    }
    .t-1 {
      background-color: #e60000;
    }
    .t-2 {
      background-color: #002fa7;
    }
    .t-3 {
      background-color: #01847f;
    }
    .t-4 {
      background-color: #fbd26a;
    }
    .t-5 {
      background-color: #90f;
    }
    .t-6 {
      background-color: #8f4b28;
    }
  }
}
</style>
