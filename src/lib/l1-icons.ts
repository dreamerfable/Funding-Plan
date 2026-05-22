import type { Component } from 'vue'
import type { L1IconKey } from '../types'
import { Banknote, CandlestickChart, CircleDollarSign, Cuboid, Layers } from 'lucide-vue-next'

export const L1_ICON_OPTIONS: { key: L1IconKey; labelZh: string; labelEn: string }[] = [
  { key: 'gold', labelZh: '黄金', labelEn: 'Gold' },
  { key: 'equity', labelZh: '权益', labelEn: 'Equity' },
  { key: 'bond', labelZh: '债券', labelEn: 'Bonds' },
  { key: 'cash', labelZh: '现金', labelEn: 'Cash' },
  { key: 'asset', labelZh: '其他资产', labelEn: 'Other' }
]

export const L1_ICON_MAP: Record<L1IconKey, Component> = {
  gold: Cuboid,
  equity: CandlestickChart,
  bond: Banknote,
  cash: CircleDollarSign,
  asset: Layers
}

export function guessIconKey(name: string): L1IconKey {
  const n = name.toLowerCase()
  if (/黄金|gold/.test(n)) return 'gold'
  if (/权益|股票|股|equity|stock/.test(n)) return 'equity'
  if (/债|bond|固收/.test(n)) return 'bond'
  if (/现金|cash|货币|流动性/.test(n)) return 'cash'
  return 'asset'
}
