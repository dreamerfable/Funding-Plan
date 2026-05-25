<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import AnalysisCategoryTree from '../components/AnalysisCategoryTree.vue'
import AnalysisChartScopePicker from '../components/AnalysisChartScopePicker.vue'
import BarCompareChart from '../components/charts/BarCompareChart.vue'
import RadarCompareChart from '../components/charts/RadarCompareChart.vue'
import LineTrendChart from '../components/charts/LineTrendChart.vue'
import { useAppStore } from '../composables/useAppStore'
import AnalysisTrendTree from '../components/AnalysisTrendTree.vue'
import {
  analyzeChartForScope,
  compareSnapshotRecency,
  getLatestSnapshot,
  trendChartSeriesForScope
} from '../lib/analysis'

const { t } = useI18n()
const { state } = useAppStore()

useHead({ title: () => t('nav.analysis') })

const tab = ref('period')
const selectedId = ref('')
const chartScopeId = ref<string>('all')
const trendChartScopeId = ref<string>('all')

const snapshots = computed(() => [...state.snapshots].sort(compareSnapshotRecency))

watch(
  () => state.snapshots,
  () => {
    const latest = getLatestSnapshot(state.snapshots)
    if (!latest) {
      selectedId.value = ''
      return
    }
    if (!selectedId.value || !state.snapshots.some(s => s.id === selectedId.value)) {
      selectedId.value = latest.id
    }
  },
  { immediate: true, deep: true }
)

const selected = computed(() => snapshots.value.find(s => s.id === selectedId.value))

const periodChart = computed(() => {
  if (!selected.value) return null
  const chart = analyzeChartForScope(selected.value, state.categories, chartScopeId.value)
  return { chart }
})

const chartLabels = computed(() => periodChart.value?.chart.map(r => r.label) ?? [])
const chartTarget = computed(() => periodChart.value?.chart.map(r => r.targetPercent) ?? [])
const chartActual = computed(() => periodChart.value?.chart.map(r => r.actualPercent) ?? [])
const useRadarChart = computed(() => chartLabels.value.length > 2)

const sortedForTrend = computed(() =>
  [...state.snapshots].sort((a, b) => compareSnapshotRecency(b, a))
)
const trendChart = computed(() =>
  trendChartSeriesForScope(sortedForTrend.value, state.categories, trendChartScopeId.value)
)
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
        <UFormField :label="t('analysis.selectSnapshot')" class="w-full">
          <USelect
            v-model="selectedId"
            class="w-full"
            :items="snapshots.map(s => ({ label: `${s.label} (${s.recordedAt.slice(0, 10)})`, value: s.id }))"
          />
        </UFormField>

        <UCard v-if="selected" class="glass-card">
          <h3 class="font-semibold mb-3">{{ t('analysis.groupDrift') }}</h3>
          <AnalysisCategoryTree :snapshot="selected" :categories="state.categories" />
        </UCard>

        <UCard v-if="periodChart" class="glass-card">
          <h3 class="font-semibold mb-4">{{ t('analysis.chartTitle') }}</h3>
          <BarCompareChart
            v-if="!useRadarChart"
            :labels="chartLabels"
            :target="chartTarget"
            :actual="chartActual"
            :target-label="t('analysis.targetWeight')"
            :actual-label="t('analysis.actualWeight')"
          />
          <RadarCompareChart
            v-else
            :labels="chartLabels"
            :target="chartTarget"
            :actual="chartActual"
            :target-label="t('analysis.targetWeight')"
            :actual-label="t('analysis.actualWeight')"
          />
          <p class="text-xs text-muted mt-2 text-center">
            {{ t('analysis.targetWeight') }} vs {{ t('analysis.actualWeight') }} (%)
          </p>
          <div class="mt-4">
            <AnalysisChartScopePicker v-model="chartScopeId" :categories="state.categories" />
          </div>
        </UCard>
      </div>

      <div v-else class="mt-4 space-y-4">
        <UCard class="glass-card">
          <h3 class="font-semibold mb-3">{{ t('analysis.trendTable') }}</h3>
          <AnalysisTrendTree :snapshots="sortedForTrend" :categories="state.categories" />
        </UCard>

        <UCard class="glass-card">
          <h3 class="font-semibold mb-4">{{ t('analysis.trendChart') }}</h3>
          <LineTrendChart :labels="trendChart.labels" :datasets="trendChart.datasets" />
          <p class="text-xs text-muted mt-2 text-center">
            {{ t('analysis.weightGap') }} (%)
          </p>
          <div class="mt-4">
            <AnalysisChartScopePicker v-model="trendChartScopeId" :categories="state.categories" />
          </div>
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
