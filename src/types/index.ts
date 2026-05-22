export type CategoryLevel = 1 | 2 | 3

export type L1IconKey = 'gold' | 'equity' | 'bond' | 'cash' | 'asset'

export interface CategoryNode {
  id: string
  name: string
  level: CategoryLevel
  parentId: string | null
  /** 同级排序，越小越靠前 */
  sortOrder?: number
  /** L1=占总资产%; L2=占一级%; L3=占二级%; 配置项=占三级% */
  weightOfParent?: number
  iconKey?: L1IconKey
}

export interface PlanItem {
  id: string
  name: string
  categoryL1Id: string
  categoryL2Id: string
  categoryL3Id: string
  targetPercent: number
}

export interface InvestmentPlan {
  id: string
  updatedAt: string
  items: PlanItem[]
}

export interface SnapshotLine {
  planItemId: string
  amount: number
}

export interface Snapshot {
  id: string
  label: string
  recordedAt: string
  createdAt: string
  updatedAt: string
  totalAmount: number
  excludeAmount: number
  lines: SnapshotLine[]
  frozenPlan: InvestmentPlan
}

export type ThemeMode = 'light' | 'dark' | 'system'
export type AppLocale = 'zh' | 'en'

export interface AppSettings {
  locale: AppLocale
  theme: ThemeMode
}

export interface AppState {
  version: 1
  categories: CategoryNode[]
  plan: InvestmentPlan
  snapshots: Snapshot[]
  settings: AppSettings
}

export type AnalysisLevel = 1 | 2 | 3

export interface PlanRowAnalysis {
  key: string
  label: string
  level: AnalysisLevel
  targetPercent: number
  targetAmount: number
  actualAmount: number
  actualPercent: number
  percentGap: number
  amountGap: number
}

export interface PlanChartSegment {
  id: string
  label: string
  percent: number
  color: string
}
