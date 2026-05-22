<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { GripVertical } from 'lucide-vue-next'
import PlanL1Icon from './PlanL1Icon.vue'
import PlanCategorySortNode from './PlanCategorySortNode.vue'
import { useAppStore } from '../composables/useAppStore'
import { getChildren } from '../lib/categories'
import type { CategoryNode } from '../types'

const props = defineProps<{ parentId: string | null }>()

const { state, reorderCategorySiblings } = useAppStore()

const siblings = computed({
  get: () => getChildren(state.categories, props.parentId),
  set: (list: CategoryNode[]) => reorderCategorySiblings(props.parentId, list.map(c => c.id))
})
</script>

<template>
  <VueDraggable
    v-model="siblings"
    handle=".sort-handle"
    :animation="180"
    ghost-class="opacity-40"
    class="space-y-1.5"
    :class="parentId === null ? '' : 'px-2 pb-2'"
  >
    <div
      v-for="node in siblings"
      :key="node.id"
      class="rounded-lg border border-default bg-elevated/50 overflow-hidden"
    >
      <div class="flex items-center gap-2 px-2.5 py-2 min-h-[40px]">
        <button
          type="button"
          class="sort-handle shrink-0 touch-none cursor-grab active:cursor-grabbing text-muted hover:text-primary p-0.5"
          tabindex="-1"
        >
          <GripVertical class="size-4" />
        </button>
        <PlanL1Icon v-if="node.level === 1" :icon-key="node.iconKey" size="sm" class="shrink-0" />
        <span
          class="flex-1 truncate"
          :class="node.level === 1 ? 'text-sm font-medium' : 'text-sm'"
        >
          {{ node.name }}
        </span>
      </div>
      <div v-if="node.level < 2" class="border-t border-default/50 bg-default/15">
        <PlanCategorySortNode :parent-id="node.id" />
      </div>
    </div>
  </VueDraggable>
</template>
