<script setup lang="ts">
import { computed } from 'vue'

type DiffOperationType = 'context' | 'added' | 'removed'
type SplitDiffRowType = DiffOperationType | 'changed'

interface DiffOperation {
  type: DiffOperationType
  text: string
  oldLine?: number
  newLine?: number
}

interface DiffSide {
  line: number
  text: string
  marker: '+' | '-' | ' '
}

interface SplitDiffRow {
  type: SplitDiffRowType
  before?: DiffSide
  after?: DiffSide
}

const props = defineProps<{
  title: string
  beforeText?: string
  afterText?: string
  beforeLabel: string
  afterLabel: string
  changeColumnLabel: string
  addedLabel: string
  changedLabel: string
  removedLabel: string
  incompleteLabel?: string
}>()

const splitLines = (text: string) => text.replace(/\r\n?/g, '\n').split('\n')

const appendGreedyDiff = (
  before: string[],
  after: string[],
  operations: DiffOperation[],
  oldOffset: number,
  newOffset: number
) => {
  let oldIndex = 0
  let newIndex = 0
  const lookAhead = 80

  while (oldIndex < before.length && newIndex < after.length) {
    if (before[oldIndex] === after[newIndex]) {
      operations.push({
        type: 'context',
        text: before[oldIndex],
        oldLine: oldOffset + oldIndex + 1,
        newLine: newOffset + newIndex + 1
      })
      oldIndex += 1
      newIndex += 1
      continue
    }

    const nextNew = after.slice(newIndex + 1, newIndex + 1 + lookAhead).indexOf(before[oldIndex])
    const nextOld = before.slice(oldIndex + 1, oldIndex + 1 + lookAhead).indexOf(after[newIndex])
    if (nextNew >= 0 && (nextOld < 0 || nextNew <= nextOld)) {
      for (let count = 0; count <= nextNew; count += 1) {
        operations.push({ type: 'added', text: after[newIndex], newLine: newOffset + newIndex + 1 })
        newIndex += 1
      }
      continue
    }

    operations.push({ type: 'removed', text: before[oldIndex], oldLine: oldOffset + oldIndex + 1 })
    oldIndex += 1
  }

  while (oldIndex < before.length) {
    operations.push({ type: 'removed', text: before[oldIndex], oldLine: oldOffset + oldIndex + 1 })
    oldIndex += 1
  }
  while (newIndex < after.length) {
    operations.push({ type: 'added', text: after[newIndex], newLine: newOffset + newIndex + 1 })
    newIndex += 1
  }
}

const appendLcsDiff = (
  before: string[],
  after: string[],
  operations: DiffOperation[],
  oldOffset: number,
  newOffset: number
) => {
  if (before.length * after.length > 1_000_000) {
    appendGreedyDiff(before, after, operations, oldOffset, newOffset)
    return
  }

  const lengths = Array.from(
    { length: before.length + 1 },
    () => new Uint32Array(after.length + 1)
  )
  for (let oldIndex = before.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = after.length - 1; newIndex >= 0; newIndex -= 1) {
      lengths[oldIndex][newIndex] = before[oldIndex] === after[newIndex]
        ? lengths[oldIndex + 1][newIndex + 1] + 1
        : Math.max(lengths[oldIndex + 1][newIndex], lengths[oldIndex][newIndex + 1])
    }
  }

  let oldIndex = 0
  let newIndex = 0
  while (oldIndex < before.length && newIndex < after.length) {
    if (before[oldIndex] === after[newIndex]) {
      operations.push({
        type: 'context',
        text: before[oldIndex],
        oldLine: oldOffset + oldIndex + 1,
        newLine: newOffset + newIndex + 1
      })
      oldIndex += 1
      newIndex += 1
    } else if (lengths[oldIndex + 1][newIndex] >= lengths[oldIndex][newIndex + 1]) {
      operations.push({ type: 'removed', text: before[oldIndex], oldLine: oldOffset + oldIndex + 1 })
      oldIndex += 1
    } else {
      operations.push({ type: 'added', text: after[newIndex], newLine: newOffset + newIndex + 1 })
      newIndex += 1
    }
  }

  while (oldIndex < before.length) {
    operations.push({ type: 'removed', text: before[oldIndex], oldLine: oldOffset + oldIndex + 1 })
    oldIndex += 1
  }
  while (newIndex < after.length) {
    operations.push({ type: 'added', text: after[newIndex], newLine: newOffset + newIndex + 1 })
    newIndex += 1
  }
}

