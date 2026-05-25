<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrendingDown, TrendingUp, Minus } from 'lucide-vue-next'
import { useAppStore } from '../../composables/useAppStore'
import { analyzeSnapshot, overallMatchPercent, snapshotAllocationGap } from '../../lib/analysis'
import { formatHomePercentInt, formatMoney, formatPercent } from '../../utils/format'
import type { Snapshot } from '../../types'

const props = defineProps<{
  latest: Snapshot | undefined
  previous: Snapshot | undefined
}>()

const { t, locale } = useI18n()
const { state } = useAppStore()

const latestMatch = computed(() =>
  props.latest ? Math.round(overallMatchPercent(props.latest, state.categories)) : 0
)

const prevMatch = computed(() =>
  props.previous ? Math.round(overallMatchPercent(props.previous, state.categories)) : null
)

const matchDelta = computed(() =>
  prevMatch.value !== null ? latestMatch.value - prevMatch.value : null
)

const compareText = computed(() => {
  if (matchDelta.value === null) return t('home.noCompare')
  const n = `${Math.abs(matchDelta.value)}%`
  if (matchDelta.value === 0) return t('home.vsPrevSame')
  if (matchDelta.value > 0) return t('home.vsPrevUp', { n })
  return t('home.vsPrevDown', { n })
})

const compareUp = computed(() => matchDelta.value !== null && matchDelta.value > 0)
const compareDown = computed(() => matchDelta.value !== null && matchDelta.value < 0)

const allocationGapAbs = computed(() =>
  props.latest ? Math.abs(snapshotAllocationGap(props.latest)) : 0
)

const investableAmount = computed(() => {
  if (!props.latest) return 0
  return props.latest.totalAmount - props.latest.excludeAmount
})

const allocationGapRatio = computed(() => {
  const inv = investableAmount.value
  if (inv <= 0) return 0
  return allocationGapAbs.value / inv
})

const allocationGapPercentInt = computed(() => allocationGapRatio.value * 100)

const allocationGapClass = computed(() => {
  if (allocationGapRatio.value > 0.05) {
    return 'text-red-900/85 dark:text-red-400/55'
  }
  return ''
})

const l1Rows = computed(() => {
  if (!props.latest) return []
  return analyzeSnapshot(props.latest, state.categories, 1).rows
    .slice()
    .sort((a, b) => Math.abs(b.percentGap) - Math.abs(a.percentGap))
})

function gapClass(gap: number) {
  if (Math.abs(gap) < 0.5) return 'text-muted/40'
  return gap > 0 ? 'text-warning/55 dark:text-warning/45' : 'text-info/55 dark:text-info/45'
}
</script>

<template>
  <section class="home-panel flex flex-col px-4 pt-3 pb-2">
    <div class="flex flex-1 flex-col items-center justify-center min-h-0 text-center px-2">
      <p class="text-base sm:text-sm text-muted/70 mb-2 tracking-wide">
        {{ t('home.period') }} · {{ latest?.label }}
      </p>
      <p class="text-base sm:text-sm text-muted/65 mb-5">{{ t('home.matchTitle') }}</p>
      <div class="flex justify-center w-full" aria-live="polite">
        <span
          class="relative inline-block font-lexend-deca text-[7.75rem] sm:text-8xl font-normal tabular-nums tracking-tight text-primary leading-none"
        >
          {{ latestMatch }}
          <span
            class="absolute left-full bottom-0 ml-1.5 sm:ml-2 text-3xl sm:text-3xl font-normal text-muted/75 leading-none pointer-events-none"
          >%</span>
        </span>
      </div>
      <div
        class="mt-6 flex items-center justify-center gap-2 text-lg sm:text-base text-muted/65"
        :class="{
          'text-success': compareUp,
          'text-warning': compareDown
        }"
      >
        <TrendingUp v-if="compareUp" class="size-5 shrink-0" />
        <TrendingDown v-else-if="compareDown" class="size-5 shrink-0" />
        <Minus v-else class="size-5 shrink-0 opacity-60" />
        <span>{{ compareText }}</span>
      </div>
      <div class="mt-5 flex flex-col gap-1 text-lg sm:text-base text-muted/65">
        <span>{{ t('home.offPlanHoldings') }}</span>
        <span
          class="tabular-nums font-medium inline-flex items-baseline justify-center gap-2.5"
          :class="allocationGapClass"
        >
          <span>{{ formatMoney(allocationGapAbs, locale) }}</span>
          <span>{{ formatHomePercentInt(allocationGapPercentInt) }}</span>
        </span>
      </div>
    </div>

    <div class="shrink-0 min-h-0 flex flex-col items-center max-h-[44%] pb-1 w-full">
      <ul class="w-full max-w-[15.5rem] sm:max-w-[17rem] flex flex-col min-h-0 overflow-y-auto gap-3">
        <li
          v-for="row in l1Rows"
          :key="row.key"
          class="grid grid-cols-3 gap-x-2 items-baseline text-sm sm:text-base text-muted/45 dark:text-muted/50"
        >
          <span class="min-w-0 truncate font-normal text-left" :title="row.label">{{ row.label }}</span>
          <span class="text-center tabular-nums font-normal">{{ formatHomePercentInt(row.actualPercent) }}</span>
          <span class="text-center tabular-nums font-normal" :class="gapClass(row.percentGap)">
            {{ formatPercent(row.percentGap, 0) }}
          </span>
        </li>
        <li v-if="!l1Rows.length" class="text-sm text-muted/40 text-center py-4 col-span-3">—</li>
      </ul>
      <p class="text-center text-xs text-muted/40 mt-3 w-full">{{ t('home.scrollDown') }}</p>
    </div>
  </section>
</template>
