<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDownUp, FolderPlus, ListPlus, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import PlanCategorySortPanel from './PlanCategorySortPanel.vue'
import PlanL1Icon from './PlanL1Icon.vue'
import PlanProductRows from './PlanProductRows.vue'
import { useAppStore } from '../composables/useAppStore'
import { canDelete, getChildren, levelOfParent } from '../lib/categories'
import { L1_ICON_OPTIONS } from '../lib/l1-icons'
import {
  canAddChildCategory,
  canAddProduct,
  categoryTotalPercent,
  hasDirectProducts,
  isPlanBalanced,
  itemsUnderNode,
  isNodeSiblingSumBalanced,
  nodeSiblingSumLabel,
  planItemsTotalPercentSum
} from '../lib/plan'
import type { CategoryNode, L1IconKey } from '../types'

const emit = defineEmits<{ save: [] }>()

const { t } = useI18n()
const {
  state,
  addCategory,
  updateCategory,
  removeCategory,
  addPlanItem,
  confirmPlanSave
} = useAppStore()

const addingParent = ref<string | 'root' | null>(null)
const newCatName = ref('')
const addModalOpen = computed({
  get: () => addingParent.value !== null,
  set: (open: boolean) => {
    if (!open) {
      addingParent.value = null
      newCatName.value = ''
    }
  }
})
const addModalTitle = computed(() => {
  const p = addingParent.value
  if (p === null) return ''
  if (p === 'root') return t('plan.addL1')
  const parent = state.categories.find(c => c.id === p)
  return parent ? t('plan.addSubCategoryUnder', { name: parent.name }) : t('plan.addSubCategory')
})
const editingCatId = ref<string | null>(null)
const editCatName = ref('')
const iconPickerL1 = ref<string | null>(null)
const sortMode = ref(false)

function toggleSortMode() {
  sortMode.value = !sortMode.value
  if (sortMode.value) {
    addingParent.value = null
    editingCatId.value = null
    iconPickerL1.value = null
  }
}

function exitSortMode() {
  sortMode.value = false
}

const balanced = computed(() => isPlanBalanced(state.categories, state.plan.items))
const totalWeight = computed(() => planItemsTotalPercentSum(state.categories, state.plan.items))

function startAddCat(parentId: string | null) {
  addingParent.value = parentId ?? 'root'
  newCatName.value = ''
}

function confirmAddCat() {
  if (!newCatName.value.trim() || addingParent.value === null) return
  const parentId = addingParent.value === 'root' ? null : addingParent.value
  const parent = parentId ? state.categories.find(c => c.id === parentId) : undefined
  addCategory(newCatName.value, parentId, levelOfParent(parent))
  addingParent.value = null
  newCatName.value = ''
}

function startEditCat(node: CategoryNode) {
  editingCatId.value = node.id
  editCatName.value = node.name
}

function confirmEditCat() {
  if (editingCatId.value) updateCategory(editingCatId.value, { name: editCatName.value })
  editingCatId.value = null
}

function addProduct(l1: CategoryNode, l2?: CategoryNode, l3?: CategoryNode) {
  addPlanItem({
    name: '',
    categoryL1Id: l1.id,
    categoryL2Id: l2?.id ?? '',
    categoryL3Id: l3?.id ?? '',
    targetPercent: 0
  })
}

function onSaveClick() {
  confirmPlanSave()
  emit('save')
}

function childSumClass(nodeId: string, level: 1 | 2 | 3) {
  return isNodeSiblingSumBalanced(state.categories, state.plan.items, nodeId, level)
    ? 'text-muted'
    : 'text-error font-medium'
}
</script>

