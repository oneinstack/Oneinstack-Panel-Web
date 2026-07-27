<script setup lang="ts">
interface Props {
  placeholder?: string
}

interface Emits {
  (event: 'search', value: string): void
}

const emit = defineEmits<Emits>()

withDefaults(defineProps<Props>(), {
  placeholder: 'Please Input'
})

const searchValue = defineModel('modelValue', {
  type: String,
  default: ''
})

const handleSearch = () => {
  emit('search', searchValue.value)
}
</script>

<template>
  <el-input
    v-model="searchValue"
    :placeholder="placeholder"
    clearable
    @keydown.enter="handleSearch"
    @clear="handleSearch"
  >
    <template #suffix>
      <v-s-icon name="search" size="16" class="cursor-pointer" @click="handleSearch" />
    </template>
  </el-input>
</template>

<style scoped lang="less">
.el-input {
  --el-input-width: 280px;
  --el-input-height: 40px;
  --el-input-text-color: var(--text-primary);
  font-size: 13px;

  :deep(.el-input__wrapper) {
    padding-inline: 14px;
    border-radius: 10px;
    background: var(--surface-card);
    box-shadow: 0 0 0 1px var(--border-default) inset;

    &:hover {
      box-shadow: 0 0 0 1px var(--border-strong) inset;
    }

    &.is-focus {
      box-shadow:
        0 0 0 1px rgb(var(--primary-color)) inset,
        0 0 0 4px var(--focus-ring);
    }
  }
}

@media (max-width: 600px) {
  .el-input {
    --el-input-width: 100%;
  }
}
</style>
