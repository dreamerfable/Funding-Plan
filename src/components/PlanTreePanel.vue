<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, ArrowDownUp, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import PlanCategorySortPanel from './PlanCategorySortPanel.vue'
import PlanL1Icon from './PlanL1Icon.vue'
import PlanProductRows from './PlanProductRows.vue'
import PlanRowMobile from './PlanRowMobile.vue'
import { planRowKey, providePlanMobileExpand } from '../composables/usePlanMobileExpand'
import { useAppStore } from '../composables/useAppStore'
import { canDelete, getChildren, levelOfParent } from '../lib/categories'
import { L1_ICON_OPTIONS } from '../lib/l1-icons'
import {
  canAddProduct,
  categoryTotalPercent,
  l1AddKind,
  hasDirectProducts,
  isPlanBalanced,
  itemsUnderNode,
  isNodeSiblingSumBalanced,
  nodeSiblingSumValue,
  formatPlanPercent,
  planItemsTotalPercentSum,
  showCategoryWithinGroup
} from '../lib/plan'
import {
  planRowCell,
  planRowCol,
  planRowGrid,
  planRowIconClass,
  planRowNameClass,
  planRowCard,
  planModalFormField,
  planModalInput,
  planRowWithinGroupClass
} from '../lib/plan-row-layout'
import type { CategoryNode, L1IconKey } from '../types'

const emit = defineEmits<{ save: [] }>()

const { t } = useI18n()
const toast = useToast()
const {
  state,
  addCategory,
  updateCategory,
  removeCategory,
  addPlanItem,
  confirmPlanSave
} = useAppStore()

const { collapseRow } = providePlanMobileExpand()

const addingParent = ref<string | 'root' | null>(null)
const newCatName = ref('')
const newCatWeight = ref(0)
const addModalOpen = computed({
  get: () => addingParent.value !== null,
  set: (open: boolean) => {
    if (!open) {
      addingParent.value = null
      newCatName.value = ''
      newCatWeight.value = 0
    }
  }
})
const editCatModalOpen = computed({
  get: () => editingCatId.value !== null,
  set: (open: boolean) => {
    if (!open) cancelEditCat()
  }
})
const editingCatNode = computed(() =>
  editingCatId.value ? state.categories.find(c => c.id === editingCatId.value) : undefined
)
const editingCatIsL1 = computed(() => editingCatNode.value?.level === 1)

const l1AddChoiceOpen = ref(false)
const l1AddChoiceTarget = ref<CategoryNode | null>(null)
const l1AddChoiceModalOpen = computed({
  get: () => l1AddChoiceOpen.value,
  set: (open: boolean) => {
    if (!open) {
      l1AddChoiceOpen.value = false
      l1AddChoiceTarget.value = null
    }
  }
})

