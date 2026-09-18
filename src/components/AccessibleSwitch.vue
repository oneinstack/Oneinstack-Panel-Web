<script setup lang="ts">
withDefaults(defineProps<{
  id: string
  disabled?: boolean
  ariaLabel?: string
}>(), {
  disabled: false,
  ariaLabel: undefined
})

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="accessible-switch" :class="{ 'is-disabled': disabled }">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      role="switch"
      :aria-checked="model"
      :aria-label="ariaLabel"
      :disabled="disabled"
    />
    <span class="accessible-switch__track" aria-hidden="true">
      <span class="accessible-switch__thumb" />
    </span>
  </label>
</template>

<style scoped lang="less">
.accessible-switch {
  --accessible-switch-on-color: var(--el-color-primary, #409eff);
  --accessible-switch-off-color: var(--el-border-color, #dcdfe6);

  position: relative;
  display: inline-flex;
  width: 40px;
  height: 20px;
  align-items: center;
  vertical-align: middle;

  input {
    position: absolute;
    z-index: 1;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
    opacity: 0;
  }

  &__track {
    box-sizing: border-box;
    display: inline-flex;
    width: 100%;
    height: 100%;
    align-items: center;
    border: 1px solid var(--accessible-switch-off-color);
    border-radius: 10px;
    background-color: var(--accessible-switch-off-color);
    transition: border-color 0.3s, background-color 0.3s;
  }

  &__thumb {
    width: 16px;
    height: 16px;
    margin-left: 1px;
    border-radius: 50%;
    background-color: var(--el-color-white, #fff);
    transition: transform 0.3s;
  }

  input:checked + &__track {
    border-color: var(--accessible-switch-on-color);
    background-color: var(--accessible-switch-on-color);
  }

  input:checked + &__track &__thumb {
    transform: translateX(20px);
  }

  input:focus-visible + &__track {
    outline: 2px solid var(--el-color-primary-light-5, #a0cfff);
    outline-offset: 2px;
  }

  &.is-disabled {
    opacity: 0.6;

    input {
      cursor: not-allowed;
    }
  }
}
</style>