const buildOperations = (beforeText: string, afterText: string) => {
  const before = splitLines(beforeText)
  const after = splitLines(afterText)
  let prefix = 0
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1

  let suffix = 0
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) suffix += 1

  const operations: DiffOperation[] = []
  for (let index = 0; index < prefix; index += 1) {
    operations.push({ type: 'context', text: before[index], oldLine: index + 1, newLine: index + 1 })
  }

  appendLcsDiff(
    before.slice(prefix, before.length - suffix),
    after.slice(prefix, after.length - suffix),
    operations,
    prefix,
    prefix
  )

  for (let index = suffix; index > 0; index -= 1) {
    const oldLine = before.length - index + 1
    const newLine = after.length - index + 1
    operations.push({ type: 'context', text: before[oldLine - 1], oldLine, newLine })
  }
  return operations
}

const toSplitRows = (operations: DiffOperation[]) => {
  const rows: SplitDiffRow[] = []
  let index = 0

  while (index < operations.length) {
    const operation = operations[index]
    if (operation.type === 'context') {
      rows.push({
        type: 'context',
        before: { line: operation.oldLine || 0, text: operation.text, marker: ' ' },
        after: { line: operation.newLine || 0, text: operation.text, marker: ' ' }
      })
      index += 1
      continue
    }

    const removed: DiffOperation[] = []
    const added: DiffOperation[] = []
    while (index < operations.length && operations[index].type !== 'context') {
      const changed = operations[index]
      if (changed.type === 'removed') removed.push(changed)
      if (changed.type === 'added') added.push(changed)
      index += 1
    }

    const changedRowCount = Math.max(removed.length, added.length)
    for (let rowIndex = 0; rowIndex < changedRowCount; rowIndex += 1) {
      const before = removed[rowIndex]
      const after = added[rowIndex]
      rows.push({
        type: before && after ? 'changed' : before ? 'removed' : 'added',
        before: before
          ? { line: before.oldLine || 0, text: before.text, marker: '-' }
          : undefined,
        after: after
          ? { line: after.newLine || 0, text: after.text, marker: '+' }
          : undefined
      })
    }
  }

  return rows
}

const rows = computed<SplitDiffRow[]>(() => {
  if (props.beforeText !== undefined && props.afterText !== undefined) {
    return toSplitRows(buildOperations(props.beforeText, props.afterText))
  }
  if (props.beforeText !== undefined) {
    return splitLines(props.beforeText).map((text, index) => ({
      type: 'removed',
      before: { line: index + 1, text, marker: '-' }
    }))
  }
  if (props.afterText !== undefined) {
    return splitLines(props.afterText).map((text, index) => ({
      type: 'added',
      after: { line: index + 1, text, marker: '+' }
    }))
  }
  return []
})

const hasCompletePair = computed(() => props.beforeText !== undefined && props.afterText !== undefined)

const changeLabel = (type: SplitDiffRowType) => ({
  added: props.addedLabel,
  changed: props.changedLabel,
  removed: props.removedLabel,
  context: ''
}[type])
</script>

