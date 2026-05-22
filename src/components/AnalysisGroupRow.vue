<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PlanL1Icon from './PlanL1Icon.vue'
import { analyzeItemsUnderCategory } from '../lib/analysis'
import type { CategoryNode, PlanRowAnalysis, Snapshot } from '../types'
import { formatMoney } from '../utils/format'

const props = defineProps<{
  node: CategoryNode
  snapshot: Snapshot
  categories: CategoryNode[]
  metrics: PlanRowAnalysis
  expanded: boolean
  variant: 'l1' | 'l2' | 'l3'
}>()

defineEmits<{ toggle: [] }>()

const { t, locale } = useI18n()

const rowGrid =
  'grid grid-cols-[minmax(6rem,1.35fr)_4.75rem_4.75rem_4.75rem] sm:grid-cols-[minmax(7.5rem,1.5fr)_6rem_6rem_6rem] gap-x-2 items-start'

const nameStack = 'min-w-0 leading-tight'
const nameSpacer = 'text-[11px] sm:text-xs invisible select-none pointer-events-none'

const rowClass = computed(() => {
  const base = 'cursor-pointer transition-colors'
  const expanded = props.expanded ? 'bg-primary/8' : ''
  if (props.variant === 'l1') return `${base} px-3 py-2.5 bg-elevated/40 hover:bg-elevated/70 ${expanded}`
  if (props.variant === 'l2') return `${base} px-3 py-2 bg-default/25 hover:bg-default/40 ${expanded}`
  return `${base} px-3 py-1.5 hover:bg-default/30 ${expanded}`
})

const products = computed(() => analyzeItemsUnderCategory(props.snapshot, props.categories, props.node))

function gapColor(gap: number) {
  if (Math.abs(gap) < 0.05) return 'text-muted'
  return gap > 0 ? 'text-warning' : 'text-info'
}

function formatGapPercent(gap: number) {
  return `${gap >= 0 ? '+' : ''}${gap.toFixed(1)}%`
}
</script>

<template>
  <div>
    <div :class="[rowClass, rowGrid]" role="button" tabindex="0" @click="$emit('toggle')" @keyup.enter="$emit('toggle')">
      <div :class="nameStack">
        <div v-if="variant === 'l1'" class="flex items-center gap-2 min-w-0">
          <span class="flex size-5 shrink-0 items-center justify-center text-primary">
            <PlanL1Icon :icon-key="node.iconKey" size="sm" />
          </span>
          <span class="font-semibold text-sm truncate">{{ node.name }}</span>
        </div>
        <div v-else-if="variant === 'l2'" class="text-sm truncate">{{ node.name }}</div>
        <div v-else class="text-xs text-muted truncate">{{ node.name }}</div>
        <div :class="nameSpacer">&nbsp;</div>
      </div>
      <div class="text-right leading-tight tabular-nums">
        <div
          class="font-medium"
          :class="variant === 'l1' ? 'text-xs sm:text-sm' : 'text-xs'"
        >
          {{ metrics.targetPercent.toFixed(1) }}%
        </div>
        <div class="text-[11px] text-muted" :class="variant === 'l1' ? 'sm:text-xs' : ''">
          {{ formatMoney(metrics.targetAmount, locale) }}
        </div>
      </div>
      <div class="text-right leading-tight tabular-nums">
        <div :class="variant === 'l1' ? 'text-xs sm:text-sm' : 'text-xs'">
          {{ metrics.actualPercent.toFixed(1) }}%
        </div>
        <div class="text-[11px] text-muted" :class="variant === 'l1' ? 'sm:text-xs' : ''">
          {{ formatMoney(metrics.actualAmount, locale) }}
        </div>
      </div>
      <div class="text-right leading-tight tabular-nums">
        <div class="font-medium" :class="[variant === 'l1' ? 'text-xs sm:text-sm' : 'text-xs', gapColor(metrics.percentGap)]">
          {{ formatGapPercent(metrics.percentGap) }}
        </div>
        <div class="text-[11px]" :class="[variant === 'l1' ? 'sm:text-xs' : '', gapColor(metrics.amountGap)]">
          {{ formatMoney(metrics.amountGap, locale) }}
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
        class="px-3 py-1.5 border-b border-default/25 last:border-0"
        :class="rowGrid"
      >
        <div :class="nameStack">
          <div class="text-xs truncate pl-0.5">{{ row.label || '—' }}</div>
          <div :class="nameSpacer">&nbsp;</div>
        </div>
        <div class="text-right leading-tight tabular-nums">
          <div class="text-xs font-medium">{{ row.targetPercent.toFixed(2) }}%</div>
          <div class="text-[11px] text-muted">{{ formatMoney(row.targetAmount, locale) }}</div>
        </div>
        <div class="text-right leading-tight tabular-nums">
          <div class="text-xs">{{ row.actualPercent.toFixed(2) }}%</div>
          <div class="text-[11px] text-muted">{{ formatMoney(row.actualAmount, locale) }}</div>
        </div>
        <div class="text-right leading-tight tabular-nums">
          <div class="text-xs font-medium" :class="gapColor(row.percentGap)">
            {{ formatGapPercent(row.percentGap) }}
          </div>
          <div class="text-[11px]" :class="gapColor(row.amountGap)">
            {{ formatMoney(row.amountGap, locale) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
