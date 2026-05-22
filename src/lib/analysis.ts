import type { AnalysisLevel, CategoryNode, PlanRowAnalysis, Snapshot, SnapshotLine } from '../types'
import { getChildren, getNode } from './categories'
import { itemsUnderNode, planItemTotalPercent } from './plan'

function lineMap(lines: SnapshotLine[]): Map<string, number> {
  return new Map(lines.map(l => [l.planItemId, l.amount]))
}

function investable(snapshot: Snapshot): number {
  return snapshot.totalAmount - snapshot.excludeAmount
}

/** 按记录日、更新时间降序；首页与分析「最新一期」共用 */
export function compareSnapshotRecency(a: Snapshot, b: Snapshot): number {
  const byDate = b.recordedAt.localeCompare(a.recordedAt)
  if (byDate !== 0) return byDate
  return b.updatedAt.localeCompare(a.updatedAt)
}

export function getLatestSnapshot(snapshots: Snapshot[]): Snapshot | undefined {
  if (!snapshots.length) return undefined
  return [...snapshots].sort(compareSnapshotRecency)[0]
}

export function getPreviousSnapshot(
  snapshots: Snapshot[],
  latest: Snapshot
): Snapshot | undefined {
  const sorted = [...snapshots].sort(compareSnapshotRecency)
  const idx = sorted.findIndex(s => s.id === latest.id)
  return idx >= 0 && idx + 1 < sorted.length ? sorted[idx + 1] : undefined
}

/** 仅遍历快照冻结计划中出现过的分类 id */
export function categoryIdsInSnapshot(snapshot: Snapshot): Set<string> {
  const ids = new Set<string>()
  for (const item of snapshot.frozenPlan.items) {
    ids.add(item.categoryL1Id)
    if (item.categoryL2Id) ids.add(item.categoryL2Id)
  }
  return ids
}

export function l1NodesInSnapshot(snapshot: Snapshot, categories: CategoryNode[]): CategoryNode[] {
  const ids = new Set<string>()
  for (const item of snapshot.frozenPlan.items) ids.add(item.categoryL1Id)
  return getChildren(categories, null)
    .filter(c => ids.has(c.id))
    .slice()
}

export function l2NodesInSnapshot(
  snapshot: Snapshot,
  categories: CategoryNode[],
  l1Id: string
): CategoryNode[] {
  const ids = new Set<string>()
  for (const item of snapshot.frozenPlan.items) {
    if (item.categoryL1Id === l1Id && item.categoryL2Id) ids.add(item.categoryL2Id)
  }
  return getChildren(categories, l1Id)
    .filter(c => ids.has(c.id))
    .slice()
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

  // 实际金额仅来自该快照 lines；计划项仅来自 frozenPlan
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
    entries.push({
      key: `item:${item.id}`,
      label: item.name,
      level: 2,
      targetPercent: targetPct,
      actualAmount: actual
    })
    for (const e of entries) {
      if (level && e.level !== level && e.key.startsWith('item:')) continue
      if (level && e.level !== level) {
        if (level === 1 && e.level !== 1) continue
        if (level === 2 && e.level !== 2) continue
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

/** 某分类节点下直接挂载的具体产品偏离行（L1 不含其下 L2 中的产品） */
export function analyzeItemsUnderCategory(
  snapshot: Snapshot,
  categories: CategoryNode[],
  node: CategoryNode
): PlanRowAnalysis[] {
  const allowed = new Set(
    itemsUnderNode(snapshot.frozenPlan.items, node.id, node.level).map(i => `item:${i.id}`)
  )
  return analyzeSnapshot(snapshot, categories).rows.filter(row => allowed.has(row.key))
}

export type ChartScopeId = 'all' | string

function chartRowVisible(row: PlanRowAnalysis | undefined): row is PlanRowAnalysis {
  return !!row && (Math.abs(row.targetPercent) > 0.01 || Math.abs(row.actualAmount) > 0.01)
}

function chartRowForCategory(node: CategoryNode, row: PlanRowAnalysis): PlanRowAnalysis {
  return { ...row, label: node.name }
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
    return getChildren(categories, null)
      .map(c => {
        const row = rowOf(c.id)
        return row ? chartRowForCategory(c, row) : undefined
      })
      .filter(chartRowVisible)
  }

  const node = getNode(categories, scopeId)
  if (!node) return []

  const childCats = getChildren(categories, node.id)
  if (childCats.length) {
    return childCats
      .map(c => {
        const row = rowOf(c.id)
        return row ? chartRowForCategory(c, row) : undefined
      })
      .filter(chartRowVisible)
  }

  return analyzeItemsUnderCategory(snapshot, categories, node)
}

/** 按分类 id 索引单期分析行（L1/L2） */
export function buildCategoryAnalysisMap(
  snapshot: Snapshot,
  categories: CategoryNode[]
): Map<string, PlanRowAnalysis> {
  const map = new Map<string, PlanRowAnalysis>()
  for (const level of [1, 2] as const) {
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
  targetAmount: number
  percentGap: number
  amountGap: number
  gapTrend: 'wider' | 'narrower' | 'same' | null
}

export interface TrendRow {
  key: string
  label: string
  cells: TrendCell[]
}

export function categoryAnalysisKey(node: CategoryNode): string {
  return `l${node.level}:${node.id}`
}

function findAnalysisRowByKey(
  snapshot: Snapshot,
  categories: CategoryNode[],
  rowKey: string
): PlanRowAnalysis | undefined {
  if (rowKey.startsWith('item:')) {
    return analyzeSnapshot(snapshot, categories).rows.find(r => r.key === rowKey)
  }
  const level = Number(rowKey[1]) as AnalysisLevel
  return analyzeSnapshot(snapshot, categories, level).rows.find(r => r.key === rowKey)
}

export function trendCellsForRowKey(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  rowKey: string
): TrendCell[] {
  const sorted = [...snapshots].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const cells: TrendCell[] = []
  let prevGap: number | null = null
  for (const s of sorted) {
    const row = findAnalysisRowByKey(s, categories, rowKey)
    if (!row) {
      cells.push({
        amount: 0,
        percent: 0,
        targetPercent: 0,
        targetAmount: 0,
        percentGap: 0,
        amountGap: 0,
        gapTrend: null
      })
      continue
    }
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
      targetAmount: row.targetAmount,
      percentGap: row.percentGap,
      amountGap: row.amountGap,
      gapTrend
    })
    prevGap = gap
  }
  return cells
}

export function productRowKeysUnderCategory(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  node: CategoryNode
): string[] {
  const keys = new Set<string>()
  for (const s of snapshots) {
    for (const row of analyzeItemsUnderCategory(s, categories, node)) keys.add(row.key)
  }
  const nameOf = (key: string) => {
    const id = key.slice(5)
    for (const s of snapshots) {
      const item = s.frozenPlan.items.find(i => i.id === id)
      if (item?.name) return item.name
    }
    return key
  }
  return [...keys].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'zh'))
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
    const cells = trendCellsForRowKey(sorted, categories, key)
    const label = findAnalysisRowByKey(sorted[0], categories, key)?.label ?? key
    rows.push({ key, label, cells })
  }
  return rows
}

