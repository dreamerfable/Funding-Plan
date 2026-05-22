<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PlanL1Icon from './PlanL1Icon.vue'
import AnalysisTrendPeriodCells from './AnalysisTrendPeriodCells.vue'
import { categoryAnalysisKey, productRowKeysUnderCategory, trendCellsForRowKey } from '../lib/analysis'
import type { CategoryNode, Snapshot } from '../types'

const props = defineProps<{
  node: CategoryNode
  snapshots: Snapshot[]
  categories: CategoryNode[]
  expanded: boolean
  variant: 'l1' | 'l2'
}>()

defineEmits<{ toggle: [] }>()

const { t } = useI18n()

const rowKey = computed(() => categoryAnalysisKey(props.node))

const cells = computed(() => trendCellsForRowKey(props.snapshots, props.categories, rowKey.value))

const productKeys = computed(() => productRowKeysUnderCategory(props.snapshots, props.categories, props.node))

const gridStyle = computed(() => ({
  gridTemplateColumns: `minmax(6rem, 1.35fr) ${props.snapshots.map(() => 'minmax(5rem, 5.75rem)').join(' ')}`
}))

const rowClass = computed(() => {
  const base = 'cursor-pointer transition-colors'
  const expanded = props.expanded ? 'bg-primary/8' : ''
  if (props.variant === 'l1') return `${base} px-3 pt-2 pb-1.5 bg-elevated/40 hover:bg-elevated/70 ${expanded}`
  if (props.variant === 'l2') return `${base} px-3 pt-2 pb-1.5 bg-default/25 hover:bg-default/40 ${expanded}`
  return `${base} px-3 pt-2 pb-1.5 hover:bg-default/30 ${expanded}`
})

function productName(key: string) {
  const id = key.slice(5)
  for (const s of props.snapshots) {
    const item = s.frozenPlan.items.find(i => i.id === id)
    if (item?.name) return item.name
  }
  return '—'
}
</script>

<template>
  <div>
    <div
      :class="[rowClass, 'grid gap-x-2 items-center']"
      :style="gridStyle"
      role="button"
      tabindex="0"
      @click="$emit('toggle')"
      @keyup.enter="$emit('toggle')"
    >
      <div v-if="variant === 'l1'" class="flex min-w-0 items-center gap-2">
        <span class="flex size-5 shrink-0 items-center justify-center text-primary">
          <PlanL1Icon :icon-key="node.iconKey" size="sm" />
        </span>
        <span class="truncate text-sm font-semibold">{{ node.name }}</span>
      </div>
      <div v-else class="min-w-0 truncate text-sm">{{ node.name }}</div>
      <template v-for="(cell, ci) in cells" :key="ci">
        <AnalysisTrendPeriodCells :cell="cell" :show-gap-trend="ci > 0" />
      </template>
    </div>

    <div v-if="expanded" class="border-t border-default/40 bg-default/15">
      <p v-if="!productKeys.length" class="text-xs text-muted px-3 py-2">
        {{ t('analysis.noProductsInGroup') }}
      </p>
      <div
        v-for="pkey in productKeys"
        :key="pkey"
        class="grid gap-x-2 items-center px-3 pt-2 pb-1.5 border-b border-default/25 last:border-0"
        :style="gridStyle"
      >
        <div class="min-w-0 truncate pl-0.5 text-xs">{{ productName(pkey) }}</div>
        <template v-for="(cell, ci) in trendCellsForRowKey(snapshots, categories, pkey)" :key="ci">
          <AnalysisTrendPeriodCells :cell="cell" :show-gap-trend="ci > 0" />
        </template>
      </div>
    </div>
  </div>
</template>
