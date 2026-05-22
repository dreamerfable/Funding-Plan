<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Save } from 'lucide-vue-next'
import { useAppStore } from '../../composables/useAppStore'
import { getPathNames } from '../../lib/categories'
import { formatMoney, todayIso } from '../../utils/format'
import type { SnapshotLine } from '../../types'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { state, addSnapshot, updateSnapshot } = useAppStore()

const isNew = computed(() => route.params.id === 'new')
const existing = computed(() =>
  isNew.value ? null : state.snapshots.find(s => s.id === route.params.id)
)

useHead({ title: () => (isNew.value ? t('snapshots.add') : t('snapshots.edit')) })

const form = ref({
  label: '',
  recordedAt: todayIso(),
  totalAmount: 0,
  excludeAmount: 0,
  lines: {} as Record<string, number>
})

watch(
  existing,
  (s) => {
    if (s) {
      form.value = {
        label: s.label,
        recordedAt: s.recordedAt.slice(0, 10),
        totalAmount: s.totalAmount,
        excludeAmount: s.excludeAmount,
        lines: Object.fromEntries(s.lines.map(l => [l.planItemId, l.amount]))
      }
    } else if (isNew.value) {
      form.value.lines = Object.fromEntries(state.plan.items.map(i => [i.id, 0]))
    }
  },
  { immediate: true }
)

watch(
  () => state.plan.items.length,
  () => {
    if (isNew.value) {
      for (const item of state.plan.items) {
        if (!(item.id in form.value.lines)) form.value.lines[item.id] = 0
      }
    }
  }
)

const planForForm = computed(() => (existing.value?.frozenPlan ?? state.plan).items)

const investable = computed(() => form.value.totalAmount - form.value.excludeAmount)
const linesTotal = computed(() =>
  planForForm.value.reduce((s, i) => s + (Number(form.value.lines[i.id]) || 0), 0)
)
const gap = computed(() => linesTotal.value - investable.value)

const draftSnapshot = computed(() => ({
  totalAmount: form.value.totalAmount,
  excludeAmount: form.value.excludeAmount,
  lines: planForForm.value.map(i => ({
    planItemId: i.id,
    amount: Number(form.value.lines[i.id]) || 0
  })) as SnapshotLine[]
}))

function save() {
  const payload = {
    label: form.value.label.trim() || form.value.recordedAt,
    recordedAt: form.value.recordedAt,
    totalAmount: Number(form.value.totalAmount) || 0,
    excludeAmount: Number(form.value.excludeAmount) || 0,
    lines: draftSnapshot.value.lines
  }
  if (isNew.value) {
    addSnapshot(payload)
    router.push('/snapshots')
  } else if (existing.value) {
    updateSnapshot(existing.value.id, payload)
    router.push('/snapshots')
  }
}
</script>

<template>
  <UContainer class="py-6 sm:py-8 max-w-3xl">
    <div class="flex items-end justify-between gap-3">
      <h1 class="text-lg sm:text-2xl font-semibold text-highlighted min-w-0 leading-tight truncate pb-1.5">
        {{ isNew ? t('snapshots.add') : t('snapshots.edit') }}
      </h1>
      <UButton
        to="/snapshots"
        variant="ghost"
        color="neutral"
        size="md"
        class="shrink-0 -mr-1 text-base"
      >
        {{ t('common.back') }}
      </UButton>
    </div>

    <UCard class="glass-card mt-4">
      <div class="flex flex-col gap-4">
        <UFormField :label="t('snapshots.label')" class="w-full">
          <UInput v-model="form.label" class="w-full" :placeholder="form.recordedAt" />
        </UFormField>
        <UFormField :label="t('snapshots.recordedAt')" class="w-full">
          <UInput v-model="form.recordedAt" class="w-full" type="date" />
        </UFormField>
        <UFormField :label="t('snapshots.totalAssets')" class="w-full">
          <UInput v-model.number="form.totalAmount" class="w-full" type="number" min="0" step="0.01" />
        </UFormField>
        <UFormField :label="t('snapshots.excluded')" class="w-full">
          <UInput v-model.number="form.excludeAmount" class="w-full" type="number" min="0" step="0.01" />
        </UFormField>
      </div>
    </UCard>

    <div
      class="sticky top-14 z-30 mt-4 p-4 sm:p-5 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-xl supports-[backdrop-filter]:bg-default/90 shadow-sm"
    >
      <p class="text-xs text-muted">{{ t('snapshots.investable') }}</p>
      <p class="text-2xl font-semibold tabular-nums">{{ formatMoney(investable, locale) }}</p>
      <p v-if="Math.abs(gap) > 0.01" class="text-sm mt-2 text-warning">
        {{ t('snapshots.allocationGap') }}: {{ formatMoney(gap, locale) }}
        <span class="text-xs text-muted block">{{ t('snapshots.gapHint') }}</span>
      </p>
    </div>

    <UCard class="glass-card mt-4">
      <h3 class="font-semibold mb-4">{{ t('snapshots.lines') }}</h3>
      <p v-if="!planForForm.length" class="text-sm text-muted">{{ t('plan.noItems') }}</p>
      <div v-else class="space-y-3">
        <div
          v-for="item in planForForm"
          :key="item.id"
          class="grid sm:grid-cols-[1fr_140px] gap-2 items-center py-2 border-b border-default/50 last:border-0"
        >
          <div>
            <p class="text-sm font-medium">{{ item.name }}</p>
            <p class="text-xs text-muted">
              {{ getPathNames(state.categories, item.categoryL1Id, item.categoryL2Id, item.categoryL3Id) }}
            </p>
          </div>
          <UInput
            v-model.number="form.lines[item.id]"
            class="w-full"
            type="number"
            min="0"
            step="0.01"
            :placeholder="t('snapshots.amount')"
          />
        </div>
      </div>
    </UCard>

    <UButton class="mt-6 w-full sm:w-auto" size="lg" block :disabled="!form.recordedAt" @click="save">
      <Save class="size-4 mr-2" />
      {{ t('common.save') }}
    </UButton>
  </UContainer>
</template>