const productAddOpen = ref(false)
const productAddCtx = ref<{ l1Id: string; l2Id: string } | null>(null)
const newProductName = ref('')
const newProductWeight = ref(0)
const productAddModalOpen = computed({
  get: () => productAddOpen.value,
  set: (open: boolean) => {
    if (!open) {
      productAddOpen.value = false
      productAddCtx.value = null
      newProductName.value = ''
      newProductWeight.value = 0
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
const editCatWeight = ref(0)
const iconPickerL1 = ref<string | null>(null)
const sortMode = ref(false)

function toggleSortMode() {
  sortMode.value = !sortMode.value
  if (sortMode.value) {
    addingParent.value = null
    editingCatId.value = null
    iconPickerL1.value = null
    collapseRow()
    productAddOpen.value = false
    l1AddChoiceOpen.value = false
    l1AddChoiceTarget.value = null
  }
}

function exitSortMode() {
  sortMode.value = false
}

const balanced = computed(() => isPlanBalanced(state.categories, state.plan.items))
const totalWeight = computed(() => planItemsTotalPercentSum(state.categories, state.plan.items))

function startAddCat(parentId: string | null) {
  collapseRow()
  addingParent.value = parentId ?? 'root'
  newCatName.value = ''
  newCatWeight.value = 0
}

function confirmAddCat() {
  if (!newCatName.value.trim() || addingParent.value === null) return
  const parentId = addingParent.value === 'root' ? null : addingParent.value
  const parent = parentId ? state.categories.find(c => c.id === parentId) : undefined
  addCategory(newCatName.value, parentId, levelOfParent(parent), newCatWeight.value)
  addingParent.value = null
  newCatName.value = ''
  newCatWeight.value = 0
}

function onRemoveCategory(id: string) {
  collapseRow()
  removeCategory(id)
}

function startEditCat(node: CategoryNode) {
  collapseRow()
  editingCatId.value = node.id
  editCatName.value = node.name
  editCatWeight.value = Number(node.weightOfParent) || 0
}

function cancelEditCat() {
  editingCatId.value = null
}

function confirmEditCat() {
  if (editingCatId.value) {
    updateCategory(editingCatId.value, {
      name: editCatName.value,
      weightOfParent: Number(editCatWeight.value) || 0
    })
  }
  editingCatId.value = null
}

function formatWithinGroupWeight(node: CategoryNode) {
  return formatPlanPercent(Number(node.weightOfParent) || 0)
}

function formatTotalPercent(nodeId: string) {
  return formatPlanPercent(categoryTotalPercent(state.categories, nodeId))
}

function showChildSumWarn(nodeId: string, level: 1 | 2) {
  const sum = nodeSiblingSumValue(state.categories, state.plan.items, nodeId, level)
  if (sum === null) return false
  return !isNodeSiblingSumBalanced(state.categories, state.plan.items, nodeId, level)
}

function notifyChildSumUnbalanced() {
  toast.add({
    title: t('plan.childSumWarnTitle'),
    description: t('plan.childSumWarnDesc'),
    color: 'warning'
  })
}

function onL1AddClick(l1: CategoryNode) {
  const kind = l1AddKind(state.categories, state.plan.items, l1.id)
  if (!kind) return
  collapseRow()
  if (kind === 'choice') {
    l1AddChoiceTarget.value = l1
    l1AddChoiceOpen.value = true
    return
  }
  if (kind === 'product') openAddProduct(l1)
  else startAddCat(l1.id)
}

function chooseAddSubCategoryFromL1() {
  const l1 = l1AddChoiceTarget.value
  if (!l1) return
  l1AddChoiceOpen.value = false
  l1AddChoiceTarget.value = null
  startAddCat(l1.id)
}

function chooseAddProductFromL1() {
  const l1 = l1AddChoiceTarget.value
  if (!l1) return
  l1AddChoiceOpen.value = false
  l1AddChoiceTarget.value = null
  openAddProduct(l1)
}

function openAddProduct(l1: CategoryNode, l2?: CategoryNode) {
  collapseRow()
  productAddCtx.value = {
    l1Id: l1.id,
    l2Id: l2?.id ?? ''
  }
  newProductName.value = ''
  newProductWeight.value = 0
  productAddOpen.value = true
}

function confirmAddProduct() {
  if (!productAddCtx.value || !newProductName.value.trim()) return
  const { l1Id, l2Id } = productAddCtx.value
  addPlanItem({
    name: newProductName.value.trim(),
    categoryL1Id: l1Id,
    categoryL2Id: l2Id,
    categoryL3Id: '',
    targetPercent: Number(newProductWeight.value) || 0
  })
  productAddOpen.value = false
  productAddCtx.value = null
  newProductName.value = ''
  newProductWeight.value = 0
}

function onSaveClick() {
  confirmPlanSave()
  emit('save')
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
        {{ t('plan.totalWeight') }} {{ formatPlanPercent(totalWeight) }}
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
        <li :class="planRowCard">
          <PlanRowMobile
            :row-key="planRowKey('cat', l1.id)"
            :name="l1.name"
            :name-class="planRowNameClass[1]"
            :within="formatWithinGroupWeight(l1)"
            :total="formatTotalPercent(l1.id)"
            :level="1"
            :show-warn="showChildSumWarn(l1.id, 1)"
            :show-within="showCategoryWithinGroup(1)"
            extra-class="py-2.5"
            @warn="notifyChildSumUnbalanced"
          >
            <template #leading>
              <div class="relative flex size-5 shrink-0 items-center justify-center" @click.stop>
                <button
                  type="button"
                  class="flex size-5 items-center justify-center text-primary hover:opacity-80"
                  @click="iconPickerL1 = iconPickerL1 === l1.id ? null : l1.id"
                >
                  <PlanL1Icon :icon-key="l1.iconKey" size="sm" />
                </button>
                <div
                  v-if="iconPickerL1 === l1.id"
                  class="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-default bg-default p-1.5 shadow-lg"
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
            </template>
            <template #actions>
                <UButton
                  v-if="l1AddKind(state.categories, state.plan.items, l1.id)"
                  size="xs"
                  variant="ghost"
                  :class="planRowCell.action"
                  @click="onL1AddClick(l1)"
                >
                  <Plus :class="planRowIconClass" />
                </UButton>
                <span v-else :class="planRowCol.actionSlot" aria-hidden="true" />
                <UButton size="xs" variant="ghost" :class="planRowCell.action" @click="startEditCat(l1)">
                <Pencil :class="planRowIconClass" />
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                :class="planRowCell.action"
                :disabled="!canDelete(state.categories, l1.id)"
                @click="onRemoveCategory(l1.id)"
              >
                <Trash2 :class="planRowIconClass" />
              </UButton>
            </template>
          </PlanRowMobile>

          <div :class="[planRowGrid, 'py-2.5']">
            <div class="relative flex items-center justify-center size-5 shrink-0">
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

            <span :class="planRowNameClass[1]">{{ l1.name }}</span>
              <div :class="planRowCell.childSum">
                <UButton
                  v-if="showChildSumWarn(l1.id, 1)"
                  size="xs"
                  variant="ghost"
                  color="warning"
                  :class="planRowCell.action"
                  :aria-label="t('plan.childSumWarnTitle')"
                  @click="notifyChildSumUnbalanced"
                >
                  <AlertTriangle :class="planRowIconClass" />
                </UButton>
              </div>
              <span :class="planRowWithinGroupClass[1]">
                <template v-if="showCategoryWithinGroup(1)">{{ formatWithinGroupWeight(l1) }}</template>
              </span>
              <span :class="planRowCell.ofTotal">{{ formatTotalPercent(l1.id) }}</span>
              <span :class="planRowCell.actionsGap" aria-hidden="true" />
              <UButton
                v-if="l1AddKind(state.categories, state.plan.items, l1.id)"
                size="xs"
                variant="ghost"
                :class="planRowCell.action"
                @click="onL1AddClick(l1)"
              >
                <Plus :class="planRowIconClass" />
              </UButton>
              <span v-else :class="planRowCol.actionSlot" aria-hidden="true" />
              <UButton size="xs" variant="ghost" :class="planRowCell.action" @click="startEditCat(l1)">
                <Pencil :class="planRowIconClass" />
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                :class="planRowCell.action"
                :disabled="!canDelete(state.categories, l1.id)"
                @click="onRemoveCategory(l1.id)"
              >
                <Trash2 :class="planRowIconClass" />
              </UButton>
          </div>

          <PlanProductRows
            v-if="hasDirectProducts(state.plan.items, l1.id, 1)"
            :items="itemsUnderNode(state.plan.items, l1.id, 1)"
            :level="1"
          />

          <ul v-else-if="getChildren(state.categories, l1.id).length" class="border-t border-default/60">
            <template v-for="l2 in getChildren(state.categories, l1.id)" :key="l2.id">
              <li class="border-b border-default/40 last:border-0">
                <PlanRowMobile
                  :row-key="planRowKey('cat', l2.id)"
                  :name="l2.name"
                  :name-class="planRowNameClass[2]"
                  :within="formatWithinGroupWeight(l2)"
                  :total="formatTotalPercent(l2.id)"
                  :level="2"
                  :show-warn="showChildSumWarn(l2.id, 2)"
                  metrics-indent
                  extra-class="py-2 bg-default/20"
                  @warn="notifyChildSumUnbalanced"
                >
                  <template #actions>
                    <UButton
                      v-if="canAddProduct(state.categories, state.plan.items, l2.id, 2)"
                      size="xs"
                      variant="ghost"
                      :class="planRowCell.action"
                      @click="openAddProduct(l1, l2)"
                    >
                      <Plus :class="planRowIconClass" />
                    </UButton>
                    <span v-else :class="planRowCol.actionSlot" aria-hidden="true" />
                    <UButton size="xs" variant="ghost" :class="planRowCell.action" @click="startEditCat(l2)">
                      <Pencil :class="planRowIconClass" />
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="error"
                      :class="planRowCell.action"
                      :disabled="!canDelete(state.categories, l2.id)"
                      @click="onRemoveCategory(l2.id)"
                    >
                      <Trash2 :class="planRowIconClass" />
                    </UButton>
                  </template>
                </PlanRowMobile>

                <div :class="[planRowGrid, 'py-2 bg-default/20']">
                  <span :class="planRowCell.icon" aria-hidden="true" />
                    <span :class="planRowNameClass[2]">{{ l2.name }}</span>
                    <div :class="planRowCell.childSum">
                      <UButton
                        v-if="showChildSumWarn(l2.id, 2)"
                        size="xs"
                        variant="ghost"
                        color="warning"
                        :class="planRowCell.action"
                        :aria-label="t('plan.childSumWarnTitle')"
                        @click="notifyChildSumUnbalanced"
                      >
                        <AlertTriangle :class="planRowIconClass" />
                      </UButton>
                    </div>
                    <span :class="planRowWithinGroupClass[2]">{{ formatWithinGroupWeight(l2) }}</span>
                    <span :class="planRowCell.ofTotal">{{ formatTotalPercent(l2.id) }}</span>
                    <span :class="planRowCell.actionsGap" aria-hidden="true" />
                    <UButton
                      v-if="canAddProduct(state.categories, state.plan.items, l2.id, 2)"
                      size="xs"
                      variant="ghost"
                      :class="planRowCell.action"
                      @click="openAddProduct(l1, l2)"
                    >
                      <Plus :class="planRowIconClass" />
                    </UButton>
                    <span v-else :class="planRowCol.actionSlot" aria-hidden="true" />
                    <UButton size="xs" variant="ghost" :class="planRowCell.action" @click="startEditCat(l2)">
                      <Pencil :class="planRowIconClass" />
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="error"
                      :class="planRowCell.action"
                      :disabled="!canDelete(state.categories, l2.id)"
                      @click="onRemoveCategory(l2.id)"
                    >
                      <Trash2 :class="planRowIconClass" />
                    </UButton>
                </div>

                <PlanProductRows
                  v-if="hasDirectProducts(state.plan.items, l2.id, 2)"
                  :items="itemsUnderNode(state.plan.items, l2.id, 2)"
                  :level="2"
                />
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

    <UModal v-model:open="l1AddChoiceModalOpen" :title="t('plan.addUnderL1Title', { name: l1AddChoiceTarget?.name ?? '' })">
      <template #body>
        <p class="text-sm text-muted mb-4">{{ t('plan.addUnderL1Hint') }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <UButton block variant="outline" size="lg" @click="chooseAddSubCategoryFromL1">
            {{ t('plan.addAsSubCategory') }}
          </UButton>
          <UButton block variant="outline" size="lg" @click="chooseAddProductFromL1">
            {{ t('plan.addAsProduct') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="addModalOpen" :title="addModalTitle">
      <template #body>
        <div class="space-y-3">
          <UFormField :label="t('plan.name')" :class="planModalFormField">
            <UInput v-model="newCatName" :class="planModalInput" autofocus @keyup.enter="confirmAddCat" />
          </UFormField>
          <UFormField :label="t('plan.targetWeight')" :class="planModalFormField">
            <UInput v-model.number="newCatWeight" :class="planModalInput" type="number" min="0" max="100" step="0.1">
              <template #trailing>%</template>
            </UInput>
          </UFormField>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2 w-full">
          <UButton variant="ghost" @click="close">{{ t('common.cancel') }}</UButton>
          <UButton :disabled="!newCatName.trim()" @click="confirmAddCat">{{ t('common.save') }}</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="editCatModalOpen" :title="t('plan.editCategory')">
      <template #body>
        <div class="space-y-3">
          <UFormField v-if="editingCatIsL1" :label="t('plan.pickIcon')">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in L1_ICON_OPTIONS"
                :key="opt.key"
                type="button"
                class="rounded-lg border p-2 transition-colors"
                :class="editingCatNode?.iconKey === opt.key ? 'border-primary bg-primary/10' : 'border-default'"
                @click="editingCatId && updateCategory(editingCatId, { iconKey: opt.key as L1IconKey })"
              >
                <PlanL1Icon :icon-key="opt.key" size="sm" />
              </button>
            </div>
          </UFormField>
          <UFormField :label="t('plan.name')" :class="planModalFormField">
            <UInput v-model="editCatName" :class="planModalInput" autofocus @keyup.enter="confirmEditCat" />
          </UFormField>
          <UFormField :label="t('plan.targetWeight')" :class="planModalFormField">
            <UInput v-model.number="editCatWeight" :class="planModalInput" type="number" min="0" max="100" step="0.1">
              <template #trailing>%</template>
            </UInput>
          </UFormField>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2 w-full">
          <UButton variant="ghost" @click="close">{{ t('common.cancel') }}</UButton>
          <UButton :disabled="!editCatName.trim()" @click="confirmEditCat">{{ t('common.save') }}</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="productAddModalOpen" :title="t('plan.addProduct')">
      <template #body>
        <div class="space-y-3">
          <UFormField :label="t('plan.itemName')" :class="planModalFormField">
            <UInput v-model="newProductName" :class="planModalInput" autofocus @keyup.enter="confirmAddProduct" />
          </UFormField>
          <UFormField :label="t('plan.targetWeight')" :class="planModalFormField">
            <UInput v-model.number="newProductWeight" :class="planModalInput" type="number" min="0" max="100" step="0.1">
              <template #trailing>%</template>
            </UInput>
          </UFormField>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-2 w-full">
          <UButton variant="ghost" @click="close">{{ t('common.cancel') }}</UButton>
          <UButton :disabled="!newProductName.trim()" @click="confirmAddProduct">{{ t('common.save') }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
