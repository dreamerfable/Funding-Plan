<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { usePlanMobileExpand } from '../composables/usePlanMobileExpand'
import {
  planRowCell,
  planRowIconClass,
  planRowMetricTotalClassL1,
  planRowMetricTotalClassL2,
  planRowMobile,
  planRowMobileActions,
  planRowMobileActionsRow,
  planRowMobileMetricsInline,
  planRowMobileTitle,
  planRowMobileTop,
  planRowWithinGroupClass
} from '../lib/plan-row-layout'

const props = withDefaults(
  defineProps<{
    rowKey: string
    name: string
    nameClass: string
    within: string
    total: string
    level: 1 | 2
    showWarn?: boolean
    showWithin?: boolean
    metricsIndent?: boolean
    withinClass?: string
    totalClass?: string
    extraClass?: string
  }>(),
  { showWithin: true }
)

const emit = defineEmits<{ warn: [] }>()

const { t } = useI18n()
const { expandedRowKey, toggleRowExpand } = usePlanMobileExpand()

const expanded = computed(() => expandedRowKey.value === props.rowKey)

function onRowClick() {
  toggleRowExpand(props.rowKey)
}
</script>

<template>
  <div :class="[planRowMobile, extraClass]">
    <div :class="planRowMobileTop" role="button" tabindex="0" @click="onRowClick" @keyup.enter="onRowClick">
      <slot name="leading" />
      <span :class="[nameClass, planRowMobileTitle]">{{ name }}</span>
      <div :class="[planRowMobileMetricsInline, metricsIndent ? 'sm:pl-0 pl-5' : '']">
        <UButton
          v-if="showWarn"
          size="xs"
          variant="ghost"
          color="warning"
          :class="planRowCell.action"
          :aria-label="t('plan.childSumWarnTitle')"
          @click.stop="emit('warn')"
        >
          <AlertTriangle :class="planRowIconClass" />
        </UButton>
        <span v-if="showWithin" :class="withinClass ?? planRowWithinGroupClass[level]">{{ within }}</span>
        <span
          :class="
            totalClass ??
            (level === 1 ? planRowMetricTotalClassL1 : planRowMetricTotalClassL2)
          "
        >{{ total }}</span>
      </div>
    </div>
    <div v-show="expanded" :class="planRowMobileActionsRow" @click.stop>
      <div :class="planRowMobileActions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