<template>
  <div class="space-y-3 pb-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-1.5">
        <UButton size="sm" :disabled="sortMode" @click="startAddCat(null)">
          <FolderPlus class="size-4 mr-1" />
          {{ t('plan.addL1') }}
        </UButton>
        <UButton
          size="sm"
          variant="outline"
          :color="sortMode ? 'primary' : 'neutral'"
          :aria-label="t('plan.sortCategories')"
          @click="toggleSortMode"
        >
          <ArrowDownUp class="size-4" />
        </UButton>
      </div>
      <UBadge v-if="!sortMode" :color="balanced ? 'success' : 'warning'" variant="subtle" size="lg">
        {{ t('plan.totalWeight') }} {{ totalWeight.toFixed(1) }}%
      </UBadge>
      <UBadge v-else color="primary" variant="subtle" size="lg">
        {{ t('plan.sortModeActive') }}
      </UBadge>
    </div>

    <PlanCategorySortPanel v-if="sortMode" @done="exitSortMode" />

    <template v-else>
    <p v-if="!getChildren(state.categories, null).length" class="text-sm text-muted py-8 text-center">
      {{ t('plan.emptyTree') }}
    </p>

    <ul v-else class="space-y-2">
      <template v-for="l1 in getChildren(state.categories, null)" :key="l1.id">
        <li class="rounded-xl border border-default bg-elevated/40 overflow-hidden">
          <div class="flex items-center gap-2.5 px-3 py-2.5 min-h-[48px]">
            <div class="relative shrink-0 flex items-center">
              <button
                type="button"
                class="flex size-5 items-center justify-center text-primary hover:opacity-80 transition-opacity"
                @click="iconPickerL1 = iconPickerL1 === l1.id ? null : l1.id"
              >
                <PlanL1Icon :icon-key="l1.iconKey" size="sm" />
              </button>
              <div
                v-if="iconPickerL1 === l1.id"
                class="absolute left-0 top-full z-20 mt-1 flex gap-1 p-1.5 rounded-lg border border-default bg-default shadow-lg"
              >
                <button
                  v-for="opt in L1_ICON_OPTIONS"
                  :key="opt.key"
                  type="button"
                  class="p-1 text-muted hover:text-primary"
                  :class="l1.iconKey === opt.key ? 'text-primary' : ''"
                  @click="updateCategory(l1.id, { iconKey: opt.key as L1IconKey }); iconPickerL1 = null"
                >
                  <PlanL1Icon :icon-key="opt.key" size="sm" />
                </button>
              </div>
            </div>

            <template v-if="editingCatId === l1.id">
              <UInput v-model="editCatName" size="sm" class="flex-1 min-w-0" @keyup.enter="confirmEditCat" />
              <UButton size="xs" @click="confirmEditCat">{{ t('common.save') }}</UButton>
            </template>
            <template v-else>
              <span class="flex-1 font-medium text-sm leading-5 min-w-0 truncate self-center">{{ l1.name }}</span>
              <UInput
                :model-value="l1.weightOfParent ?? 0"
                type="number"
                min="0"
                max="100"
                step="0.1"
                size="xs"
                class="w-[4.25rem] shrink-0"
                @update:model-value="updateCategory(l1.id, { weightOfParent: Number($event) })"
              >
                <template #trailing>%</template>
              </UInput>
              <span
                class="text-[10px] tabular-nums shrink-0 w-10 text-right"
                :class="childSumClass(l1.id, 1)"
                :title="t('plan.childSum')"
              >
                {{ nodeSiblingSumLabel(state.categories, state.plan.items, l1.id, 1) }}
              </span>
              <div class="flex gap-0.5 shrink-0">
                <UButton
                  v-if="canAddProduct(state.categories, state.plan.items, l1.id, 1)"
                  size="xs"
                  variant="ghost"
                  color="primary"
                  @click="addProduct(l1)"
                >
                  <ListPlus class="size-3.5" />
                </UButton>
                <UButton
                  v-if="canAddChildCategory(state.categories, state.plan.items, l1.id, 1)"
                  size="xs"
                  variant="ghost"
                  @click="startAddCat(l1.id)"
                >
                  <Plus class="size-3.5" />
                </UButton>
                <UButton size="xs" variant="ghost" @click="startEditCat(l1)"><Pencil class="size-3.5" /></UButton>
                <UButton size="xs" variant="ghost" color="error" :disabled="!canDelete(state.categories, l1.id)" @click="removeCategory(l1.id)">
                  <Trash2 class="size-3.5" />
                </UButton>
              </div>
            </template>
          </div>

          <PlanProductRows
            v-if="hasDirectProducts(state.plan.items, l1.id, 1)"
            :items="itemsUnderNode(state.plan.items, l1.id, 1)"
            indent-class="px-3"
          />

          <ul v-else-if="getChildren(state.categories, l1.id).length" class="border-t border-default/60">
            <template v-for="l2 in getChildren(state.categories, l1.id)" :key="l2.id">
              <li class="border-b border-default/40 last:border-0">
                <div class="flex items-center gap-2 pl-4 pr-3 py-2 min-h-[44px] bg-default/20">
                  <template v-if="editingCatId === l2.id">
                    <UInput v-model="editCatName" size="sm" class="flex-1" @keyup.enter="confirmEditCat" />
                    <UButton size="xs" @click="confirmEditCat">{{ t('common.save') }}</UButton>
                  </template>
                  <template v-else>
                    <span class="flex-1 text-sm min-w-0 truncate">{{ l2.name }}</span>
                    <span class="text-[10px] text-muted tabular-nums shrink-0 hidden sm:inline">
                      {{ t('plan.ofTotal') }} {{ categoryTotalPercent(state.categories, l2.id).toFixed(1) }}%
                    </span>
                    <UInput
                      :model-value="l2.weightOfParent ?? 0"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      size="xs"
                      class="w-[4.25rem] shrink-0"
                      @update:model-value="updateCategory(l2.id, { weightOfParent: Number($event) })"
                    >
                      <template #trailing>%</template>
                    </UInput>
                    <span
                      class="text-[10px] tabular-nums shrink-0 w-10 text-right"
                      :class="childSumClass(l2.id, 2)"
                      :title="t('plan.childSum')"
                    >
                      {{ nodeSiblingSumLabel(state.categories, state.plan.items, l2.id, 2) }}
                    </span>
                    <div class="flex gap-0.5 shrink-0">
                      <UButton
                        v-if="canAddProduct(state.categories, state.plan.items, l2.id, 2)"
                        size="xs"
                        variant="ghost"
                        color="primary"
                        @click="addProduct(l1, l2)"
                      >
                        <ListPlus class="size-3.5" />
                      </UButton>
                      <UButton
                        v-if="canAddChildCategory(state.categories, state.plan.items, l2.id, 2)"
                        size="xs"
                        variant="ghost"
                        @click="startAddCat(l2.id)"
                      >
                        <Plus class="size-3.5" />
                      </UButton>
                      <UButton size="xs" variant="ghost" @click="startEditCat(l2)"><Pencil class="size-3.5" /></UButton>
                      <UButton size="xs" variant="ghost" color="error" :disabled="!canDelete(state.categories, l2.id)" @click="removeCategory(l2.id)">
                        <Trash2 class="size-3.5" />
                      </UButton>
                    </div>
                  </template>
                </div>

                <PlanProductRows
                  v-if="hasDirectProducts(state.plan.items, l2.id, 2)"
                  :items="itemsUnderNode(state.plan.items, l2.id, 2)"
                  indent-class="pl-4 pr-3"
                />

                <ul v-else-if="getChildren(state.categories, l2.id).length">
                  <li v-for="l3 in getChildren(state.categories, l2.id)" :key="l3.id" class="border-t border-default/30">
                    <div class="flex items-center gap-2 pl-8 pr-3 py-2 min-h-[42px]">
                      <template v-if="editingCatId === l3.id">
                        <UInput v-model="editCatName" size="sm" class="flex-1" @keyup.enter="confirmEditCat" />
                        <UButton size="xs" @click="confirmEditCat">{{ t('common.save') }}</UButton>
                      </template>
                      <template v-else>
                        <span class="flex-1 text-xs font-medium min-w-0 truncate">{{ l3.name }}</span>
                        <span class="text-[10px] text-muted tabular-nums shrink-0 hidden sm:inline">
                          {{ t('plan.ofTotal') }} {{ categoryTotalPercent(state.categories, l3.id).toFixed(1) }}%
                        </span>
                        <UInput
                          :model-value="l3.weightOfParent ?? 0"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          size="xs"
                          class="w-[4.25rem] shrink-0"
                          @update:model-value="updateCategory(l3.id, { weightOfParent: Number($event) })"
                        >
                          <template #trailing>%</template>
                        </UInput>
                        <span
                          class="text-[10px] tabular-nums shrink-0 w-10 text-right"
                          :class="childSumClass(l3.id, 3)"
                          :title="t('plan.childSum')"
                        >
                          {{ nodeSiblingSumLabel(state.categories, state.plan.items, l3.id, 3) }}
                        </span>
                        <div class="flex gap-0.5 shrink-0">
                          <UButton size="xs" variant="ghost" color="primary" @click="addProduct(l1, l2, l3)">
                            <ListPlus class="size-3.5" />
                          </UButton>
                          <UButton size="xs" variant="ghost" @click="startEditCat(l3)"><Pencil class="size-3.5" /></UButton>
                          <UButton size="xs" variant="ghost" color="error" :disabled="!canDelete(state.categories, l3.id)" @click="removeCategory(l3.id)">
                            <Trash2 class="size-3.5" />
                          </UButton>
                        </div>
                      </template>
                    </div>

                    <PlanProductRows
                      :items="itemsUnderNode(state.plan.items, l3.id, 3)"
                      indent-class="pl-8 pr-3"
                    />
                  </li>
                </ul>
              </li>
            </template>
          </ul>
        </li>
      </template>
    </ul>

    <UButton block size="xl" class="mt-4" @click="onSaveClick">
      {{ t('plan.savePlan') }}
    </UButton>
    </template>

    <UModal v-model:open="addModalOpen" :title="addModalTitle">
      <template #body>
        <UFormField :label="t('plan.name')">
          <UInput v-model="newCatName" autofocus @keyup.enter="confirmAddCat" />
        </UFormField>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2 w-full">
          <UButton variant="ghost" @click="close">{{ t('common.cancel') }}</UButton>
          <UButton :disabled="!newCatName.trim()" @click="confirmAddCat">{{ t('common.save') }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
