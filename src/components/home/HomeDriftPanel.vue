<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../composables/useAppStore'
import {
  analyzeItemsUnderCategory,
  buildCategoryAnalysisMap,
  l1NodesInSnapshot,
  l2NodesInSnapshot
} from '../../lib/analysis'
import { getNode } from '../../lib/categories'
import {
  formatAnalysisGapPercentTrimmed,
  formatAnalysisMoney,
  formatAnalysisPercentTrimmed
} from '../../utils/format'
import type { CategoryNode, PlanRowAnalysis, Snapshot } from '../../types'

const props = defineProps<{
  latest: Snapshot
}>()

const { t, locale } = useI18n()
const { state } = useAppStore()

const l1List = computed(() => l1NodesInSnapshot(props.latest, state.categories))
const selectedL1Id = ref('')

watch(
  l1List,
  list => {
    if (!list.length) {
      selectedL1Id.value = ''
      return
    }
    if (!list.some(c => c.id === selectedL1Id.value)) {
      selectedL1Id.value = list[0].id
    }
  },
  { immediate: true }
)

const analysisMap = computed(() =>
  buildCategoryAnalysisMap(props.latest, state.categories)
)

const selectedL1 = computed(() =>
  selectedL1Id.value ? getNode(state.categories, selectedL1Id.value) : undefined
)

const l1Metrics = computed((): PlanRowAnalysis | null => {
  if (!selectedL1Id.value) return null
  return analysisMap.value.get(selectedL1Id.value) ?? null
})

interface DriftBlock {
  l2: CategoryNode | null
  l2Metrics: PlanRowAnalysis | null
  products: PlanRowAnalysis[]
}

const driftBlocks = computed((): DriftBlock[] => {
  const l1 = selectedL1.value
  if (!l1) return []
  const blocks: DriftBlock[] = []
  for (const l2 of l2NodesInSnapshot(props.latest, state.categories, l1.id)) {
    blocks.push({
      l2,
      l2Metrics: analysisMap.value.get(l2.id) ?? null,
      products: analyzeItemsUnderCategory(props.latest, state.categories, l2)
    })
  }
  const directProducts = analyzeItemsUnderCategory(props.latest, state.categories, l1)
  if (directProducts.length) {
    blocks.push({ l2: null, l2Metrics: null, products: directProducts })
  }
  return blocks
})

const tabItems = computed(() => l1List.value.map(c => ({ label: c.name, value: c.id })))

const showAmount = ref(false)

function toggleTableMetric() {
  showAmount.value = !showAmount.value
}

function gapClass(gap: number) {
  if (Math.abs(gap) < 0.5) return 'text-muted'
  return gap > 0 ? 'text-warning' : 'text-info'
}

const metricCols = 'grid grid-cols-3 gap-2 text-center tabular-nums'
</script>

