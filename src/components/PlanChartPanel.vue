<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PlanOverviewTree from './PlanOverviewTree.vue'

const { t } = useI18n()
const showItems = ref(false)
const weightMode = ref<'parent' | 'total'>('parent')
</script>

<template>
  <div class="space-y-4 py-2">
    <div class="flex items-center justify-between gap-3 px-1 min-h-8">
      <label class="inline-flex items-center gap-2 cursor-pointer shrink-0">
        <span class="text-sm text-muted whitespace-nowrap leading-none">{{ t('plan.showItems') }}</span>
        <USwitch v-model="showItems" class="shrink-0" />
      </label>
      <UTabs
        v-model="weightMode"
        :content="false"
        :items="[
          { label: t('plan.weightModeParent'), value: 'parent' },
          { label: t('plan.weightModeTotal'), value: 'total' }
        ]"
        size="xs"
        class="shrink-0 self-center"
      />
    </div>

    <PlanOverviewTree :show-items="showItems" :weight-mode="weightMode" />
  </div>
</template>
