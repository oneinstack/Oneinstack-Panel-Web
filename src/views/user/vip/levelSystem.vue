<template>
  <x-page>
    <template #title>
      {{ 'VIP Level System' }}
    </template>
    <div class="container">
      <div class="level-groups">
        <div class="level-group bronze" v-for="(item,itemIndex) in conf.otherGroups" :key="itemIndex">
          <div class="group-header" @click="conf.toggleGroup(item.type)">
            <div class="left">
              <img src="/static/theme/black/vip/level-left.png" alt="Bronze" class="flag-icon" />
              <span>{{item.name}}</span>
            </div>
            <van-icon name="arrow" :class="['arrow', { 'rotated': conf.openGroups[item.type] }]" />
          </div>
          <div class="group-content" v-show="conf.openGroups[item.type]">
            <div class="title-box">
              <div>Level</div>
              <div>Required XP</div>
            </div>
            <div class="level-item" v-for="level in conf.bronzeLevels" :key="level.id">
              <div class="level-info">
                <img :src="level.icon" alt="Level" class="level-icon" />
                <span>{{ level.name }}</span>
              </div>
              <div class="required-xp">{{ level.xp }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { index } from './levelSystem'
const conf = index()
</script>

<style lang="less" scoped>
.container {
  padding: 35rem 30rem;
  color: #fff;
  font-family: Poppins;

  .level-groups {
    .level-group {
      background: #323738;
      border-radius: 20rem;
      margin-bottom: 16rem;

      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        // padding: 20rem 20rem 20rem 0;
        cursor: pointer;
        height: 76rem;

        .left {
          display: flex;
          align-items: center;
          gap: 12rem;

          .flag-icon {
            width: 48rem;
            height: 32rem;
          }

          span {
            font-size: 24rem;
            font-style: normal;
            font-weight: 600;
            line-height: normal;
          }
        }

        .arrow {
          margin-right: 20rem;
          width: 20rem;
          height: 20rem;
          transition: transform 0.3s;

          &.rotated {
            transform: rotate(90deg);
          }
        }
      }

      .group-content {
        .title-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #bfbfbf;
          font-family: 'PingFang SC';
          font-size: 20rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          margin: 10rem 0;
          padding: 10rem 20rem;
        }

        .level-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 24rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          height: 68rem;
          padding: 10rem 20rem;

          &:nth-child(even) {
            background: #373e3f;
          }
          &:nth-child(odd) {
            background: #323738;
          }

          .level-info {
            display: flex;
            align-items: center;
            gap: 12rem;

            .level-icon {
              width: 36rem;
              height: 36rem;
            }
          }
        }
      }
    }
  }
}
</style>
