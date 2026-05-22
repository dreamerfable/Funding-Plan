<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import PlanRowMobile from './PlanRowMobile.vue'
import { planRowKey, usePlanMobileExpand } from '../composables/usePlanMobileExpand'
import { useAppStore } from '../composables/useAppStore'
import {
  planRowCell,
  planRowCol,
  planRowGrid,
  planRowIconClass,
  planModalFormField,
  planModalInput,
  planRowProductNameClass,
  planRowWithinGroupClass
} from '../lib/plan-row-layout'
import { formatPlanPercent, planItemTotalPercent, showPlanWithinGroupPercent } from '../lib/plan'
import type { PlanItem } from '../types'

defineProps<{
  items: PlanItem[]
  level: 1 | 2
}>()

const { t } = useI18n()
const { state, updatePlanItem, removePlanItem } = useAppStore()
const { collapseRow } = usePlanMobileExpand()

const editingItemId = ref<string | null>(null)
const editItemName = ref('')
const editItemWeight = ref(0)

const editItemModalOpen = computed({
  get: () => editingItemId.value !== null,
  set: (open: boolean) => {
    if (!open) cancelEditItem()
  }
})

function formatItemTotal(item: PlanItem) {
  return formatPlanPercent(planItemTotalPercent(state.categories, item))
}

function formatItemWithinGroup(item: PlanItem) {
  return formatPlanPercent(item.targetPercent)
}

function showItemWithinGroup(item: PlanItem) {
  return showPlanWithinGroupPercent(item.targetPercent)
}

function startEditItem(item: PlanItem) {
  collapseRow()
  editingItemId.value = item.id
  editItemName.value = item.name
  editItemWeight.value = Number(item.targetPercent) || 0
}

function cancelEditItem() {
  editingItemId.value = null
}

function confirmEditItem() {
  if (editingItemId.value) {
    updatePlanItem(editingItemId.value, {
      name: editItemName.value,
      targetPercent: Number(editItemWeight.value) || 0
    })
  }
  editingItemId.value = null
}

function onRemoveItem(itemId: string) {
  collapseRow()
  removePlanItem(itemId)
}
</script>

<template>
  <div class="border-t border-default/30 pb-1 space-y-0">
    <template v-for="item in items" :key="item.id">
      <PlanRowMobile
        :row-key="planRowKey('item', item.id)"
        :name="item.name || '—'"
        :name-class="planRowProductNameClass"
        :within="formatItemWithinGroup(item)"
        :total="formatItemTotal(item)"
        :level="level"
        :show-within="showItemWithinGroup(item)"
        metrics-indent
        extra-class="py-1.5"
      >
        <template #actions>
          <span :class="planRowCol.actionSlot" aria-hidden="true" />
          <UButton size="xs" variant="ghost" :class="planRowCell.action" @click="startEditItem(item)">
            <Pencil :class="planRowIconClass" />
          </UButton>
          <UButton size="xs" variant="ghost" color="error" :class="planRowCell.action" @click="onRemoveItem(item.id)">
            <Trash2 :class="planRowIconClass" />
          </UButton>
        </template>
      </PlanRowMobile>

      <div :class="[planRowGrid, 'py-1.5']">
        <span :class="planRowCell.icon" aria-hidden="true" />
        <span :class="planRowProductNameClass">{{ item.name || '—' }}</span>
        <span :class="planRowCell.childSum" aria-hidden="true" />
        <span :class="planRowWithinGroupClass[level]">
          <template v-if="showItemWithinGroup(item)">{{ formatItemWithinGroup(item) }}</template>
        </span>
        <span :class="planRowCell.ofTotal">{{ formatItemTotal(item) }}</span>
        <span :class="planRowCell.actionsGap" aria-hidden="true" />
        <span :class="planRowCol.actionSlot" aria-hidden="true" />
        <UButton size="xs" variant="ghost" :class="planRowCell.action" @click="startEditItem(item)">
          <Pencil :class="planRowIconClass" />
        </UButton>
        <UButton size="xs" variant="ghost" color="error" :class="planRowCell.action" @click="onRemoveItem(item.id)">
          <Trash2 :class="planRowIconClass" />
        </UButton>
      </div>
    </template>

    <UModal v-model:open="editItemModalOpen" :title="t('plan.editProduct')">
      <template #body>
        <div class="space-y-3">
          <UFormField :label="t('plan.itemName')" :class="planModalFormField">
            <UInput v-model="editItemName" :class="planModalInput" autofocus @keyup.enter="confirmEditItem" />
          </UFormField>
          <UFormField :label="t('plan.targetWeight')" :class="planModalFormField">
            <UInput v-model.number="editItemWeight" :class="planModalInput" type="number" min="0" max="100" step="0.1">
              <template #trailing>%</template>
            </UInput>
          </UFormField>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2 w-full">
          <UButton variant="ghost" @click="close">{{ t('common.cancel') }}</UButton>
          <UButton :disabled="!editItemName.trim()" @click="confirmEditItem">{{ t('common.save') }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
