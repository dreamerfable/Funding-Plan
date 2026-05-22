<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryNode } from '../types'
import { getChildren } from '../lib/categories'

const model = defineModel<{ l1: string; l2: string }>({ required: true })

const props = defineProps<{ categories: CategoryNode[] }>()

const l1Options = computed(() => getChildren(props.categories, null))
const l2Options = computed(() => model.value.l1 ? getChildren(props.categories, model.value.l1) : [])

function onL1(v: string) {
  model.value = { l1: v, l2: '' }
}
function onL2(v: string) {
  model.value = { l1: model.value.l1, l2: v }
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
    <USelect
      :model-value="model.l1"
      :items="l1Options.map(c => ({ label: c.name, value: c.id }))"
      :placeholder="$t('plan.level1')"
      @update:model-value="onL1"
    />
    <USelect
      :model-value="model.l2"
      :items="l2Options.map(c => ({ label: c.name, value: c.id }))"
      :placeholder="$t('plan.level2')"
      :disabled="!model.l1"
      @update:model-value="onL2"
    />
  </div>
</template>
