<template>
  <async-content :loader="loadTerminal" recovery-target="/terminal" resource-key="secure-terminal" />
</template>

<script setup lang="ts">
import AsyncContent from '@/components/async-content.vue'

const loadTerminal = () => import('./components/terminal.vue')
</script>
