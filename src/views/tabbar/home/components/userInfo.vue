<template>
  <div class="user_info">
    <div class="left">
      <div class="avatar">
        <van-image round width="86rem" height="86rem" src="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg" />
      </div>
      <div class="info">
        <p class="name">李好</p>
        <p class="server_url">我是服务器地址</p>
      </div>
    </div>
    <div class="right">
      <van-image width="40rem" height="40rem" src="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg" />
    </div>
  </div>
</template>
<style lang="less" scoped>
.user_info {
  margin-top: 132rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rem;
  .left {
    display: flex;
    align-items: center;
    .avatar {
      border: 4rem solid #ffffff;
      border-radius: 50%;
      height: 96rem;
      width: 96rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .info {
      color: #ffffff;
      margin-left: 32rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 96rem;
      .name {
        font-size: 32rem;
      }
      .server_url {
        font-size: 28rem;
      }
    }
  }
  .right {
    background: #ffffff;
    border-radius: 8rem;
    width: 64rem;
    height: 64rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
