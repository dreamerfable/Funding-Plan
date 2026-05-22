import type { AnalysisLevel, CategoryNode, PlanRowAnalysis, Snapshot, SnapshotLine } from '../types'
import { getChildren, getNode, getPathNames } from './categories'
import { planItemTotalPercent } from './plan'

function lineMap(lines: SnapshotLine[]): Map<string, number> {
  return new Map(lines.map(l => [l.planItemId, l.amount]))
}

function investable(snapshot: Snapshot): number {
  return snapshot.totalAmount - snapshot.excludeAmount
}

function actualTotal(lines: SnapshotLine[]): number {
  return lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
}

export function snapshotAllocationGap(snapshot: Snapshot): number {
  return actualTotal(snapshot.lines) - investable(snapshot)
}

interface AggKey {
  key: string
  label: string
  level: AnalysisLevel
  targetPercent: number
  actualAmount: number
}

function upsertAgg(map: Map<string, AggKey>, entry: AggKey, targetDelta: number, actualDelta: number) {
  const existing = map.get(entry.key)
  if (existing) {
    existing.targetPercent += targetDelta
    existing.actualAmount += actualDelta
  } else {
    map.set(entry.key, { ...entry, targetPercent: targetDelta, actualAmount: actualDelta })
  }
}

export function analyzeSnapshot(
  snapshot: Snapshot,
  categories: CategoryNode[],
  level?: AnalysisLevel
): { rows: PlanRowAnalysis[]; investableAmount: number; totalTargetGap: number; totalAmountGap: number } {
  const inv = investable(snapshot)
  const amounts = lineMap(snapshot.lines)
  const map = new Map<string, AggKey>()

  for (const item of snapshot.frozenPlan.items) {
    const actual = amounts.get(item.id) ?? 0
    const targetPct = planItemTotalPercent(categories, item)
    const l1 = getNode(categories, item.categoryL1Id)
    const l2 = item.categoryL2Id ? getNode(categories, item.categoryL2Id) : undefined
    const entries: AggKey[] = [
      { key: `l1:${item.categoryL1Id}`, label: l1?.name ?? item.categoryL1Id, level: 1, targetPercent: targetPct, actualAmount: actual }
    ]
    if (item.categoryL2Id && l2) {
      entries.push({
        key: `l2:${item.categoryL2Id}`,
        label: `${l1?.name ?? ''} › ${l2.name}`,
        level: 2,
        targetPercent: targetPct,
        actualAmount: actual
      })
    }
    if (item.categoryL3Id) {
      entries.push({
        key: `l3:${item.categoryL3Id}`,
        label: getPathNames(categories, item.categoryL1Id, item.categoryL2Id, item.categoryL3Id),
        level: 3,
        targetPercent: targetPct,
        actualAmount: actual
      })
    }
    entries.push({
      key: `item:${item.id}`,
      label: item.name,
      level: 3,
      targetPercent: targetPct,
      actualAmount: actual
    })
    for (const e of entries) {
      if (level && e.level !== level && e.key.startsWith('item:')) continue
      if (level && e.level !== level) {
        if (level === 1 && e.level !== 1) continue
        if (level === 2 && e.level !== 2) continue
        if (level === 3 && e.level !== 3 && !e.key.startsWith('item:')) continue
      }
      upsertAgg(map, e, targetPct, actual)
    }
  }

  const filtered = [...map.values()].filter(e => {
    if (!level) return e.key.startsWith('item:')
    return e.level === level
  })

  const rows: PlanRowAnalysis[] = filtered.map(e => {
    const targetAmount = inv * e.targetPercent / 100
    const actualPercent = inv > 0 ? (e.actualAmount / inv) * 100 : 0
    return {
      key: e.key,
      label: e.label,
      level: e.level,
      targetPercent: e.targetPercent,
      targetAmount,
      actualAmount: e.actualAmount,
      actualPercent,
      percentGap: actualPercent - e.targetPercent,
      amountGap: e.actualAmount - targetAmount
    }
  }).sort((a, b) => Math.abs(b.amountGap) - Math.abs(a.amountGap))

  const totalTargetGap = rows.reduce((s, r) => s + r.percentGap, 0)
  const totalAmountGap = rows.reduce((s, r) => s + r.amountGap, 0)

  return { rows, investableAmount: inv, totalTargetGap, totalAmountGap }
}

export function analyzeItemLevel(snapshot: Snapshot, categories: CategoryNode[]): PlanRowAnalysis[] {
  return analyzeSnapshot(snapshot, categories).rows
}

/** 某分类分组下所有具体产品的偏离行 */
export function analyzeItemsUnderCategory(
  snapshot: Snapshot,
  categories: CategoryNode[],
  node: CategoryNode
): PlanRowAnalysis[] {
  const itemRows = analyzeSnapshot(snapshot, categories).rows
  return itemRows.filter(row => {
    const item = snapshot.frozenPlan.items.find(i => row.key === `item:${i.id}`)
    if (!item) return false
    if (node.level === 1) return item.categoryL1Id === node.id
    if (node.level === 2) return item.categoryL2Id === node.id
    return item.categoryL3Id === node.id
  })
}

