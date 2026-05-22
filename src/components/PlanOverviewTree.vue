<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PlanL1Icon from './PlanL1Icon.vue'
import { useAppStore } from '../composables/useAppStore'
import { getChildren } from '../lib/categories'
import {
  categoryTotalPercent,
  hasDirectProducts,
  itemsUnderNode,
  planItemTotalPercent
} from '../lib/plan'
import type { CategoryNode, PlanItem } from '../types'

defineProps<{
  showItems: boolean
  weightMode: 'parent' | 'total'
}>()

const { t } = useI18n()
const { state } = useAppStore()

function weightRight(node: CategoryNode, mode: 'parent' | 'total'): string {
  if (mode === 'total' && node.level > 1) {
    return `${categoryTotalPercent(state.categories, node.id).toFixed(1)}%`
  }
  return `${(Number(node.weightOfParent) || 0).toFixed(1)}%`
}

function itemWeightRight(item: PlanItem, mode: 'parent' | 'total'): string {
  if (mode === 'total') {
    return `${planItemTotalPercent(state.categories, item).toFixed(2)}%`
  }
  return `${(Number(item.targetPercent) || 0).toFixed(1)}%`
}
</script>

<template>
  <p v-if="!getChildren(state.categories, null).length" class="text-sm text-muted py-10 text-center">
    {{ t('plan.chartEmpty') }}
  </p>

  <ul v-else class="space-y-2">
    <li
      v-for="l1 in getChildren(state.categories, null)"
      :key="l1.id"
      class="rounded-xl border border-default/80 overflow-hidden"
    >
      <div class="flex items-center gap-2.5 px-3 py-2.5 bg-elevated/40">
        <span class="flex size-5 shrink-0 items-center justify-center text-primary">
          <PlanL1Icon :icon-key="l1.iconKey" size="sm" />
        </span>
        <span class="flex-1 font-semibold text-sm leading-5 truncate self-center">{{ l1.name }}</span>
        <span class="tabular-nums text-sm font-medium text-primary shrink-0">{{ weightRight(l1, weightMode) }}</span>
      </div>

      <ul v-if="showItems && hasDirectProducts(state.plan.items, l1.id, 1)" class="border-t border-default/40 pb-1">
        <li
          v-for="item in itemsUnderNode(state.plan.items, l1.id, 1)"
          :key="item.id"
          class="flex items-center gap-2 pl-6 pr-3 py-1.5"
        >
          <span class="flex-1 text-xs truncate">{{ item.name || '—' }}</span>
          <span class="tabular-nums text-[11px] text-muted/90 shrink-0">{{ itemWeightRight(item, weightMode) }}</span>
        </li>
      </ul>

      <ul v-else-if="getChildren(state.categories, l1.id).length" class="border-t border-default/50">
        <li v-for="l2 in getChildren(state.categories, l1.id)" :key="l2.id" class="border-b border-default/30 last:border-0">
          <div class="flex items-center gap-2 pl-6 pr-3 py-2 bg-default/25">
            <span class="flex-1 text-sm truncate">{{ l2.name }}</span>
            <span class="tabular-nums text-xs font-medium text-muted shrink-0">{{ weightRight(l2, weightMode) }}</span>
          </div>

          <ul v-if="showItems && hasDirectProducts(state.plan.items, l2.id, 2)" class="pb-1">
            <li
              v-for="item in itemsUnderNode(state.plan.items, l2.id, 2)"
              :key="item.id"
              class="flex items-center gap-2 pl-10 pr-3 py-1"
            >
              <span class="flex-1 text-xs truncate">{{ item.name || '—' }}</span>
              <span class="tabular-nums text-[11px] text-muted/90 shrink-0">{{ itemWeightRight(item, weightMode) }}</span>
            </li>
          </ul>

          <ul v-else-if="getChildren(state.categories, l2.id).length">
            <li v-for="l3 in getChildren(state.categories, l2.id)" :key="l3.id">
              <div class="flex items-center gap-2 pl-10 pr-3 py-1.5">
                <span class="flex-1 text-xs text-muted truncate">{{ l3.name }}</span>
                <span class="tabular-nums text-xs shrink-0">{{ weightRight(l3, weightMode) }}</span>
              </div>

              <ul v-if="showItems && itemsUnderNode(state.plan.items, l3.id, 3).length" class="pb-1.5">
                <li
                  v-for="item in itemsUnderNode(state.plan.items, l3.id, 3)"
                  :key="item.id"
                  class="flex items-center gap-2 pl-14 pr-3 py-1"
                >
                  <span class="flex-1 text-xs truncate">{{ item.name || '—' }}</span>
                  <span class="tabular-nums text-[11px] text-muted/90 shrink-0">{{ itemWeightRight(item, weightMode) }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</template>
