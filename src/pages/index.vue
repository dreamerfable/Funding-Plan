<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import HomeDriftPanel from '../components/home/HomeDriftPanel.vue'
import HomeOverviewPanel from '../components/home/HomeOverviewPanel.vue'
import { useAppStore } from '../composables/useAppStore'
import { getLatestSnapshot, getPreviousSnapshot } from '../lib/analysis'

const { t } = useI18n()
const { state } = useAppStore()

useHead({ title: () => t('nav.home') })

const latest = computed(() => getLatestSnapshot(state.snapshots))
const previous = computed(() => {
  const snap = latest.value
  return snap ? getPreviousSnapshot(state.snapshots, snap) : undefined
})
</script>

<template>
  <div v-if="latest" class="home-pager">
    <HomeOverviewPanel :latest="latest" :previous="previous" />
    <HomeDriftPanel :latest="latest" />
  </div>

  <section
    v-else
    class="home-panel flex flex-col items-center justify-center text-center px-6"
  >
    <p class="text-xl font-medium text-muted">{{ t('home.noSnapshot') }}</p>
    <p class="text-base text-muted/80 mt-3">{{ t('home.noSnapshotHint') }}</p>
    <UButton to="/snapshots/new" class="mt-8" size="lg">
      {{ t('snapshots.add') }}
    </UButton>
  </section>
</template>

<style scoped>
.home-pager {
  height: calc(100dvh - 3.5rem - 4.75rem - env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
}

.home-panel {
  height: calc(100dvh - 3.5rem - 4.75rem - env(safe-area-inset-bottom, 0px));
  min-height: calc(100dvh - 3.5rem - 4.75rem - env(safe-area-inset-bottom, 0px));
  scroll-snap-align: start;
  scroll-snap-stop: always;
  flex-shrink: 0;
}
</style>
