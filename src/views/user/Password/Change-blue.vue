<template>
  <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('me.Password') }}
    </template>

    <van-cell-group inset>
      <van-cell @click="conf.handleClick('PersonalInformation')" is-link>
        <template #title>
          <span class="title">
            {{ $t('PersonalInformation.title') }}
          </span>
        </template>
        <template #value>
          <span class="bolok" v-if="!conf.isUserInfo">{{ $t('home.unbound') }}</span>
        </template>
      </van-cell>
      <van-cell @click="conf.handleClick('Phone')" is-link>
        <template #title>
          <span class="title">
            {{ $t('addBankCradModule.Phone') }}
          </span>
        </template>
        <template #value>
          <span :class="{ bolok: !conf.phone }">
            {{ conf.phone.length > 0 ? '+' + conf.areaCode + ' | ' + conf.phone : $t('home.unbound') }}
          </span>
        </template>
      </van-cell>
      <van-cell @click="conf.handleClick('Email')" is-link>
        <template #title>
          <span class="title">
            {{ $t('login.email') }}
          </span>
        </template>
        <template #value>
          <span :class="{ 'bolok': !conf.email }">{{ conf.email || $t('home.unbound') }}</span>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset>
      <van-cell @click="conf.handleClick('Account')" is-link>
        <template #title>
          <span class="title">
            {{ $t('passwordModule.Account') }}
          </span>
        </template>
        <template #value>
          <span class="bolok" v-if="!conf.statusObj.userPasswordStatus">{{ $t('home.unbound') }}</span>
        </template>
      </van-cell>
      <van-cell @click="conf.handleClick('Payment')" is-link>
        <template #title>
          <span class="title">
            {{ $t('passwordModule.Payment') }}
          </span>
        </template>
        <template #value>
          <span class="bolok" v-if="!conf.statusObj.userWithdrawPasswordStatus">{{ $t('home.unbound') }}</span>
        </template>
      </van-cell>
    </van-cell-group>
  </x-page>
</template>
<script lang="ts" setup>
import { index } from './Change'
import stheme from '@/sstore/stheme'

const conf = index()
</script>
<style lang="less" scoped>
.bolok {
  background-color: #ff0000;
  color: #fff;
  font-size: 22rem;
  width: 124rem;
  height: 34rem;
  text-align: center;
  border-radius: 30rem;
  padding: 0rem 10rem;
}
.title {
  font-weight: 500;
}

.van-cell-group {
  --van-cell-group-inset-padding: 32rem 32rem 0;
}

.van-cell {
  &::after {
    content: none;
  }
}
</style>
