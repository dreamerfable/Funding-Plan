<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { useAppStore } from '../../composables/useAppStore'
import { formatMoney } from '../../utils/format'
import { snapshotAllocationGap } from '../../lib/analysis'

const { t, locale } = useI18n()
const { state, removeSnapshot } = useAppStore()

useHead({ title: () => t('nav.snapshots') })

const sorted = computed(() =>
  [...state.snapshots].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
)

function investable(s: typeof state.snapshots[0]) {
  return s.totalAmount - s.excludeAmount
}

function confirmDelete(id: string) {
  if (window.confirm(t('snapshots.deleteConfirm'))) removeSnapshot(id)
}
</script>

<template>
  <UContainer class="py-6 sm:py-8 max-w-3xl">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <UPageHeader :title="t('snapshots.title')" :description="t('snapshots.description')" />
      <UButton to="/snapshots/new" class="shrink-0">
        <Plus class="size-4 mr-1" />
        {{ t('snapshots.add') }}
      </UButton>
    </div>

    <p v-if="!sorted.length" class="text-center text-muted py-16">{{ t('snapshots.empty') }}</p>

    <div v-else class="space-y-3 mt-6">
      <UCard
        v-for="s in sorted"
        :key="s.id"
        class="glass-card transition hover:border-primary/25"
      >
        <div class="flex justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold truncate">{{ s.label }}</p>
            <p class="text-xs text-muted">{{ s.recordedAt }}</p>
            <p class="text-sm mt-2">
              {{ t('snapshots.investable') }}:
              <span class="font-medium tabular-nums">{{ formatMoney(investable(s), locale) }}</span>
            </p>
            <p
              v-if="Math.abs(snapshotAllocationGap(s)) > 0.01"
              class="text-xs mt-1"
              :class="snapshotAllocationGap(s) > 0 ? 'text-warning' : 'text-info'"
            >
              {{ t('snapshots.allocationGap') }}: {{ formatMoney(snapshotAllocationGap(s), locale) }}
            </p>
          </div>
          <div class="flex flex-col gap-1 shrink-0">
            <UButton size="sm" variant="ghost" :to="`/snapshots/${s.id}`">
              <Pencil class="size-4" />
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              @click="confirmDelete(s.id)"
            >
              <Trash2 class="size-4" />
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
