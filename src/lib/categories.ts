import type { CategoryLevel, CategoryNode, PlanItem } from '../types'

export function getChildren(categories: CategoryNode[], parentId: string | null): CategoryNode[] {
  return categories
    .filter(c => c.parentId === parentId)
    .sort((a, b) => {
      const diff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'zh')
    })
}

export function normalizeCategorySortOrders(categories: CategoryNode[]): void {
  const parentIds = new Set<string | null>([null])
  for (const c of categories) parentIds.add(c.id)
  for (const parentId of parentIds) {
    const kids = categories
      .filter(c => c.parentId === parentId)
      .sort((a, b) => {
        const oa = a.sortOrder ?? Number.MAX_SAFE_INTEGER
        const ob = b.sortOrder ?? Number.MAX_SAFE_INTEGER
        if (oa !== ob) return oa - ob
        return a.name.localeCompare(b.name, 'zh')
      })
    kids.forEach((c, i) => { c.sortOrder = i })
  }
}

export function getNode(categories: CategoryNode[], id: string): CategoryNode | undefined {
  return categories.find(c => c.id === id)
}

export function getPathNames(
  categories: CategoryNode[],
  l1: string,
  l2 = '',
  _legacyL3 = ''
): string {
  const n1 = getNode(categories, l1)?.name ?? '—'
  if (!l2) return n1
  const n2 = getNode(categories, l2)?.name ?? '—'
  return `${n1} / ${n2}`
}

export function canDelete(categories: CategoryNode[], id: string): boolean {
  return !categories.some(c => c.parentId === id)
}

export function collectDescendantIds(categories: CategoryNode[], id: string): string[] {
  const children = categories.filter(c => c.parentId === id)
  return children.flatMap(c => [c.id, ...collectDescendantIds(categories, c.id)])
}

export function levelOfParent(parent: CategoryNode | undefined): CategoryLevel {
  if (!parent) return 1
  return 2
}

/** 将旧版三级分类数据迁移为两级 */
export function migrateCategoriesToTwoLevels(categories: CategoryNode[]): void {
  for (const c of categories) {
    const raw = c.level as number
    if (raw === 3) {
      const parent = c.parentId ? getNode(categories, c.parentId) : undefined
      c.level = 2
      c.parentId = parent?.level === 2 ? parent.parentId : parent?.parentId ?? null
    } else if (raw > 2) {
      c.level = c.parentId ? 2 : 1
    }
  }
}

export function migratePlanItemsToTwoLevels(items: PlanItem[]): void {
  for (const item of items) {
    if (item.categoryL3Id) {
      item.categoryL2Id = item.categoryL3Id
      item.categoryL3Id = ''
    }
  }
}