function displayLabelForTrendKey(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  rowKey: string
): string {
  if (rowKey.startsWith('item:')) {
    const id = rowKey.slice(5)
    for (const s of snapshots) {
      const item = s.frozenPlan.items.find(i => i.id === id)
      if (item?.name) return item.name
    }
    return '—'
  }
  const id = rowKey.split(':')[1]
  return getNode(categories, id)?.name ?? rowKey
}

/** 趋势图：所选节点下的子级行 key（与柱状图 scope 规则一致） */
export function trendRowKeysForScope(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  scopeId: ChartScopeId
): string[] {
  if (scopeId === 'all') {
    return getChildren(categories, null).map(c => categoryAnalysisKey(c))
  }
  const node = getNode(categories, scopeId)
  if (!node) return []
  const childCats = getChildren(categories, node.id)
  if (childCats.length) return childCats.map(c => categoryAnalysisKey(c))
  return productRowKeysUnderCategory(snapshots, categories, node)
}

export function trendChartSeriesForScope(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  scopeId: ChartScopeId,
  maxSeries = 12
): { labels: string[]; datasets: { label: string; data: (number | null)[] }[] } {
  if (!snapshots.length) return { labels: [], datasets: [] }
  const sorted = [...snapshots].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const labels = sorted.map(s => s.label)
  const keys = trendRowKeysForScope(sorted, categories, scopeId)
  const series = keys.map(key => {
    const cells = trendCellsForRowKey(sorted, categories, key)
    const maxAbs = Math.max(0, ...cells.map(c => Math.abs(c.percentGap)))
    return {
      label: displayLabelForTrendKey(sorted, categories, key),
      data: cells.map(c => c.percentGap),
      maxAbs
    }
  })
  const visible = series.filter(s => s.maxAbs > 0.01)
  const ranked = (visible.length ? visible : series)
    .sort((a, b) => b.maxAbs - a.maxAbs)
    .slice(0, maxSeries)

  return {
    labels,
    datasets: ranked.map(({ label, data }) => ({ label, data }))
  }
}

export function trendChartSeries(
  snapshots: Snapshot[],
  categories: CategoryNode[],
  _level: AnalysisLevel,
  topN = 8
): { labels: string[]; datasets: { label: string; data: (number | null)[] }[] } {
  return trendChartSeriesForScope(snapshots, categories, 'all', topN)
}
