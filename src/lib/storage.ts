import type { AppState } from '../types'
import {
  migrateCategoriesToTwoLevels,
  migratePlanItemsToTwoLevels,
  normalizeCategorySortOrders
} from './categories'
import { guessIconKey } from './l1-icons'
import { newId } from './id'

const STORAGE_KEY = 'funding-plan-v1'

export function createDefaultState(): AppState {
  const now = new Date().toISOString()
  return {
    version: 1,
    categories: [],
    plan: { id: newId(), updatedAt: now, items: [] },
    snapshots: [],
    settings: { locale: 'zh', theme: 'system' }
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as AppState
    if (parsed.version !== 1) return createDefaultState()
    return migrateState(parsed)
  } catch {
    return createDefaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function exportStateJson(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

function migrateState(state: AppState): AppState {
  migrateCategoriesToTwoLevels(state.categories)
  migratePlanItemsToTwoLevels(state.plan.items)
  for (const s of state.snapshots) {
    migratePlanItemsToTwoLevels(s.frozenPlan.items)
  }
  for (const c of state.categories) {
    if (c.level === 1 && !c.iconKey) c.iconKey = guessIconKey(c.name)
    if (c.weightOfParent === undefined) c.weightOfParent = 0
  }
  normalizeCategorySortOrders(state.categories)
  return state
}

export function parseImportedState(raw: string): AppState {
  const parsed = JSON.parse(raw) as AppState
  if (parsed.version !== 1) throw new Error('INVALID_VERSION')
  if (!Array.isArray(parsed.categories) || !parsed.plan || !Array.isArray(parsed.snapshots)) {
    throw new Error('INVALID_SHAPE')
  }
  return migrateState(parsed)
}
