<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { TrendingDown, TrendingUp, Minus } from 'lucide-vue-next'
import { useAppStore } from '../composables/useAppStore'
import { analyzeSnapshot, overallMatchPercent } from '../lib/analysis'
import { formatPercent } from '../utils/format'

const { t } = useI18n()
const { state } = useAppStore()

useHead({ title: () => t('nav.home') })

const sortedSnapshots = computed(() =>
  [...state.snapshots].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
)

const latest = computed(() => sortedSnapshots.value[0])
const previous = computed(() => sortedSnapshots.value[1])

const latestMatch = computed(() =>
  latest.value ? overallMatchPercent(latest.value, state.categories) : 0
)

const prevMatch = computed(() =>
  previous.value ? overallMatchPercent(previous.value, state.categories) : null
)

const matchDelta = computed(() =>
  prevMatch.value !== null ? latestMatch.value - prevMatch.value : null
)

const compareText = computed(() => {
  if (matchDelta.value === null) return t('home.noCompare')
  const n = `${Math.abs(matchDelta.value).toFixed(2)}%`
  if (Math.abs(matchDelta.value) < 0.01) return t('home.vsPrevSame')
  if (matchDelta.value > 0) return t('home.vsPrevUp', { n })
  return t('home.vsPrevDown', { n })
})

const compareUp = computed(() => matchDelta.value !== null && matchDelta.value > 0.01)
const compareDown = computed(() => matchDelta.value !== null && matchDelta.value < -0.01)

const l2Rows = computed(() => {
  if (!latest.value) return []
  const rows = analyzeSnapshot(latest.value, state.categories, 2).rows
    .map(r => ({
      ...r,
      shortLabel: r.label.includes('›') ? r.label.split('›').pop()?.trim() ?? r.label : r.label
    }))
    .sort((a, b) => Math.abs(b.percentGap) - Math.abs(a.percentGap))
  return rows.slice(0, 8)
})

function gapClass(gap: number) {
  if (Math.abs(gap) < 0.05) return 'text-muted'
  return gap > 0 ? 'text-warning' : 'text-info'
}
</script>

<template>
  <div
    class="home-screen flex flex-col overflow-hidden px-4 pt-2"
    style="height: calc(100dvh - 3.5rem - 4.75rem - env(safe-area-inset-bottom))"
  >
    <template v-if="latest">
      <section class="flex flex-1 flex-col items-center justify-center min-h-0 text-center">
        <p class="text-xs sm:text-sm text-muted mb-2 tracking-wide">
          {{ t('home.period') }} · {{ latest.label }}
        </p>
        <p class="text-[11px] text-muted/80 mb-4">{{ t('home.matchTitle') }}</p>
        <p
          class="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight text-primary leading-none"
          aria-live="polite"
        >
          {{ latestMatch.toFixed(2) }}
          <span class="text-3xl sm:text-4xl font-semibold text-muted/90">%</span>
        </p>
        <div
          class="mt-5 flex items-center justify-center gap-1.5 text-sm text-muted"
          :class="{
            'text-success': compareUp,
            'text-warning': compareDown
          }"
        >
          <TrendingUp v-if="compareUp" class="size-4 shrink-0" />
          <TrendingDown v-else-if="compareDown" class="size-4 shrink-0" />
          <Minus v-else class="size-4 shrink-0 opacity-60" />
          <span>{{ compareText }}</span>
        </div>
      </section>

      <section class="shrink-0 pb-1 min-h-0 flex flex-col max-h-[42%]">
        <p class="text-xs font-semibold text-muted mb-2 px-0.5">{{ t('home.l2Title') }}</p>
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1 border border-default/80">
          <div
            class="grid grid-cols-[1fr_3.5rem_3.5rem_3.5rem] gap-1 px-3 py-2 text-[10px] font-medium text-muted border-b border-default/60 shrink-0 bg-elevated/40"
          >
            <span>{{ t('home.colCategory') }}</span>
            <span class="text-right">{{ t('home.colTarget') }}</span>
            <span class="text-right">{{ t('home.colActual') }}</span>
            <span class="text-right">{{ t('home.colDrift') }}</span>
          </div>
          <div class="flex flex-1 flex-col min-h-0 overflow-hidden divide-y divide-default/40">
            <div
              v-for="row in l2Rows"
              :key="row.key"
              class="grid grid-cols-[1fr_3.5rem_3.5rem_3.5rem] gap-1 px-3 py-1 text-[11px] sm:text-xs items-center flex-1 min-h-[1.75rem] max-h-[2.25rem]"
            >
              <span class="truncate font-medium" :title="row.label">{{ row.shortLabel }}</span>
              <span class="text-right tabular-nums text-muted">{{ row.targetPercent.toFixed(1) }}</span>
              <span class="text-right tabular-nums">{{ row.actualPercent.toFixed(1) }}</span>
              <span class="text-right tabular-nums font-medium" :class="gapClass(row.percentGap)">
                {{ formatPercent(row.percentGap) }}
              </span>
            </div>
            <p v-if="!l2Rows.length" class="text-xs text-muted text-center py-4 flex-1 flex items-center justify-center">
              —
            </p>
          </div>
        </div>
      </section>
    </template>

    <section
      v-else
      class="flex flex-1 flex-col items-center justify-center text-center px-6"
    >
      <p class="text-lg font-medium text-muted">{{ t('home.noSnapshot') }}</p>
      <p class="text-sm text-muted/80 mt-2">{{ t('home.noSnapshotHint') }}</p>
      <UButton to="/snapshots/new" class="mt-6" size="lg">
        {{ t('snapshots.add') }}
      </UButton>
    </section>
  </div>
</template>
