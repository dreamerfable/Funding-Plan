<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PlanCategorySortNode from './PlanCategorySortNode.vue'
import { useAppStore } from '../composables/useAppStore'
import { getChildren } from '../lib/categories'

const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()
const { state } = useAppStore()
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm text-muted rounded-lg border border-default/60 bg-elevated/30 px-3 py-2">
      {{ t('plan.sortModeHint') }}
    </p>

    <p v-if="!getChildren(state.categories, null).length" class="text-sm text-muted py-8 text-center">
      {{ t('plan.emptyTree') }}
    </p>

    <PlanCategorySortNode v-else :parent-id="null" />

    <UButton block size="lg" @click="emit('done')">
      {{ t('plan.exitSortMode') }}
    </UButton>
  </div>
</template>
