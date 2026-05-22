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

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
