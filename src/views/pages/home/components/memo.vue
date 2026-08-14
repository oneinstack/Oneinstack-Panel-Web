<script setup lang="ts">
import { computed, ref } from 'vue'
import CustomDialog from '@/components/custom-dialog.vue'

interface Props {
  show: boolean
  memo: {
    id: number
    content: string
  }
  close: () => void
  update: () => void
}

const props = defineProps<Props>()

const textareaRef = ref<HTMLTextAreaElement>()
const gutterRef = ref<HTMLDivElement>()

const lineNumbers = computed(() => {
  const content = String(props.memo?.content || '')
  const count = Math.max(content.split('\n').length, 18)
  return Array.from({ length: count }, (_, index) => index + 1)
})

const handleEditorScroll = () => {
  if (!textareaRef.value || !gutterRef.value) return
  gutterRef.value.scrollTop = textareaRef.value.scrollTop
}

const handleSaveShortcut = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    props.update()
  }
}
</script>

<template>
  <custom-dialog :show="show" :title="$t('home.memo')" width="624px" :show-close="false" @update:show="close">
    <div class="memo-editor__hint">{{ $t('home.memoShortcutHint') }}</div>
    <div class="memo-editor">
      <div ref="gutterRef" class="memo-editor__gutter" aria-hidden="true">
        <span v-for="line in lineNumbers" :key="line">{{ line }}</span>
      </div>
      <textarea
        ref="textareaRef"
        v-model="memo.content"
        class="memo-editor__input"
        :placeholder="$t('home.memoPlaceholder')"
        spellcheck="false"
        @keydown="handleSaveShortcut"
        @scroll="handleEditorScroll"
      />
    </div>
    <template #footer>
      <el-button type="primary" @click="update">{{ $t('common.save') }}</el-button>
      <el-button @click="close">{{ $t('common.cancel') }}</el-button>
    </template>
  </custom-dialog>
</template>

<style scoped lang="less">
.memo-editor__hint {
  margin-bottom: 14px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
}

.memo-editor {
  height: 620px;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 10px 24px rgba(15, 23, 42, 0.04);
}

.memo-editor__gutter {
  height: 100%;
  padding: 14px 14px 14px 0;
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.96));
  text-align: right;
  overflow: hidden;
  user-select: none;

  span {
    display: block;
    height: 34px;
    color: #94a3b8;
    font-size: 14px;
    font-weight: 500;
    line-height: 34px;
    font-variant-numeric: tabular-nums;
  }
}

.memo-editor__input {
  width: 100%;
  height: 100%;
  padding: 14px 24px;
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;
  overflow-x: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.98)),
    repeating-linear-gradient(
      180deg,
      transparent 0,
      transparent 33px,
      rgba(226, 232, 240, 0.9) 33px,
      rgba(226, 232, 240, 0.9) 34px
    );
  color: var(--text-primary);
  font-size: 15px;
  letter-spacing: 0.01em;
  line-height: 34px;
  font-family: "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", monospace;
  caret-color: rgb(var(--primary-color));
  background-attachment: local;

  &::placeholder {
    color: var(--text-tertiary);
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    border: 2px solid transparent;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.3);
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

@media (max-width: 768px) {
  .memo-editor__hint {
    margin-bottom: 12px;
    font-size: 14px;
  }

  .memo-editor {
    height: 420px;
    grid-template-columns: 56px minmax(0, 1fr);
    border-radius: 16px;
  }

  .memo-editor__gutter {
    padding: 12px 10px 12px 0;
  }

  .memo-editor__gutter span,
  .memo-editor__input {
    line-height: 30px;
  }

  .memo-editor__gutter span {
    height: 30px;
    font-size: 13px;
  }

  .memo-editor__input {
    height: 100%;
    padding: 12px 18px;
    font-size: 14px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.98)),
      repeating-linear-gradient(
        180deg,
        transparent 0,
        transparent 29px,
        rgba(226, 232, 240, 0.9) 29px,
        rgba(226, 232, 240, 0.9) 30px
      );
  }
}
</style>
