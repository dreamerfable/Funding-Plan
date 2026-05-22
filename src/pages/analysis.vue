<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown, ArrowUp, Minus } from 'lucide-vue-next'
import AnalysisCategoryTree from '../components/AnalysisCategoryTree.vue'
import AnalysisChartScopePicker from '../components/AnalysisChartScopePicker.vue'
import BarCompareChart from '../components/charts/BarCompareChart.vue'
import LineTrendChart from '../components/charts/LineTrendChart.vue'
import { useAppStore } from '../composables/useAppStore'
import { analyzeChartForScope, buildTrendTable, trendChartSeries } from '../lib/analysis'
import type { AnalysisLevel } from '../types'
import { formatMoney, formatPercent } from '../utils/format'

const { t, locale } = useI18n()
const { state } = useAppStore()

useHead({ title: () => t('nav.analysis') })

const tab = ref('period')
const selectedId = ref('')
const chartScopeId = ref<string>('all')
const trendLevel = ref<AnalysisLevel>(1)

const snapshots = computed(() =>
  [...state.snapshots].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
)

const selected = computed(() => {
  const id = selectedId.value || snapshots.value[0]?.id
  return snapshots.value.find(s => s.id === id)
})

const periodChart = computed(() => {
  if (!selected.value) return null
  const chart = analyzeChartForScope(selected.value, state.categories, chartScopeId.value)
  return { chart }
})

const chartLabels = computed(() => periodChart.value?.chart.map(r => r.label) ?? [])
const chartTarget = computed(() => periodChart.value?.chart.map(r => r.targetPercent) ?? [])
const chartActual = computed(() => periodChart.value?.chart.map(r => r.actualPercent) ?? [])

const sortedForTrend = computed(() =>
  [...state.snapshots].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
)
const trendTable = computed(() => buildTrendTable(sortedForTrend.value, state.categories, trendLevel.value))
const trendChart = computed(() => trendChartSeries(sortedForTrend.value, state.categories, trendLevel.value))

const levelOptions = computed(() => [
  { label: t('analysis.level1'), value: 1 },
  { label: t('analysis.level2'), value: 2 },
  { label: t('analysis.level3'), value: 3 }
])

function gapColor(gap: number) {
  if (Math.abs(gap) < 0.05) return 'text-muted'
  return gap > 0 ? 'text-warning' : 'text-info'
}

function trendIcon(trend: string | null) {
  if (trend === 'wider') return ArrowUp
  if (trend === 'narrower') return ArrowDown
  return Minus
}
</script>

<template>
  <UContainer class="py-6 sm:py-8 max-w-5xl">
    <UPageHeader :title="t('analysis.title')" :description="t('analysis.description')" />

    <UAlert
      v-if="!snapshots.length"
      class="mt-6"
      color="neutral"
      variant="subtle"
      :title="t('analysis.noData')"
    />

    <template v-else>
      <UTabs
        v-model="tab"
        :items="[
          { label: t('analysis.tabs.period'), value: 'period' },
          { label: t('analysis.tabs.trend'), value: 'trend' }
        ]"
        class="mt-6"
      />

      <div v-if="tab === 'period'" class="mt-4 space-y-4">
        <UFormField :label="t('analysis.selectSnapshot')">
          <USelect
            :model-value="selected?.id ?? snapshots[0]?.id"
            :items="snapshots.map(s => ({ label: `${s.label} (${s.recordedAt.slice(0, 10)})`, value: s.id }))"
            @update:model-value="selectedId = $event"
          />
        </UFormField>

        <UCard v-if="selected" class="glass-card">
          <h3 class="font-semibold mb-3">{{ t('analysis.groupDrift') }}</h3>
          <AnalysisCategoryTree :snapshot="selected" :categories="state.categories" />
        </UCard>

        <UCard v-if="periodChart" class="glass-card">
          <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
            <h3 class="font-semibold">{{ t('analysis.chartTitle') }}</h3>
            <AnalysisChartScopePicker v-model="chartScopeId" :categories="state.categories" />
          </div>
          <BarCompareChart
            :labels="chartLabels"
            :target="chartTarget"
            :actual="chartActual"
            :target-label="t('analysis.targetWeight')"
            :actual-label="t('analysis.actualWeight')"
          />
          <p class="text-xs text-muted mt-2 text-center">
            {{ t('analysis.targetWeight') }} vs {{ t('analysis.actualWeight') }} (%)
          </p>
        </UCard>
      </div>

      <div v-else class="mt-4 space-y-4">
        <UFormField :label="t('analysis.trendLevel')">
          <USelect v-model="trendLevel" :items="levelOptions" value-key="value" />
        </UFormField>

        <UCard class="glass-card overflow-x-auto">
          <h3 class="font-semibold mb-3">{{ t('analysis.trendTable') }}</h3>
          <table class="w-full text-xs sm:text-sm min-w-[720px]">
            <thead>
              <tr class="text-muted border-b border-default">
                <th class="py-2 text-left sticky left-0 bg-elevated z-10">—</th>
                <th
                  v-for="(s, ci) in sortedForTrend"
                  :key="s.id"
                  class="py-2 px-2 text-center min-w-[100px]"
                >
                  {{ s.label }}
                  <span v-if="ci > 0" class="block text-[10px] font-normal">{{ t('analysis.gapTrend') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in trendTable" :key="row.key" class="border-b border-default/40">
                <td class="py-2 pr-3 font-medium sticky left-0 bg-default z-10 max-w-[120px] truncate">
                  {{ row.label }}
                </td>
                <td
                  v-for="(cell, ci) in row.cells"
                  :key="ci"
                  class="py-2 px-2 text-center align-top"
                >
                  <div class="tabular-nums">{{ formatMoney(cell.amount, locale) }}</div>
                  <div class="text-muted">{{ cell.percent.toFixed(1) }}%</div>
                  <div :class="gapColor(cell.percentGap)" class="font-medium">
                    {{ formatPercent(cell.percentGap) }}
                  </div>
                  <div v-if="ci > 0 && cell.gapTrend" class="flex items-center justify-center gap-0.5 mt-1 text-[10px]">
                    <component :is="trendIcon(cell.gapTrend)" class="size-3" />
                    <span>{{ t(`analysis.${cell.gapTrend}`) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </UCard>

        <UCard class="glass-card">
          <h3 class="font-semibold mb-4">{{ t('analysis.trendChart') }}</h3>
          <LineTrendChart :labels="trendChart.labels" :datasets="trendChart.datasets" />
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
