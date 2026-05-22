import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export interface PlanMobileExpandContext {
  expandedRowKey: Ref<string | null>
  toggleRowExpand: (key: string) => void
  collapseRow: () => void
}

export const planMobileExpandKey: InjectionKey<PlanMobileExpandContext> = Symbol('planMobileExpand')

export function providePlanMobileExpand() {
  const expandedRowKey = ref<string | null>(null)
  function toggleRowExpand(key: string) {
    expandedRowKey.value = expandedRowKey.value === key ? null : key
  }
  function collapseRow() {
    expandedRowKey.value = null
  }
  const ctx: PlanMobileExpandContext = { expandedRowKey, toggleRowExpand, collapseRow }
  provide(planMobileExpandKey, ctx)
  return ctx
}

export function usePlanMobileExpand() {
  const ctx = inject(planMobileExpandKey)
  if (!ctx) throw new Error('usePlanMobileExpand must be used within PlanTreePanel')
  return ctx
}

export function planRowKey(kind: 'cat' | 'item', id: string) {
  return `${kind}:${id}`
}
