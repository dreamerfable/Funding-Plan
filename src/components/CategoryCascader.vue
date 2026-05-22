<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryNode } from '../types'
import { getChildren } from '../lib/categories'

const model = defineModel<{ l1: string; l2: string; l3: string }>({ required: true })

const props = defineProps<{ categories: CategoryNode[] }>()

const l1Options = computed(() => getChildren(props.categories, null))
const l2Options = computed(() => model.value.l1 ? getChildren(props.categories, model.value.l1) : [])
const l3Options = computed(() => model.value.l2 ? getChildren(props.categories, model.value.l2) : [])

function onL1(v: string) {
  model.value = { l1: v, l2: '', l3: '' }
}
function onL2(v: string) {
  model.value = { l1: model.value.l1, l2: v, l3: '' }
}
function onL3(v: string) {
  model.value = { ...model.value, l3: v }
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
    <USelect
      :model-value="model.l3"
      :items="l3Options.map(c => ({ label: c.name, value: c.id }))"
      :placeholder="$t('plan.level3')"
      :disabled="!model.l2"
      @update:model-value="onL3"
    />
  </div>
</template>
