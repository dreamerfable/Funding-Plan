<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AnalysisTrendGroupRow from './AnalysisTrendGroupRow.vue'
import { getChildren } from '../lib/categories'
import type { CategoryNode, Snapshot } from '../types'

const props = defineProps<{
  snapshots: Snapshot[]
  categories: CategoryNode[]
}>()

const { t } = useI18n()

const expandedNodeId = ref<string | null>(null)

const sortedSnapshots = computed(() =>
  [...props.snapshots].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
)

const headerGridStyle = computed(() => ({
  gridTemplateColumns: `minmax(6rem, 1.35fr) ${sortedSnapshots.value.map(() => 'minmax(5rem, 5.75rem)').join(' ')}`
}))

const minWidth = computed(() => `${Math.max(320, 140 + sortedSnapshots.value.length * 80)}px`)

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
      class="grid gap-x-2 items-center text-[10px] sm:text-xs text-muted tabular-nums"
      :style="{ minWidth, ...headerGridStyle }"
    >
      <span class="pt-2 pb-1.5 pr-1">{{ t('analysis.categoryName') }}</span>
      <span v-for="s in sortedSnapshots" :key="s.id" class="text-right pt-2 pb-1.5 truncate">
        {{ s.label }}
      </span>
    </div>

    <ul class="space-y-2" :style="{ minWidth }">
      <li
        v-for="l1 in getChildren(categories, null)"
        :key="l1.id"
        class="rounded-xl border border-default/80 overflow-hidden"
      >
        <AnalysisTrendGroupRow
          :node="l1"
          :snapshots="sortedSnapshots"
          :categories="categories"
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
            <AnalysisTrendGroupRow
              :node="l2"
              :snapshots="sortedSnapshots"
              :categories="categories"
              :expanded="expandedNodeId === l2.id"
              variant="l2"
              @toggle="toggleExpand(l2.id)"
            />
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
