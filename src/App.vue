<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useColorMode } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppNav from './components/AppNav.vue'
import { useAppStore } from './composables/useAppStore'

const colorMode = useColorMode({ storageKey: 'funding-plan-theme' })
const { updateSettings } = useAppStore()
const { t } = useI18n()
const route = useRoute()

const themeColor = computed(() => (colorMode.value === 'dark' ? '#09090b' : '#fafafa'))
const appName = computed(() => t('app.name'))

useHead({
  title: appName,
  titleTemplate: (title) => (title && title !== appName.value ? `${title} · ${appName.value}` : appName.value),
  meta: [{ name: 'theme-color', content: themeColor }]
})

function onColorModeChange() {
  const v = colorMode.value
  updateSettings({ theme: v === 'auto' ? 'system' : (v as 'light' | 'dark') })
}
</script>

<template>
  <UApp :toaster="{ position: 'top-center' }">
    <UHeader
      :toggle="false"
      class="border-b border-default/80 bg-default/85 backdrop-blur-xl sticky top-0 z-40"
    >
      <template #left>
        <RouterLink to="/" class="shrink-0 transition-opacity hover:opacity-90">
          <AppLogo />
        </RouterLink>
      </template>
      <template #right>
        <UColorModeButton @update:model-value="onColorModeChange" />
      </template>
    </UHeader>

    <UMain class="min-h-[calc(100dvh-3.5rem)] pb-[calc(4.75rem+env(safe-area-inset-bottom))]">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </UMain>

    <AppNav />
  </UApp>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
