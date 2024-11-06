<script setup>
defineProps({
  type: {
    type: String,
    default: 'hot',
  },
})
</script>

<template>
  <div :class="`base-tag type-${type}`">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.base-tag {
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;

  &.type-hot {
    background-color: #ff2e3a;
  }

  &.type-new {
    background-color: #ff8708;
  }

  &.type-buy {
    background-color: #ffb800;
  }
}
</style>