<template>
  <section class="home-panel flex flex-col min-h-0">
    <div class="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0 px-3 sm:px-4 pt-2 pb-2">
      <p class="text-sm font-semibold text-muted px-1 mb-2 shrink-0">{{ t('home.driftByGroup') }}</p>

    <div v-if="!l1List.length" class="flex flex-1 items-center justify-center text-sm text-muted">
      —
    </div>

    <template v-else>
      <div class="shrink-0 mb-3 overflow-x-auto -mx-1 px-1">
        <UTabs
          v-model="selectedL1Id"
          :items="tabItems"
          :content="false"
          size="sm"
          class="w-max min-w-full"
        />
      </div>

      <div
        v-if="l1Metrics"
        class="glass-card rounded-xl border border-default/80 mb-3 shrink-0 grid grid-cols-3 divide-x divide-default/50"
      >
        <div class="flex flex-col items-center text-center px-2 py-3 gap-1">
          <p class="text-xs text-muted">{{ t('home.sectionTarget') }}</p>
          <template v-if="showAmount">
            <p class="text-lg font-semibold tabular-nums leading-tight">
              {{ formatAnalysisMoney(l1Metrics.targetAmount, locale) }}
            </p>
            <p class="text-[10px] text-muted tabular-nums">
              {{ formatAnalysisPercentTrimmed(l1Metrics.targetPercent) }}
            </p>
          </template>
          <template v-else>
            <p class="text-lg font-semibold tabular-nums leading-tight">
              {{ formatAnalysisPercentTrimmed(l1Metrics.targetPercent) }}
            </p>
            <p class="text-[10px] text-muted tabular-nums">
              {{ formatAnalysisMoney(l1Metrics.targetAmount, locale) }}
            </p>
          </template>
        </div>
        <div class="flex flex-col items-center text-center px-2 py-3 gap-1">
          <p class="text-xs text-muted">{{ t('home.sectionHoldings') }}</p>
          <template v-if="showAmount">
            <p class="text-lg font-semibold tabular-nums leading-tight">
              {{ formatAnalysisMoney(l1Metrics.actualAmount, locale) }}
            </p>
            <p class="text-[10px] text-muted tabular-nums">
              {{ formatAnalysisPercentTrimmed(l1Metrics.actualPercent) }}
            </p>
          </template>
          <template v-else>
            <p class="text-lg font-semibold tabular-nums leading-tight">
              {{ formatAnalysisPercentTrimmed(l1Metrics.actualPercent) }}
            </p>
            <p class="text-[10px] text-muted tabular-nums">
              {{ formatAnalysisMoney(l1Metrics.actualAmount, locale) }}
            </p>
          </template>
        </div>
        <div class="flex flex-col items-center text-center px-2 py-3 gap-1">
          <p class="text-xs text-muted">{{ t('home.sectionDrift') }}</p>
          <template v-if="showAmount">
            <p class="text-lg font-semibold tabular-nums leading-tight" :class="gapClass(l1Metrics.amountGap)">
              {{ formatAnalysisMoney(l1Metrics.amountGap, locale) }}
            </p>
            <p class="text-[10px] tabular-nums" :class="gapClass(l1Metrics.percentGap)">
              {{ formatAnalysisGapPercentTrimmed(l1Metrics.percentGap) }}
            </p>
          </template>
          <template v-else>
            <p class="text-lg font-semibold tabular-nums leading-tight" :class="gapClass(l1Metrics.percentGap)">
              {{ formatAnalysisGapPercentTrimmed(l1Metrics.percentGap) }}
            </p>
            <p class="text-[10px] tabular-nums" :class="gapClass(l1Metrics.amountGap)">
              {{ formatAnalysisMoney(l1Metrics.amountGap, locale) }}
            </p>
          </template>
        </div>
      </div>

      <div
        class="glass-card rounded-xl border border-default/80 flex-1 min-h-0 flex flex-col overflow-hidden cursor-pointer"
        role="button"
        tabindex="0"
        :aria-label="showAmount ? t('home.tableShowPercent') : t('home.tableShowAmount')"
        @click="toggleTableMetric"
        @keydown.enter.prevent="toggleTableMetric"
        @keydown.space.prevent="toggleTableMetric"
      >
        <div class="flex-1 min-h-0 overflow-y-auto divide-y divide-default/30">
          <template v-for="(block, bi) in driftBlocks" :key="block.l2?.id ?? `direct-${bi}`">
            <div
              v-if="block.l2 && block.l2Metrics"
              class="flex items-center gap-3 px-3 py-2.5 bg-default/30"
            >
              <span
                class="min-w-0 flex-1 truncate text-sm font-semibold dark:font-medium dark:text-muted/75"
              >
                {{ block.l2.name }}
              </span>
              <div
                class="flex shrink-0 flex-wrap items-baseline justify-end gap-x-3 text-sm tabular-nums dark:text-muted/65"
              >
                <span>
                  <span class="text-muted dark:text-muted/55">{{ t('home.colPlan') }}</span>
                  <span class="ml-1 font-medium">{{ formatAnalysisPercentTrimmed(block.l2Metrics.targetPercent) }}</span>
                </span>
                <span>
                  <span class="text-muted dark:text-muted/55">{{ t('home.colActual') }}</span>
                  <span class="ml-1 font-medium">{{ formatAnalysisPercentTrimmed(block.l2Metrics.actualPercent) }}</span>
                </span>
              </div>
            </div>

            <div
              v-for="product in block.products"
              :key="product.key"
              class="px-3 py-2.5"
            >
              <p class="text-sm font-medium truncate mb-2">{{ product.label || '—' }}</p>
              <div :class="metricCols">
                <div>
                  <p class="text-[10px] text-muted mb-0.5">{{ t('home.colPlan') }}</p>
                  <p class="text-lg font-semibold tabular-nums leading-tight">
                    {{
                      showAmount
                        ? formatAnalysisMoney(product.targetAmount, locale)
                        : formatAnalysisPercentTrimmed(product.targetPercent)
                    }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] text-muted mb-0.5">{{ t('home.colActual') }}</p>
                  <p class="text-lg font-semibold tabular-nums leading-tight">
                    {{
                      showAmount
                        ? formatAnalysisMoney(product.actualAmount, locale)
                        : formatAnalysisPercentTrimmed(product.actualPercent)
                    }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] text-muted mb-0.5">{{ t('home.colDrift') }}</p>
                  <p
                    class="text-lg font-semibold tabular-nums leading-tight"
                    :class="gapClass(product.percentGap)"
                  >
                    {{
                      showAmount
                        ? formatAnalysisMoney(product.amountGap, locale)
                        : formatAnalysisGapPercentTrimmed(product.percentGap)
                    }}
                  </p>
                </div>
              </div>
            </div>
          </template>

          <p
            v-if="!driftBlocks.length || driftBlocks.every(b => !b.products.length && !b.l2)"
            class="text-sm text-muted text-center py-8"
          >
            —
          </p>
        </div>
      </div>
    </template>
    </div>
  </section>
</template>
