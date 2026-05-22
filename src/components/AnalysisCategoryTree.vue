<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AnalysisGroupRow from './AnalysisGroupRow.vue'
import { buildCategoryAnalysisMap } from '../lib/analysis'
import { getChildren } from '../lib/categories'
import type { CategoryNode, PlanRowAnalysis, Snapshot } from '../types'

const props = defineProps<{
  snapshot: Snapshot
  categories: CategoryNode[]
}>()

const { t } = useI18n()

const expandedNodeId = ref<string | null>(null)

const analysisMap = computed(() => buildCategoryAnalysisMap(props.snapshot, props.categories))

const rowGrid =
  'grid grid-cols-[minmax(6rem,1.35fr)_4.75rem_4.75rem_4.75rem] sm:grid-cols-[minmax(7.5rem,1.5fr)_6rem_6rem_6rem] gap-x-2 items-start'

function metrics(nodeId: string): PlanRowAnalysis {
  return (
    analysisMap.value.get(nodeId) ?? {
      key: nodeId,
      label: '',
      level: 1,
      targetPercent: 0,
      actualPercent: 0,
      targetAmount: 0,
      actualAmount: 0,
      percentGap: 0,
      amountGap: 0
    }
  )
}

function toggleExpand(nodeId: string) {
  expandedNodeId.value = expandedNodeId.value === nodeId ? null : nodeId
}
</script>

<template>
  <p v-if="!getChildren(categories, null).length" class="text-sm text-muted py-6 text-center">
    {{ t('plan.chartEmpty') }}
  </p>

  <div v-else class="overflow-x-auto -mx-1 px-1">
    <div
      class="text-[10px] sm:text-xs text-muted tabular-nums min-w-[340px]"
      :class="rowGrid"
    >
      <span class="py-2 pr-1">{{ t('analysis.categoryName') }}</span>
      <span class="text-right py-2">{{ t('analysis.planned') }}</span>
      <span class="text-right py-2">{{ t('analysis.actual') }}</span>
      <span class="text-right py-2">{{ t('analysis.drift') }}</span>
    </div>

    <ul class="space-y-2 min-w-[340px]">
      <li
        v-for="l1 in getChildren(categories, null)"
        :key="l1.id"
        class="rounded-xl border border-default/80 overflow-hidden"
      >
        <AnalysisGroupRow
          :node="l1"
          :snapshot="snapshot"
          :categories="categories"
          :metrics="metrics(l1.id)"
          :expanded="expandedNodeId === l1.id"
          variant="l1"
          @toggle="toggleExpand(l1.id)"
        />

        <ul v-if="getChildren(categories, l1.id).length" class="border-t border-default/50">
          <li
            v-for="l2 in getChildren(categories, l1.id)"
            :key="l2.id"
            class="border-b border-default/30 last:border-0"
          >
            <AnalysisGroupRow
              :node="l2"
              :snapshot="snapshot"
              :categories="categories"
              :metrics="metrics(l2.id)"
              :expanded="expandedNodeId === l2.id"
              variant="l2"
              @toggle="toggleExpand(l2.id)"
            />

            <ul v-if="getChildren(categories, l2.id).length">
              <li v-for="l3 in getChildren(categories, l2.id)" :key="l3.id">
                <AnalysisGroupRow
                  :node="l3"
                  :snapshot="snapshot"
                  :categories="categories"
                  :metrics="metrics(l3.id)"
                  :expanded="expandedNodeId === l3.id"
                  variant="l3"
                  @toggle="toggleExpand(l3.id)"
                />
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
