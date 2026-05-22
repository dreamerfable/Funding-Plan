<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../composables/useAppStore'
import { planItemTotalPercent } from '../lib/plan'
import type { PlanItem } from '../types'

defineProps<{
  items: PlanItem[]
  indentClass?: string
}>()

const { t } = useI18n()
const { state, updatePlanItem, removePlanItem } = useAppStore()

function itemTotalShort(item: PlanItem) {
  return `${planItemTotalPercent(state.categories, item).toFixed(2)}%`
}
</script>

<template>
  <div :class="[indentClass, 'pb-2 space-y-1.5']">
    <div
      v-for="item in items"
      :key="item.id"
      class="flex items-center gap-2 min-h-[36px]"
    >
      <div class="item-input-group flex flex-1 min-w-0 max-w-[min(100%,22rem)]">
        <UInput
          :model-value="item.name"
          size="sm"
          class="item-input-name flex-1 min-w-[7rem]"
          :placeholder="t('plan.itemName')"
          @update:model-value="updatePlanItem(item.id, { name: String($event) })"
        />
        <UInput
          :model-value="item.targetPercent"
          type="number"
          min="0"
          max="100"
          step="0.1"
          size="sm"
          class="item-input-pct w-[4.25rem] shrink-0"
          @update:model-value="updatePlanItem(item.id, { targetPercent: Number($event) })"
        >
          <template #trailing>%</template>
        </UInput>
      </div>
      <span class="text-[10px] text-muted tabular-nums shrink-0 leading-5 self-center" :title="t('plan.ofTotal')">
        {{ t('plan.ofTotal') }} {{ itemTotalShort(item) }}
      </span>
      <UButton size="xs" variant="ghost" color="error" class="shrink-0 self-center" @click="removePlanItem(item.id)">
        <Trash2 class="size-3.5" />
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.item-input-group :deep(.item-input-name input),
.item-input-group :deep(.item-input-name > *),
.item-input-group :deep(.item-input-name) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.item-input-group :deep(.item-input-pct input),
.item-input-group :deep(.item-input-pct > *),
.item-input-group :deep(.item-input-pct) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
}
</style>
