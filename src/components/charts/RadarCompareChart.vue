<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAppColorMode } from '../../composables/useAppColorMode'

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
const { isDark } = useAppColorMode()
let chart: Chart | null = null

function render() {
  if (!canvasRef.value) return
  chart?.destroy()
  const text = isDark.value ? '#e4e4e7' : '#3f3f46'
  const grid = isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  chart = new Chart(canvasRef.value, {
    type: 'radar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.targetLabel ?? 'Target',
          data: props.target,
          borderColor: 'rgba(16, 185, 129, 0.9)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          pointBackgroundColor: 'rgba(16, 185, 129, 0.9)',
          pointBorderColor: 'rgba(16, 185, 129, 0.9)',
          borderWidth: 2
        },
        {
          label: props.actualLabel ?? 'Actual',
          data: props.actual,
          borderColor: 'rgba(59, 130, 246, 0.9)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          pointBackgroundColor: 'rgba(59, 130, 246, 0.9)',
          pointBorderColor: 'rgba(59, 130, 246, 0.9)',
          borderWidth: 2
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
        r: {
          beginAtZero: true,
          ticks: {
            color: text,
            backdropColor: 'transparent',
            callback: v => `${v}%`
          },
          grid: { color: grid },
          angleLines: { color: grid },
          pointLabels: {
            color: text,
            font: { size: 11 }
          }
        }
      }
    }
  })
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  render()
  const el = canvasRef.value?.parentElement
  if (el) {
    resizeObserver = new ResizeObserver(() => render())
    resizeObserver.observe(el)
  }
})

watch(() => [props.labels, props.target, props.actual, isDark.value], render, { deep: true })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.destroy()
})
</script>

<template>
  <div class="h-64 sm:h-80 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
