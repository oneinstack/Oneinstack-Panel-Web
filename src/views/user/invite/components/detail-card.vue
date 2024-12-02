<template>
  <div class="detail-card-container">
    <div class="row">
      <img v-if="data.avatar" :src="data.avatar" mode="scaleToFill" class="avatar-cell" />
      <div class="cell-name">
        <div class="name">{{ data.name }}</div>
        <div v-if="data.time" class="time">{{ `${$t('invite.RegistrationTime')}: ${data.time}` }}</div>
      </div>
    </div>
    <template v-if="data && data.cell && data.cell.length">
      <div v-for="item in data.cell" :key="item.label" class="cell-value">
        <div class="value" :class="{ time: item.isTime }">{{ item.value }}</div>
        <div class="label">{{ item.label }}</div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: () => ({
        name: '',
        time: undefined,
        cell: []
      })
    }
  }
}
</script>

<style scoped lang="less">
.detail-card-container {
  padding: 0 32rem;
  height: 132rem;
  border-radius: 12rem;
  background-color: #ffffff;
  font-family: PingFang SC;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .avatar-cell {
    width: 72rem;
    height: 72rem;
    border-radius: 50%;
    background-color: #f5f5f5;
    margin-right: 20rem;
  }

  .cell-name {
    .name {
      width: 210rem;
      font-size: 24rem;
      font-weight: 600;
      line-height: 32rem;
      margin-bottom: 4rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time {
      font-size: 20rem;
      line-height: 28rem;
      color: #999999;
    }
  }

  .cell-value {
    font-size: 28rem;
    font-weight: 500;
    line-height: 38rem;
    letter-spacing: 0.045em;
    text-align: center;

    .value {
      margin-bottom: 4rem;
      color: #fc9b01;

      &.time {
        font-size: 20rem;
      }
    }

    .label {
      font-size: 20rem;
      color: #333333;
    }
  }
}
</style>
