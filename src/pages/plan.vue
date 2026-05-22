<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import PlanChartPanel from '../components/PlanChartPanel.vue'
import PlanTreePanel from '../components/PlanTreePanel.vue'

const { t } = useI18n()
const toast = useToast()
const view = ref<'chart' | 'edit'>('chart')

useHead({ title: () => t('nav.plan') })

function onPlanSaved() {
  toast.add({
    title: t('plan.saveDoneTitle'),
    description: t('plan.saveDoneDesc'),
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <UContainer class="py-6 sm:py-8 max-w-4xl">
    <UPageHeader :title="t('plan.title')" :description="t('plan.description')" />

    <UTabs
      v-model="view"
      :items="[
        { label: t('plan.tabChart'), value: 'chart' },
        { label: t('plan.tabEdit'), value: 'edit' }
      ]"
      class="mt-4"
    />

    <UCard v-if="view === 'chart'" class="glass-card mt-4">
      <PlanChartPanel />
    </UCard>

    <UCard v-else class="glass-card mt-4 plan-config">
      <PlanTreePanel @save="onPlanSaved" />
    </UCard>
  </UContainer>
</template>

<style scoped>
.plan-config :deep(input[type='number']) {
  -moz-appearance: textfield;
  appearance: textfield;
}

.plan-config :deep(input[type='number']::-webkit-inner-spin-button),
.plan-config :deep(input[type='number']::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
</style>
