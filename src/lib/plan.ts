import type { AnalysisLevel, CategoryNode, PlanChartSegment, PlanItem } from '../types'
import { getChildren, getNode } from './categories'

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
]

/** 仅挂在本节点下的具体产品（不含下级分类中的产品） */
export function itemsUnderNode(items: PlanItem[], nodeId: string, level: CategoryNode['level']): PlanItem[] {
  if (level === 1) {
    return items.filter(i => i.categoryL1Id === nodeId && !i.categoryL2Id)
  }
  if (level === 2) {
    return items.filter(i => i.categoryL2Id === nodeId && !i.categoryL3Id)
  }
  return items.filter(i => i.categoryL3Id === nodeId)
}

export function hasChildCategories(categories: CategoryNode[], nodeId: string): boolean {
  return getChildren(categories, nodeId).length > 0
}

export function hasDirectProducts(items: PlanItem[], nodeId: string, level: CategoryNode['level']): boolean {
  return itemsUnderNode(items, nodeId, level).length > 0
}

export function canAddChildCategory(_categories: CategoryNode[], items: PlanItem[], nodeId: string, level: 1 | 2): boolean {
  return !hasDirectProducts(items, nodeId, level)
}

export function canAddProduct(categories: CategoryNode[], _items: PlanItem[], nodeId: string, level: CategoryNode['level']): boolean {
  if (level === 3) return true
  return !hasChildCategories(categories, nodeId)
}

export function itemsWeightSumUnderNode(items: PlanItem[], nodeId: string, level: CategoryNode['level']): number {
  return itemsUnderNode(items, nodeId, level).reduce((s, i) => s + (Number(i.targetPercent) || 0), 0)
}

export function childrenWeightSum(
  categories: CategoryNode[],
  _items: PlanItem[],
  parentId: string | null,
  childLevel: CategoryNode['level']
): number {
  const children = getChildren(categories, parentId)
  if (childLevel === 3) {
    return children.reduce((s, l3) => s + (l3.weightOfParent ?? 0), 0)
  }
  if (childLevel === 2) {
    return children.reduce((s, l2) => s + (l2.weightOfParent ?? 0), 0)
  }
  return 0
}

/** 节点右侧小字：子分类或直属产品占上级比例之和；无下级时返回 null */
export function nodeSiblingSumValue(
  categories: CategoryNode[],
  items: PlanItem[],
  nodeId: string,
  level: CategoryNode['level']
): number | null {
  if (hasDirectProducts(items, nodeId, level)) {
    return itemsWeightSumUnderNode(items, nodeId, level)
  }
  if (level === 1 && hasChildCategories(categories, nodeId)) {
    return childrenWeightSum(categories, items, nodeId, 2)
  }
  if (level === 2 && hasChildCategories(categories, nodeId)) {
    return childrenWeightSum(categories, items, nodeId, 3)
  }
  return null
}

export function isNodeSiblingSumBalanced(
  categories: CategoryNode[],
  items: PlanItem[],
  nodeId: string,
  level: CategoryNode['level'],
  tolerance = 0.5
): boolean {
  const sum = nodeSiblingSumValue(categories, items, nodeId, level)
  if (sum === null) return true
  return groupBalanced(sum, tolerance)
}

/** 节点右侧：子分类合计或直属产品合计 */
export function nodeSiblingSumLabel(
  categories: CategoryNode[],
  items: PlanItem[],
  nodeId: string,
  level: CategoryNode['level']
): string {
  const sum = nodeSiblingSumValue(categories, items, nodeId, level)
  if (sum === null) return '—'
  return `${sum.toFixed(1)}%`
}

export function categoryTotalPercent(categories: CategoryNode[], nodeId: string): number {
  const node = getNode(categories, nodeId)
  if (!node) return 0
  if (node.level === 1) return Number(node.weightOfParent) || 0
  const l2 = node.parentId ? getNode(categories, node.parentId) : undefined
  if (node.level === 2 && l2) {
    const l1 = l2.parentId ? getNode(categories, l2.parentId) : undefined
    if (!l1) return 0
    return ((Number(l1.weightOfParent) || 0) * (Number(node.weightOfParent) || 0)) / 100
  }
  if (node.level === 3 && l2) {
    const l1 = l2.parentId ? getNode(categories, l2.parentId) : undefined
    if (!l1) return 0
    return (
      (Number(l1.weightOfParent) || 0) *
      (Number(l2.weightOfParent) || 0) *
      (Number(node.weightOfParent) || 0)
    ) / 10000
  }
  return 0
}

export function planItemTotalPercent(categories: CategoryNode[], item: PlanItem): number {
  const l1 = getNode(categories, item.categoryL1Id)
  if (!l1) return Number(item.targetPercent) || 0
  const w1 = Number(l1.weightOfParent) || 0
  if (!item.categoryL2Id) {
    return (w1 * (Number(item.targetPercent) || 0)) / 100
  }
  const l2 = getNode(categories, item.categoryL2Id)
  if (!l2) return 0
  const w2 = Number(l2.weightOfParent) || 0
  if (!item.categoryL3Id) {
    return (w1 * w2 * (Number(item.targetPercent) || 0)) / 10000
  }
  const l3 = getNode(categories, item.categoryL3Id)
  if (!l3) return 0
  return (
    w1 * w2 * (Number(l3.weightOfParent) || 0) * (Number(item.targetPercent) || 0)
  ) / 1e6
}