export type ChartScopeId = 'all' | string

function chartRowVisible(row: PlanRowAnalysis | undefined): row is PlanRowAnalysis {
  return !!row && (Math.abs(row.targetPercent) > 0.01 || Math.abs(row.actualAmount) > 0.01)
}

/** 图表：展示所选节点下子级（无子分类时展示具体产品） */
export function analyzeChartForScope(
  snapshot: Snapshot,
  categories: CategoryNode[],
  scopeId: ChartScopeId
): PlanRowAnalysis[] {
  const map = buildCategoryAnalysisMap(snapshot, categories)
  const rowOf = (id: string) => map.get(id)

  if (scopeId === 'all') {
    return getChildren(categories, null).map(c => rowOf(c.id)).filter(chartRowVisible)
  }

  const node = getNode(categories, scopeId)
  if (!node) return []

  const childCats = getChildren(categories, node.id)
  if (childCats.length) {
    return childCats.map(c => rowOf(c.id)).filter(chartRowVisible)
  }

  return analyzeItemsUnderCategory(snapshot, categories, node)
}

/** 按分类 id 索引单期分析行（L1/L2/L3） */
export function buildCategoryAnalysisMap(
  snapshot: Snapshot,
  categories: CategoryNode[]
): Map<string, PlanRowAnalysis> {
  const map = new Map<string, PlanRowAnalysis>()
  for (const level of [1, 2, 3] as const) {
    for (const row of analyzeSnapshot(snapshot, categories, level).rows) {
      const id = row.key.split(':')[1]
      if (id) map.set(id, row)
    }
  }
  return map
}

/** 组合偏离度：各配置项权重偏离绝对值的算术平均 (pp) */
export function overallDriftPercent(snapshot: Snapshot, categories: CategoryNode[]): number {
  const rows = analyzeSnapshot(snapshot, categories).rows
  if (!rows.length) return 0
  return rows.reduce((s, r) => s + Math.abs(r.percentGap), 0) / rows.length
}

/** 组合匹配度：100% 减去平均权重偏离 */
export function overallMatchPercent(snapshot: Snapshot, categories: CategoryNode[]): number {
  return Math.max(0, Math.min(100, 100 - overallDriftPercent(snapshot, categories)))
}

export interface TrendCell {
  amount: number
  percent: number
  targetPercent: number
  percentGap: number
  amountGap: number
  gapTrend: 'wider' | 'narrower' | 'same' | null
}

export interface TrendRow {
  key: string
  label: string
  cells: TrendCell[]
}

export function buildTrendTable(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  level: AnalysisLevel
): TrendRow[] {
  if (!snapshots.length) return []
  const sorted = [...snapshots].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const keys = new Set<string>()

  for (const s of sorted) {
    analyzeSnapshot(s, categories, level).rows.forEach(r => keys.add(r.key))
  }

  const rows: TrendRow[] = []
  for (const key of [...keys].sort()) {
    const cells: TrendCell[] = []
    let prevGap: number | null = null
    let label = key
    for (const s of sorted) {
      const row = analyzeSnapshot(s, categories, level).rows.find(r => r.key === key)
      if (!row) {
        cells.push({ amount: 0, percent: 0, targetPercent: 0, percentGap: 0, amountGap: 0, gapTrend: null })
        continue
      }
      label = row.label
      const gap = row.percentGap
      let gapTrend: TrendCell['gapTrend'] = null
      if (prevGap !== null) {
        const diff = Math.abs(gap) - Math.abs(prevGap)
        if (Math.abs(diff) < 0.01) gapTrend = 'same'
        else gapTrend = diff > 0 ? 'wider' : 'narrower'
      }
      cells.push({
        amount: row.actualAmount,
        percent: row.actualPercent,
        targetPercent: row.targetPercent,
        percentGap: row.percentGap,
        amountGap: row.amountGap,
        gapTrend
      })
      prevGap = gap
    }
    rows.push({ key, label, cells })
  }
  return rows
}

export function trendChartSeries(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  level: AnalysisLevel,
  topN = 8
): { labels: string[]; datasets: { label: string; data: (number | null)[] }[] } {
  const sorted = [...snapshots].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const labels = sorted.map(s => s.label)
  const table = buildTrendTable(sorted, categories, level)
  const ranked = table
    .map(r => ({ ...r, maxAbs: Math.max(...r.cells.map(c => Math.abs(c.percentGap))) }))
    .sort((a, b) => b.maxAbs - a.maxAbs)
    .slice(0, topN)

  return {
    labels,
    datasets: ranked.map(r => ({
      label: r.label,
      data: r.cells.map(c => c.percentGap)
    }))
  }
}
