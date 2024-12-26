<template>
    <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
      <template #title>
        {{ $t('promotions.luckyBox') }}
      </template>
  
      <div class="column" style="gap: 20rem; font-size: 30rem; padding: 30rem">
        <div>
          {{ $t('luckyBox.rule') }}
        </div>
      </div>
    </x-page>
  </template>
  <script setup lang="ts">
  import stheme from '@/sstore/stheme'
  </script>
  