export function planTotalEffectivePercent(categories: CategoryNode[]): number {
  return getChildren(categories, null).reduce((s, l1) => s + (Number(l1.weightOfParent) || 0), 0)
}

/** 所有具体产品项占总比例的加和 */
export function planItemsTotalPercentSum(categories: CategoryNode[], items: PlanItem[]): number {
  return items.reduce((s, item) => s + planItemTotalPercent(categories, item), 0)
}

function groupBalanced(sum: number, tolerance = 0.5): boolean {
  return Math.abs(sum - 100) <= tolerance
}

function branchBalanced(
  categories: CategoryNode[],
  items: PlanItem[],
  nodeId: string,
  level: CategoryNode['level'],
  tolerance: number
): boolean {
  if (hasDirectProducts(items, nodeId, level)) {
    return groupBalanced(itemsWeightSumUnderNode(items, nodeId, level), tolerance)
  }
  if (level === 1) {
    const l2s = getChildren(categories, nodeId)
    if (!l2s.length) return true
    return groupBalanced(childrenWeightSum(categories, items, nodeId, 2), tolerance)
  }
  if (level === 2) {
    const l3s = getChildren(categories, nodeId)
    if (!l3s.length) return true
    return groupBalanced(childrenWeightSum(categories, items, nodeId, 3), tolerance)
  }
  if (level === 3) {
    const prods = itemsUnderNode(items, nodeId, 3)
    if (!prods.length) return true
    return groupBalanced(itemsWeightSumUnderNode(items, nodeId, 3), tolerance)
  }
  return true
}

export function isPlanBalanced(categories: CategoryNode[], items: PlanItem[], tolerance = 0.5): boolean {
  const topSum = items.length > 0
    ? planItemsTotalPercentSum(categories, items)
    : planTotalEffectivePercent(categories)
  if (!groupBalanced(topSum, tolerance)) return false
  for (const l1 of getChildren(categories, null)) {
    if (!branchBalanced(categories, items, l1.id, 1, tolerance)) return false
    for (const l2 of getChildren(categories, l1.id)) {
      if (!branchBalanced(categories, items, l2.id, 2, tolerance)) return false
      for (const l3 of getChildren(categories, l2.id)) {
        if (!branchBalanced(categories, items, l3.id, 3, tolerance)) return false
      }
    }
  }
  return true
}

export function planChartSegments(
  categories: CategoryNode[],
  items: PlanItem[],
  level: AnalysisLevel
): PlanChartSegment[] {
  if (level === 1) {
    return getChildren(categories, null)
      .filter(l1 => (l1.weightOfParent ?? 0) > 0)
      .map((l1, i) => ({
        id: l1.id,
        label: l1.name,
        percent: Number(l1.weightOfParent) || 0,
        color: CHART_COLORS[i % CHART_COLORS.length]
      }))
  }
  if (level === 2) {
    const segments: PlanChartSegment[] = []
    let i = 0
    for (const l1 of getChildren(categories, null)) {
      for (const l2 of getChildren(categories, l1.id)) {
        const pct = categoryTotalPercent(categories, l2.id)
        if (pct > 0.01) {
          segments.push({ id: l2.id, label: l2.name, percent: pct, color: CHART_COLORS[i++ % CHART_COLORS.length] })
        }
      }
      for (const item of itemsUnderNode(items, l1.id, 1)) {
        const pct = planItemTotalPercent(categories, item)
        if (pct > 0.01) {
          segments.push({ id: item.id, label: item.name || '—', percent: pct, color: CHART_COLORS[i++ % CHART_COLORS.length] })
        }
      }
    }
    return segments
  }
  const segments: PlanChartSegment[] = []
  let i = 0
  for (const l1 of getChildren(categories, null)) {
    for (const l2 of getChildren(categories, l1.id)) {
      for (const l3 of getChildren(categories, l2.id)) {
        const pct = categoryTotalPercent(categories, l3.id)
        if (pct > 0.01) {
          segments.push({ id: l3.id, label: l3.name, percent: pct, color: CHART_COLORS[i++ % CHART_COLORS.length] })
        }
      }
      for (const item of itemsUnderNode(items, l2.id, 2)) {
        const pct = planItemTotalPercent(categories, item)
        if (pct > 0.01) {
          segments.push({ id: item.id, label: item.name || '—', percent: pct, color: CHART_COLORS[i++ % CHART_COLORS.length] })
        }
      }
    }
    for (const item of itemsUnderNode(items, l1.id, 1)) {
      const pct = planItemTotalPercent(categories, item)
      if (pct > 0.01 && level === 3) {
        segments.push({ id: item.id, label: item.name || '—', percent: pct, color: CHART_COLORS[i++ % CHART_COLORS.length] })
      }
    }
  }
  return segments
}
