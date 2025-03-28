<template>
  <div class="card">
    <div class="left">
      <p class="name">当前使用率</p>
      <p class="rate">38.7%</p>
      <p class="num">剩余：5.67GB</p>
    </div>
    <div class="right">
      <ECharts :option="option" />
    </div>
  </div>
</template>
<script setup lang="ts">
import echarts, { ECOption } from '@/components/ECharts/config/index'
import ECharts from '@/components/ECharts/index.vue'
const option:ECOption = {
        series: [
          {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "100%",
            zlevel: 2,
            pointer: {
              show: false,
            },
            progress: {
              show: true,
              overlap: false,
              roundCap: true,
              clip: false,
              itemStyle: {
                borderWidth: 0,
                color: '#F98F18',
              },
            },
            axisLine: {
              lineStyle: {
                width: 15,
                color: [
                  [
                    1,
                    `#DCDCDC`,
                  ],
                ],
              },
            },
            splitLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
              distance: 50,
            },
            data:[38.7],
            title: {
              fontSize: 12,
              color: '#F98F18',
              offsetCenter: [0, "30%"],
            },
            detail: {
              width: 100,
              height: 100,
              borderWidth: 0,
              offsetCenter: [0, "70%"],
              rich: {
                a: {
                  fontSize: 18,
                  color: '#F98F18',
                  fontWeight: 500,
                },
                b: {
                  fontSize: 18,
                  color: '#F98F18',
                  fontWeight: 500,
                  // padding: [5, 0, 0, 0],
                },
              },
              formatter: (value:any) => {
                const int = value.toFixed(2).split(".")[0];
                const flt = value.toFixed(1).split(".")[1];
                return `{a|${int}}{b|.${flt}%}`;
              },
              valueAnimation: true,
            },
          },
          {
            animationType: "scale",
            color: `#ffffff`,
            name: "Access From",
            type: "pie",
            radius: "75%",
            label: {
              show: false,
            },
            labelLine: {
              show: false,
            },
            data: [{ value: 100, name: "Search Engine" }],
          },
        ],
      };
</script>
<style lang="less" scoped>
.card {
  height: 238rem;
  background: #ffffff;
  width: 686rem;
  margin: 0 auto;
  margin-top: 20rem;
  border-radius: 12rem;
  padding: 0 56rem 0 32rem;
  display: flex;
  justify-content: space-between;
  .left {
    margin-top: 32rem;
    .name {
      font-size: 24rem;
      font-weight: 700;
    }
    .rate {
      margin-top: 40rem;
      font-size: 48rem;
      color: #f98f18;
      line-height: 42rem;
    }
    .num {
      margin-top: 40rem;
      color: #9c9c9c;
      line-height: 20rem;
    }
  }
}
</style>
