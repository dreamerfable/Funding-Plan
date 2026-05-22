<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
</script>

<template>
  <div class="flex items-center gap-2 min-w-0">
    <div class="flex items-center justify-center size-8 rounded-xl bg-primary/15 text-primary shrink-0">
      <TrendingUp class="size-5" />
    </div>
    <div class="min-w-0">
      <p class="text-sm font-semibold leading-tight truncate whitespace-nowrap">{{ $t('app.name') }}</p>
      <p class="text-[10px] text-muted leading-tight truncate whitespace-nowrap hidden sm:block">{{ $t('app.tagline') }}</p>
    </div>
  </div>
</template>
