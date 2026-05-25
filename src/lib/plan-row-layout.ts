/** 计划配置树：sm+ 为列对齐网格；小屏首行名称+占比，次行可展开操作 */
export const planRowGrid =
  'hidden sm:grid w-full grid-cols-[1.25rem_minmax(0,1fr)_2.5rem_4.5rem_4.75rem_0.75rem_1.5rem_1.5rem_1.5rem] gap-x-2 items-center min-h-[44px] px-3'

export const planRowCard = 'rounded-xl border border-default bg-elevated/40 overflow-hidden'

export const planRowMobile = 'flex flex-col gap-1 py-2 px-3 sm:hidden'
export const planRowMobileTop =
  'flex items-center gap-2 min-w-0 w-full cursor-pointer rounded-md -mx-1 px-1 active:bg-default/40'
export const planRowMobileTitle = 'min-w-0 flex-1 truncate text-left'
export const planRowMobileMetricsInline = 'ml-auto flex shrink-0 items-center gap-x-2'
export const planRowMobileActionsRow = 'flex justify-end min-h-7 pt-0.5'
export const planRowMobileActions = 'flex shrink-0 items-center gap-0.5'

export const planRowIconClass = 'size-4'

export const planRowCell = {
  icon: 'size-5 shrink-0',
  name: 'min-w-0 truncate',
  childSum: 'flex items-center justify-end shrink-0',
  withinGroup: 'tabular-nums text-right shrink-0 whitespace-nowrap',
  ofTotal: 'tabular-nums text-right shrink-0 whitespace-nowrap pe-2',
  actionsGap: 'shrink-0',
  action: 'size-7 shrink-0 justify-self-end'
} as const

export const planRowCol = {
  childSum: planRowCell.childSum,
  withinGroup: planRowCell.withinGroup,
  ofTotal: planRowCell.ofTotal,
  actionSlot: `inline-flex ${planRowCell.action} items-center justify-center`,
  editFields: 'col-start-2 col-span-8 flex min-w-0 items-center gap-2',
  editFieldsL1: 'col-start-2 col-span-7 flex min-w-0 items-center gap-2'
} as const

/** 一级分组：默认字号 + font-bold */
export const planRowNameClass: Record<1 | 2, string> = {
  1: `${planRowCell.name} font-bold`,
  2: `${planRowCell.name} text-xs font-semibold text-muted`
}

export const planRowWithinGroupClass: Record<1 | 2, string> = {
  1: `${planRowCell.withinGroup} font-bold`,
  2: `${planRowCell.withinGroup} text-xs font-semibold text-muted`
}

export const planRowOfTotalClass: Record<1 | 2, string> = {
  1: `${planRowCell.ofTotal} font-bold`,
  2: `${planRowCell.ofTotal} text-xs font-semibold text-muted`
}

/** 具体产品：text-sm + 默认字重 */
export const planRowProductNameClass = `${planRowCell.name} text-sm`
export const planRowProductWithinClass = `${planRowCell.withinGroup} text-sm`
export const planRowProductOfTotalClass = `${planRowCell.ofTotal} text-sm`

/** 小屏总占比：与桌面 ofTotal 同级样式，仅布局类 */
export const planRowMetricTotalClassL1 =
  'tabular-nums text-right shrink-0 whitespace-nowrap font-bold'

export const planRowMetricTotalClassL2 =
  'text-xs tabular-nums text-right shrink-0 whitespace-nowrap font-semibold text-muted'

export const planRowMetricTotalClassProduct =
  'text-sm tabular-nums text-right shrink-0 whitespace-nowrap'

export const planModalFormField = 'w-full'
export const planModalInput = 'w-full'
