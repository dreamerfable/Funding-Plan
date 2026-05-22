<script setup lang="ts">
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { TrendCell } from '../lib/analysis'
import { formatAnalysisGapPercent, formatAnalysisMoney } from '../utils/format'

defineProps<{
  cell: TrendCell
  showGapTrend?: boolean
}>()

const { locale } = useI18n()

function trendIcon(trend: TrendCell['gapTrend']) {
  if (trend === 'wider') return ArrowUpRight
  if (trend === 'narrower') return ArrowDownRight
  if (trend === 'same') return ArrowRight
  return null
}

function trendIconClass(trend: TrendCell['gapTrend']) {
  if (trend === 'wider') return 'text-warning'
  if (trend === 'narrower') return 'text-info'
  return 'text-muted'
}
</script>

<template>
  <div class="flex items-center justify-end gap-1 min-w-[5rem] pl-0.5 self-center">
    <div class="grid grid-rows-2 gap-0.5 text-right leading-tight tabular-nums flex-1 min-w-0">
      <div class="text-xs font-medium text-highlighted">
        {{ formatAnalysisGapPercent(cell.percentGap) }}
      </div>
      <div class="text-[11px] text-muted">
        {{ formatAnalysisMoney(cell.amountGap, locale) }}
      </div>
    </div>
    <component
      v-if="showGapTrend && trendIcon(cell.gapTrend)"
      :is="trendIcon(cell.gapTrend)"
      class="size-4 shrink-0 self-center"
      :class="trendIconClass(cell.gapTrend)"
    />
  </div>
</template>
