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
  ofTotal: 'text-sm tabular-nums text-right shrink-0 whitespace-nowrap pe-2',
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

export const planRowNameClass: Record<1 | 2, string> = {
  1: `${planRowCell.name} text-sm font-semibold`,
  2: `${planRowCell.name} text-sm text-muted`
}

export const planRowWithinGroupClass: Record<1 | 2, string> = {
  1: `${planRowCell.withinGroup} text-xs`,
  2: `${planRowCell.withinGroup} text-xs text-muted`
}

export const planRowProductNameClass = `${planRowCell.name} text-sm`

/** 小屏总占比：与桌面 ofTotal 同色，仅字号随断点缩小 */
export const planRowMetricTotalClass =
  'text-xs tabular-nums text-right shrink-0 whitespace-nowrap sm:text-sm'

export const planModalFormField = 'w-full'
export const planModalInput = 'w-full'
