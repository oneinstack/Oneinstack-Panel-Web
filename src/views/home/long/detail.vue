<template>
  <x-page>
    <template #title>
      {{ $t('LongQueue.desc') }}
    </template>

    <div class="content column" style="gap: 20rem">
      <div>
        {{ $t('LongQueue.desca1') }}
      </div>
      <div>
        {{ $t('LongQueue.desca2') }}
      </div>
      <div class="long-ico">{{ $t('LongQueue.desca3') }}</div>
      <div class="long-tab">
        {{ $t('LongQueue.desca4') }}
      </div>
      <div class="long-ico">{{ $t('LongQueue.desca5') }}</div>
      <div class="long-tab">
        {{ $t('LongQueue.desca6') }}
      </div>
      <div class="long-ico">{{ $t('LongQueue.desca7') }}</div>
      <div class="long-tab">
        {{ $t('LongQueue.desca8') }}
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts"></script>

<style lang="less" scoped>
.content {
  font-size: 30rem;
  padding: 30rem;
}
.long-ico {
  color: #ffaf14;
  padding-left: 60rem;
  font-weight: bold;
}
.long-tab {
  padding-left: 60rem;
}
</style>
