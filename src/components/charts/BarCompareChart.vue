<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useColorMode } from '@vueuse/core'

Chart.register(...registerables)

const props = defineProps<{
  labels: string[]
  target: number[]
  actual: number[]
  targetLabel?: string
  actualLabel?: string
  title?: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const colorMode = useColorMode()
let chart: Chart | null = null

const isDark = computed(() => colorMode.value === 'dark')

function render() {
  if (!canvasRef.value) return
  chart?.destroy()
  const text = isDark.value ? '#e4e4e7' : '#3f3f46'
  const grid = isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.targetLabel ?? 'Target',
          data: props.target,
          backgroundColor: 'rgba(16, 185, 129, 0.65)',
          borderRadius: 6
        },
        {
          label: props.actualLabel ?? 'Actual',
          data: props.actual,
          backgroundColor: 'rgba(59, 130, 246, 0.65)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: text } },
        title: props.title ? { display: true, text: props.title, color: text } : undefined
      },
      scales: {
        x: { ticks: { color: text, maxRotation: 45, minRotation: 0 }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { color: grid } }
      }
    }
  })
}

onMounted(render)
watch(() => [props.labels, props.target, props.actual, isDark.value], render, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div class="h-64 sm:h-80 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
