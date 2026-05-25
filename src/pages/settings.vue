<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useAppColorMode } from '../composables/useAppColorMode'
import { Download, Upload, Trash2, Languages, Sun, Moon, Monitor } from 'lucide-vue-next'
import { useAppStore } from '../composables/useAppStore'
import type { AppLocale, ThemeMode } from '../types'

const { t } = useI18n()
const { state, updateSettings, exportJson, importJson, resetAll } = useAppStore()
const { mode: colorMode } = useAppColorMode()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref('')

useHead({ title: () => t('nav.settings') })

const localeOptions = [
  { label: '中文', value: 'zh' as AppLocale },
  { label: 'English', value: 'en' as AppLocale }
]

const themeOptions = computed(() => [
  { label: t('settings.themeLight'), value: 'light' as ThemeMode, icon: Sun },
  { label: t('settings.themeDark'), value: 'dark' as ThemeMode, icon: Moon },
  { label: t('settings.themeSystem'), value: 'system' as ThemeMode, icon: Monitor }
])

function setLocale(v: AppLocale) {
  updateSettings({ locale: v })
}

function setTheme(v: ThemeMode) {
  updateSettings({ theme: v })
  colorMode.value = v === 'system' ? 'auto' : v
}

function doExport() {
  const blob = new Blob([exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jiuyi-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: t('settings.exportSuccess'), color: 'success' })
}

function onFile(e: Event) {
  importError.value = ''
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      importJson(String(reader.result))
      toast.add({ title: t('settings.importSuccess'), color: 'success' })
    } catch {
      importError.value = t('settings.importError')
    }
  }
  reader.readAsText(file)
  if (fileInput.value) fileInput.value.value = ''
}

function doReset() {
  if (window.confirm(t('settings.resetConfirm'))) {
    resetAll()
    setTheme('system')
    setLocale('zh')
  }
}
</script>

<template>
  <UContainer class="py-6 sm:py-8 max-w-lg">
    <UPageHeader :title="t('settings.title')" :description="t('settings.description')" />

    <UCard class="glass-card mt-6">
      <div class="px-1 pb-1">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
          {{ t('settings.preferences') }}
        </h3>
      </div>

      <div class="divide-y divide-default/60">
        <!-- 语言 -->
        <div class="flex flex-col gap-3 py-4 first:pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-elevated text-muted">
              <Languages class="size-4" />
            </div>
            <div>
              <p class="text-sm font-medium">{{ t('settings.language') }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:w-auto sm:min-w-[200px] pl-12 sm:pl-0">
            <UButton
              v-for="opt in localeOptions"
              :key="opt.value"
              block
              size="sm"
              :variant="state.settings.locale === opt.value ? 'solid' : 'outline'"
              :color="state.settings.locale === opt.value ? 'primary' : 'neutral'"
              @click="setLocale(opt.value)"
            >
              {{ opt.label }}
            </UButton>
          </div>
        </div>

        <!-- 外观 -->
        <div class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-elevated text-muted">
              <component :is="themeOptions.find(o => o.value === state.settings.theme)?.icon ?? Monitor" class="size-4" />
            </div>
            <div>
              <p class="text-sm font-medium">{{ t('settings.theme') }}</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 sm:w-auto sm:min-w-[240px] pl-12 sm:pl-0">
            <UButton
              v-for="opt in themeOptions"
              :key="opt.value"
              block
              size="sm"
              :variant="state.settings.theme === opt.value ? 'solid' : 'outline'"
              :color="state.settings.theme === opt.value ? 'primary' : 'neutral'"
              class="flex-col gap-1 !py-2.5 h-auto"
              @click="setTheme(opt.value)"
            >
              <component :is="opt.icon" class="size-4 shrink-0" />
              <span class="text-[11px] leading-tight">{{ opt.label }}</span>
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UCard class="glass-card mt-4">
      <div class="px-1 pb-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
          {{ t('settings.export') }} / {{ t('settings.import') }}
        </h3>
      </div>
      <p class="text-sm text-muted mb-4">{{ t('settings.importHint') }}</p>
      <div class="flex flex-col gap-2">
        <UButton block size="lg" @click="doExport">
          <Download class="size-4 mr-2 shrink-0" />
          {{ t('settings.export') }}
        </UButton>
        <UButton block size="lg" variant="outline" @click="fileInput?.click()">
          <Upload class="size-4 mr-2 shrink-0" />
          {{ t('settings.import') }}
        </UButton>
        <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onFile">
      </div>
      <p v-if="importError" class="text-sm text-error mt-3">{{ importError }}</p>
    </UCard>

    <UButton class="mt-6" color="error" variant="soft" block size="lg" @click="doReset">
      <Trash2 class="size-4 mr-2 shrink-0" />
      {{ t('settings.reset') }}
    </UButton>
  </UContainer>
</template>
