<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PlanL1Icon from './PlanL1Icon.vue'
import { analyzeItemsUnderCategory } from '../lib/analysis'
import type { CategoryNode, PlanRowAnalysis, Snapshot } from '../types'
import {
  formatAnalysisGapPercent,
  formatAnalysisMoney,
  formatAnalysisPercent
} from '../utils/format'

const props = defineProps<{
  node: CategoryNode
  snapshot: Snapshot
  categories: CategoryNode[]
  metrics: PlanRowAnalysis
  expanded: boolean
  variant: 'l1' | 'l2'
}>()

defineEmits<{ toggle: [] }>()

const { t, locale } = useI18n()

const rowGrid =
  'grid grid-cols-[minmax(6rem,1.35fr)_4.75rem_4.75rem_4.75rem] sm:grid-cols-[minmax(7.5rem,1.5fr)_6rem_6rem_6rem] gap-x-2 items-center'

const rowClass = computed(() => {
  const base = 'cursor-pointer transition-colors'
  const expanded = props.expanded ? 'bg-primary/8' : ''
  if (props.variant === 'l1') return `${base} px-3 pt-2 pb-1.5 bg-elevated/40 hover:bg-elevated/70 ${expanded}`
  if (props.variant === 'l2') return `${base} px-3 pt-2 pb-1.5 bg-default/25 hover:bg-default/40 ${expanded}`
  return `${base} px-3 pt-2 pb-1.5 hover:bg-default/30 ${expanded}`
})

const products = computed(() => analyzeItemsUnderCategory(props.snapshot, props.categories, props.node))

function gapColor(gap: number) {
  if (Math.abs(gap) < 0.05) return 'text-muted'
  return gap > 0 ? 'text-warning' : 'text-info'
}

</script>

<template>
  <div>
    <div :class="[rowClass, rowGrid]" role="button" tabindex="0" @click="$emit('toggle')" @keyup.enter="$emit('toggle')">
      <div v-if="variant === 'l1'" class="flex min-w-0 items-center gap-2">
        <span class="flex size-5 shrink-0 items-center justify-center text-primary">
          <PlanL1Icon :icon-key="node.iconKey" size="sm" />
        </span>
        <span class="truncate text-sm font-semibold">{{ node.name }}</span>
      </div>
      <div v-else class="min-w-0 truncate text-sm">{{ node.name }}</div>
      <div class="grid grid-rows-2 gap-0.5 text-right leading-tight tabular-nums">
        <div
          class="font-medium"
          :class="variant === 'l1' ? 'text-xs sm:text-sm' : 'text-xs'"
        >
          {{ formatAnalysisPercent(metrics.targetPercent) }}
        </div>
        <div class="text-[11px] text-muted" :class="variant === 'l1' ? 'sm:text-xs' : ''">
          {{ formatAnalysisMoney(metrics.targetAmount, locale) }}
        </div>
      </div>
      <div class="grid grid-rows-2 gap-0.5 text-right leading-tight tabular-nums">
        <div :class="variant === 'l1' ? 'text-xs sm:text-sm' : 'text-xs'">
          {{ formatAnalysisPercent(metrics.actualPercent) }}
        </div>
        <div class="text-[11px] text-muted" :class="variant === 'l1' ? 'sm:text-xs' : ''">
          {{ formatAnalysisMoney(metrics.actualAmount, locale) }}
        </div>
      </div>
      <div class="grid grid-rows-2 gap-0.5 text-right leading-tight tabular-nums">
        <div class="font-medium" :class="[variant === 'l1' ? 'text-xs sm:text-sm' : 'text-xs', gapColor(metrics.percentGap)]">
          {{ formatAnalysisGapPercent(metrics.percentGap) }}
        </div>
        <div class="text-[11px]" :class="[variant === 'l1' ? 'sm:text-xs' : '', gapColor(metrics.amountGap)]">
          {{ formatAnalysisMoney(metrics.amountGap, locale) }}
        </div>
      </div>
    </div>

    <div v-if="expanded" class="border-t border-default/40 bg-default/15">
      <p v-if="!products.length" class="text-xs text-muted px-3 py-2">
        {{ t('analysis.noProductsInGroup') }}
      </p>
      <div
        v-for="row in products"
        :key="row.key"
        class="px-3 pt-2 pb-1.5 border-b border-default/25 last:border-0"
        :class="rowGrid"
      >
        <div class="min-w-0 truncate pl-0.5 text-xs">{{ row.label || '—' }}</div>
        <div class="grid grid-rows-2 gap-0.5 text-right leading-tight tabular-nums">
          <div class="text-xs font-medium">{{ formatAnalysisPercent(row.targetPercent) }}</div>
          <div class="text-[11px] text-muted">{{ formatAnalysisMoney(row.targetAmount, locale) }}</div>
        </div>
        <div class="grid grid-rows-2 gap-0.5 text-right leading-tight tabular-nums">
          <div class="text-xs">{{ formatAnalysisPercent(row.actualPercent) }}</div>
          <div class="text-[11px] text-muted">{{ formatAnalysisMoney(row.actualAmount, locale) }}</div>
        </div>
        <div class="grid grid-rows-2 gap-0.5 text-right leading-tight tabular-nums">
          <div class="text-xs font-medium" :class="gapColor(row.percentGap)">
            {{ formatAnalysisGapPercent(row.percentGap) }}
          </div>
          <div class="text-[11px]" :class="gapColor(row.amountGap)">
            {{ formatAnalysisMoney(row.amountGap, locale) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
