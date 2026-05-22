<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import { getChildren, getNode } from '../lib/categories'
import type { CategoryNode } from '../types'

interface ScopeTreeItem {
  id: string
  label: string
  defaultExpanded?: boolean
  onSelect?: () => void
  children?: ScopeTreeItem[]
}

const model = defineModel<string>({ default: 'all' })

const props = defineProps<{
  categories: CategoryNode[]
}>()

const { t } = useI18n()
const open = ref(false)

function pick(id: string) {
  model.value = id
  open.value = false
}

function buildNode(node: CategoryNode): ScopeTreeItem {
  const children = getChildren(props.categories, node.id)
  const hasChildren = children.length > 0
  return {
    id: node.id,
    label: node.name,
    defaultExpanded: hasChildren,
    onSelect: () => pick(node.id),
    children: hasChildren ? children.map(buildNode) : undefined
  }
}

const treeItems = computed<ScopeTreeItem[]>(() => {
  const l1 = getChildren(props.categories, null)
  return [
    {
      id: 'all',
      label: t('analysis.chartScopeAll'),
      defaultExpanded: l1.length > 0,
      onSelect: () => pick('all'),
      children: l1.map(buildNode)
    }
  ]
})

const selectedLabel = computed(() => {
  if (model.value === 'all') return t('analysis.chartScopeAll')
  return getNode(props.categories, model.value)?.name ?? t('analysis.chartScopeAll')
})

const getTreeKey = (item: ScopeTreeItem) => item.id
</script>

<template>
  <div class="w-full">
    <UPopover
      v-model:open="open"
      :content="{ align: 'start', side: 'bottom' }"
      :ui="{ content: 'p-0 w-[var(--reka-popper-anchor-width)]' }"
    >
      <UButton
        variant="outline"
        color="neutral"
        block
        class="w-full justify-between font-normal"
        trailing
      >
        <span class="truncate">{{ selectedLabel }}</span>
        <template #trailing>
          <ChevronDown class="size-4 shrink-0 opacity-60" />
        </template>
      </UButton>
      <template #content>
        <div class="chart-scope-tree w-full p-1.5 max-h-64 overflow-auto">
        <UTree
          :items="treeItems"
          :get-key="getTreeKey"
          size="sm"
        >
          <template #item="{ item, expanded, handleToggle }">
            <div
              role="button"
              tabindex="0"
              class="flex w-full min-w-0 items-center gap-1.5 text-xs text-left cursor-pointer"
              @click="(item as ScopeTreeItem).onSelect?.()"
              @keyup.enter="(item as ScopeTreeItem).onSelect?.()"
            >
              <span class="flex-1 truncate">{{ item.label }}</span>
              <button
                v-if="item.children?.length"
                type="button"
                class="shrink-0 p-0.5 text-muted hover:text-default"
                :aria-label="expanded ? 'collapse' : 'expand'"
                @click.stop="handleToggle()"
              >
                <ChevronRight
                  class="size-3.5 transition-transform"
                  :class="expanded ? 'rotate-90' : ''"
                />
              </button>
            </div>
          </template>
        </UTree>
      </div>
      </template>
    </UPopover>
  </div>
</template>

<style scoped>
.chart-scope-tree :deep([data-slot='linkLeadingIcon']) {
  display: none;
}

.chart-scope-tree :deep([data-slot='link']) {
  min-height: 0;
}
</style>
