<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LayoutDashboard, PieChart, LineChart, Camera, Settings } from 'lucide-vue-next'

const route = useRoute()
const { t } = useI18n()

const items = [
  { to: '/', label: 'nav.home', icon: LayoutDashboard },
  { to: '/plan', label: 'nav.plan', icon: PieChart },
  { to: '/snapshots', label: 'nav.snapshots', icon: Camera },
  { to: '/analysis', label: 'nav.analysis', icon: LineChart },
  { to: '/settings', label: 'nav.settings', icon: Settings }
]

function active(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-50 border-t border-default/80 bg-default/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)] pb-[env(safe-area-inset-bottom)]"
    aria-label="Main navigation"
  >
    <div class="grid grid-cols-5 gap-1 px-2 pt-2 pb-2 max-w-lg mx-auto sm:max-w-xl md:max-w-2xl">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl text-[11px] font-medium transition-all duration-200 active:scale-95"
        :class="active(item.to)
          ? 'text-primary bg-primary/10'
          : 'text-muted hover:text-highlighted hover:bg-elevated/60'"
      >
        <component :is="item.icon" class="size-5 shrink-0" :stroke-width="active(item.to) ? 2.25 : 2" />
        <span class="truncate max-w-full px-1 leading-tight">{{ t(item.label) }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
