import { computed, reactive, watch } from 'vue'
import { useColorMode } from '@vueuse/core'
import type { AppLocale, AppSettings, AppState, CategoryNode, InvestmentPlan, L1IconKey, PlanItem, Snapshot } from '../types'
import { createDefaultState, exportStateJson, loadState, parseImportedState, saveState } from '../lib/storage'
import { collectDescendantIds } from '../lib/categories'
import { guessIconKey } from '../lib/l1-icons'
import { isPlanBalanced, planTotalEffectivePercent } from '../lib/plan'
import { newId } from '../lib/id'
import { i18n } from '../i18n'

const state = reactive<AppState>(loadState())

function persist() {
  saveState(state)
}

watch(() => state, persist, { deep: true })

const colorMode = useColorMode({ storageKey: 'funding-plan-theme' })

watch(
  () => state.settings.theme,
  (theme) => {
    colorMode.value = theme === 'system' ? 'auto' : theme
  },
  { immediate: true }
)

watch(
  () => state.settings.locale,
  (locale) => {
    i18n.global.locale.value = locale
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  },
  { immediate: true }
)

export function useAppStore() {
  const planTotal = computed(() => planTotalEffectivePercent(state.categories))
  const planBalanced = computed(() => isPlanBalanced(state.categories, state.plan.items))

  function touchPlan() {
    state.plan.updatedAt = new Date().toISOString()
  }

  function addCategory(name: string, parentId: string | null, level: CategoryNode['level']) {
    const siblings = state.categories.filter(c => c.parentId === parentId)
    const maxOrder = siblings.reduce((m, c) => Math.max(m, c.sortOrder ?? -1), -1)
    const node: CategoryNode = {
      id: newId(),
      name: name.trim(),
      level,
      parentId,
      sortOrder: maxOrder + 1,
      weightOfParent: 0
    }
    if (level === 1) node.iconKey = guessIconKey(name)
    state.categories.push(node)
  }

  function updateCategory(id: string, patch: Partial<Pick<CategoryNode, 'name' | 'weightOfParent' | 'iconKey'>>) {
    const node = state.categories.find(c => c.id === id)
    if (!node) return
    if (patch.name !== undefined) node.name = patch.name.trim()
    if (patch.weightOfParent !== undefined) node.weightOfParent = Number(patch.weightOfParent) || 0
    if (patch.iconKey !== undefined && node.level === 1) node.iconKey = patch.iconKey
  }

  function reorderCategorySiblings(parentId: string | null, orderedChildIds: string[]) {
    orderedChildIds.forEach((id, index) => {
      const node = state.categories.find(c => c.id === id)
      if (node && node.parentId === parentId) node.sortOrder = index
    })
    touchPlan()
  }

  function removeCategory(id: string) {
    const ids = [id, ...collectDescendantIds(state.categories, id)]
    state.categories = state.categories.filter(c => !ids.includes(c.id))
    state.plan.items = state.plan.items.filter(
      i => !ids.includes(i.categoryL1Id) && !ids.includes(i.categoryL2Id) && !ids.includes(i.categoryL3Id)
    )
  }

  function addPlanItem(item: Omit<PlanItem, 'id'>) {
    state.plan.items.push({ ...item, id: newId() })
    touchPlan()
  }

  function updatePlanItem(id: string, patch: Partial<PlanItem>) {
    const item = state.plan.items.find(i => i.id === id)
    if (item) Object.assign(item, patch)
    touchPlan()
  }

  function removePlanItem(id: string) {
    state.plan.items = state.plan.items.filter(i => i.id !== id)
    touchPlan()
  }

  function confirmPlanSave(): void {
    touchPlan()
    persist()
  }

  function clonePlan(): InvestmentPlan {
    return JSON.parse(JSON.stringify(state.plan))
  }

  function addSnapshot(snapshot: Omit<Snapshot, 'id' | 'createdAt' | 'updatedAt' | 'frozenPlan'> & { frozenPlan?: InvestmentPlan }) {
    const now = new Date().toISOString()
    state.snapshots.push({
      ...snapshot,
      id: newId(),
      createdAt: now,
      updatedAt: now,
      frozenPlan: snapshot.frozenPlan ?? clonePlan()
    })
  }

  function updateSnapshot(id: string, patch: Partial<Snapshot>) {
    const s = state.snapshots.find(x => x.id === id)
    if (!s) return
    Object.assign(s, patch, { updatedAt: new Date().toISOString() })
  }

  function removeSnapshot(id: string) {
    state.snapshots = state.snapshots.filter(s => s.id !== id)
  }

  function updateSettings(patch: Partial<AppSettings>) {
    Object.assign(state.settings, patch)
  }

  function exportJson(): string {
    return exportStateJson(state)
  }

  function importJson(raw: string) {
    const imported = parseImportedState(raw)
    Object.assign(state, imported)
    persist()
  }

  function resetAll() {
    const fresh = createDefaultState()
    Object.assign(state, fresh)
    persist()
  }

  return {
    state,
    planTotal,
    planBalanced,
    addCategory,
    updateCategory,
    reorderCategorySiblings,
    removeCategory,
    addPlanItem,
    updatePlanItem,
    removePlanItem,
    confirmPlanSave,
    clonePlan,
    addSnapshot,
    updateSnapshot,
    removeSnapshot,
    updateSettings,
    exportJson,
    importJson,
    resetAll
  }
}

export type { AppLocale, L1IconKey }
