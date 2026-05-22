export function formatMoney(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(n)
}

export function formatPercent(n: number, digits = 2): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

/** 分析表格：占比与金额统一两位小数 */
export const ANALYSIS_DECIMALS = 2

export function formatAnalysisMoney(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    minimumFractionDigits: ANALYSIS_DECIMALS,
    maximumFractionDigits: ANALYSIS_DECIMALS
  }).format(Number(n) || 0)
}

export function formatAnalysisPercent(n: number): string {
  return `${(Number(n) || 0).toFixed(ANALYSIS_DECIMALS)}%`
}

/** 首页总览表：占比取整 */
export function formatHomePercentInt(n: number): string {
  return `${Math.round(Number(n) || 0)}%`
}

export function formatAnalysisGapPercent(gap: number): string {
  const v = (Number(gap) || 0).toFixed(ANALYSIS_DECIMALS)
  return `${gap >= 0 ? '+' : ''}${v}%`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