<template>
  <section class="split-diff-panel">
    <header class="split-diff-title">
      <h4>{{ title }}</h4>
      <span v-if="!hasCompletePair && incompleteLabel" class="incomplete-tip">{{ incompleteLabel }}</span>
    </header>
    <div class="split-diff-scroll">
      <div class="split-diff-grid">
        <div class="split-diff-column-header before-header">
          <span class="header-marker">−</span>
          <strong>{{ beforeLabel }}</strong>
        </div>
        <div class="change-header">{{ changeColumnLabel }}</div>
        <div class="split-diff-column-header after-header">
          <span class="header-marker">+</span>
          <strong>{{ afterLabel }}</strong>
        </div>

        <template v-for="(row, index) in rows" :key="`${index}:${row.type}:${row.before?.line || 0}:${row.after?.line || 0}`">
          <div class="diff-cell before-cell" :class="`is-${row.type}`">
            <span class="line-number">{{ row.before?.line || '' }}</span>
            <span class="line-marker">{{ row.before?.marker || '' }}</span>
            <code>{{ row.before?.text ?? ' ' }}</code>
          </div>
          <div class="change-cell" :class="`is-${row.type}`">
            <span v-if="row.type !== 'context'">{{ changeLabel(row.type) }}</span>
          </div>
          <div class="diff-cell after-cell" :class="`is-${row.type}`">
            <span class="line-number">{{ row.after?.line || '' }}</span>
            <span class="line-marker">{{ row.after?.marker || '' }}</span>
            <code>{{ row.after?.text ?? ' ' }}</code>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.split-diff-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: #0b1220;
}

.split-diff-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #263449;
  background: var(--surface-subtle);
}

.split-diff-title h4 {
  margin: 0;
  color: var(--text-primary);
}

.incomplete-tip {
  color: var(--el-color-warning);
  font-size: 12px;
}

.split-diff-scroll {
  max-height: 640px;
  overflow: auto;
  scrollbar-color: #64748b #111827;
  scrollbar-width: thin;
}

.split-diff-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.split-diff-scroll::-webkit-scrollbar-track {
  background: #111827;
}

.split-diff-scroll::-webkit-scrollbar-thumb {
  border: 3px solid #111827;
  border-radius: 999px;
  background: #64748b;
}

.split-diff-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.split-diff-grid {
  display: grid;
  grid-template-columns: minmax(380px, max-content) 64px minmax(380px, max-content);
  min-width: 100%;
  width: max-content;
  min-height: 100%;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.split-diff-column-header,
.change-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  min-height: 38px;
  border-bottom: 1px solid #334155;
  background: #172033;
  color: #d8e1ec;
}

.split-diff-column-header {
  gap: 8px;
  padding: 0 12px;
}

.split-diff-column-header.after-header {
  border-left: 1px solid #334155;
}

.header-marker {
  font-size: 16px;
  font-weight: 700;
}

.before-header .header-marker {
  color: #f87171;
}

.after-header .header-marker {
  color: #4ade80;
}

.change-header {
  justify-content: center;
  border-right: 1px solid #334155;
  border-left: 1px solid #334155;
  color: #94a3b8;
  font-family: inherit;
  font-size: 11px;
}

.diff-cell {
  display: grid;
  grid-template-columns: 48px 28px minmax(max-content, 1fr);
  min-height: 24px;
  color: #d8e1ec;
}

.diff-cell > * {
  padding: 2px 8px;
}

.diff-cell code {
  min-width: 0;
  border-left: 1px solid rgba(148, 163, 184, 0.16);
  color: inherit;
  font-family: inherit;
  white-space: pre;
}

.diff-cell .line-number {
  color: #64748b;
  text-align: right;
  user-select: none;
}

.diff-cell .line-marker {
  font-weight: 800;
  text-align: center;
  user-select: none;
}

.diff-cell.after-cell {
  border-left: 1px solid #334155;
}

.change-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  border-right: 1px solid #334155;
  border-left: 1px solid #334155;
  background: #111a2a;
  color: #94a3b8;
  font-family: inherit;
  font-size: 10px;
}

.change-cell span {
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
  white-space: nowrap;
}

.change-cell.is-changed span {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.change-cell.is-added span {
  background: rgba(34, 197, 94, 0.16);
  color: #4ade80;
}

.change-cell.is-removed span {
  background: rgba(239, 68, 68, 0.16);
  color: #f87171;
}

.before-cell.is-changed,
.before-cell.is-removed {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

.before-cell.is-changed .line-marker,
.before-cell.is-removed .line-marker {
  color: #f87171;
}

.after-cell.is-changed,
.after-cell.is-added {
  background: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
}

.after-cell.is-changed .line-marker,
.after-cell.is-added .line-marker {
  color: #4ade80;
}

.before-cell.is-added,
.after-cell.is-removed {
  background: #0f1726;
}

@media (max-width: 980px) {
  .split-diff-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
