<script setup lang="ts">
import type { L1IconKey } from '../types'
import { L1_ICON_MAP } from '../lib/l1-icons'

const props = withDefaults(defineProps<{ iconKey?: L1IconKey; size?: 'sm' | 'md' }>(), {
  iconKey: 'asset',
  size: 'md'
})

const sizeClass = props.size === 'sm' ? 'size-4' : 'size-5'
</script>

<template>
  <component :is="L1_ICON_MAP[iconKey ?? 'asset']" :class="[sizeClass, 'shrink-0']" />
</template>
