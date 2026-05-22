<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import { getChildren, getNode } from '../lib/categories'
import type { CategoryNode } from '../types'

interface ScopeTreeItem {
  id: string
  label: string
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
  return {
    id: node.id,
    label: node.name,
    onSelect: () => pick(node.id),
    children: children.length ? children.map(buildNode) : undefined
  }
}

const treeItems = computed<ScopeTreeItem[]>(() => [
  {
    id: 'all',
    label: t('analysis.chartScopeAll'),
    onSelect: () => pick('all'),
    children: getChildren(props.categories, null).map(buildNode)
  }
])

const selectedLabel = computed(() => {
  if (model.value === 'all') return t('analysis.chartScopeAll')
  return getNode(props.categories, model.value)?.name ?? t('analysis.chartScopeAll')
})

const getTreeKey = (item: ScopeTreeItem) => item.id
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      variant="outline"
      color="neutral"
      class="w-full sm:w-56 justify-between font-normal"
      trailing
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <template #trailing>
        <ChevronDown class="size-4 shrink-0 opacity-60" />
      </template>
    </UButton>
    <template #content>
      <div class="p-1.5 w-[min(100vw-2rem,16rem)] max-h-64 overflow-auto">
        <UTree
          :items="treeItems"
          :get-key="getTreeKey"
          :default-expanded="['all']"
          size="sm"
        />
      </div>
    </template>
  </UPopover>
</template>
