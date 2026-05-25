import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'

export const APP_THEME_STORAGE_KEY = 'funding-plan-theme'

/** 与设置页、App 根组件共用同一 storageKey，避免多处 useColorMode 互相覆盖主题 */
export function useAppColorMode() {
  const mode = useColorMode({ storageKey: APP_THEME_STORAGE_KEY })
  const isDark = computed(() => mode.value === 'dark')
  return { mode, isDark }
}
